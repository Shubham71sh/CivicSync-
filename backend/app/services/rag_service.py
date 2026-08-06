"""
RAG Service — Firestore-based government document retrieval and ranking.

Migration notes (MongoDB → Firebase):
- Removed: `cursor = self.db.government_documents.find({}).limit(100)`
  and `async for document in cursor:` (Motor async iterator pattern).
- Replaced with: `asyncio.run_in_executor` wrapping a synchronous
  `list(get_col("government_documents").limit(100).stream())` call.
- The `db` constructor argument is accepted but ignored for backward
  compatibility with ChatService which instantiates `RAGService(db)`.
- All scoring and ranking logic is unchanged.
"""

import re
import asyncio
from collections import Counter
from typing import Any, Dict, Iterable, List, Optional
from app.config.database import get_col


class RAGService:
    """Find government-document evidence that is relevant to a citizen and question."""

    STOPWORDS = {
        "what", "is", "the", "of", "to", "and", "a", "an", "in", "on",
        "for", "about", "tell", "me", "please", "how", "can", "i", "my",
        "do", "does", "with", "under", "from", "am",
    }

    ELIGIBILITY_TERMS = {
        "eligibility", "eligible", "qualify", "qualification", "scheme",
        "schemes", "benefit", "benefits", "subsidy", "subsidies", "grant",
        "grants", "assistance", "support", "welfare", "apply", "application",
    }

    PROFILE_FIELDS = (
        "location", "profession", "income", "employmentStatus", "category",
        "disabilityStatus", "veteranStatus", "studentStatus",
    )

    def __init__(self, db=None):
        # `db` is accepted for backward compatibility; Firestore is used directly.
        pass

    @staticmethod
    def _tokens(text: Any) -> List[str]:
        return re.findall(r"\b[\w-]+\b", str(text or "").lower())

    def _keywords(self, text: Any) -> List[str]:
        return [
            word for word in self._tokens(text)
            if word not in self.STOPWORDS and len(word) > 2
        ]

    @staticmethod
    def _safe_join(items) -> str:
        """Join a list that may contain strings or dicts safely."""
        if not items:
            return ""
        result = []
        for item in items:
            if isinstance(item, str):
                result.append(item)
            elif isinstance(item, dict):
                result.append(" ".join(str(v) for v in item.values()))
            else:
                result.append(str(item))
        return " ".join(result)

    @staticmethod
    def _document_text(document: Dict[str, Any]) -> str:
        values: Iterable[Any] = (
            document.get("title", ""),
            document.get("name", ""),
            document.get("billNumber", ""),
            document.get("summary", ""),
            document.get("content", ""),
            document.get("description", ""),
            document.get("category", ""),
            document.get("objectives", ""),
            document.get("provisions", ""),
            document.get("eligibility", ""),
            document.get("benefits", ""),
            document.get("state", ""),
            document.get("userImpact", ""),
            document.get("extractedText", ""),
        )
        text = "\n".join(str(v) for v in values if v)

        # Handle list fields safely (may contain strings or dicts)
        for field in ("tags", "keyPoints", "eligibilityCriteria"):
            val = document.get(field)
            if val:
                text += "\n" + RAGService._safe_join(val)

        return text

    def _profile_keywords(self, profile: Optional[Dict[str, Any]]) -> List[str]:
        if not profile:
            return []
        profile_text = " ".join(
            str(profile.get(field, "")) for field in self.PROFILE_FIELDS
        )
        return self._keywords(profile_text)

    @staticmethod
    def _is_eligibility_question(question_keywords: List[str]) -> bool:
        return bool(set(question_keywords) & RAGService.ELIGIBILITY_TERMS)

    def _make_excerpt(self, text: str, focus_terms: List[str]) -> str:
        """Keep the relevant evidence while avoiding a full-PDF prompt."""
        normalized = re.sub(r"\s+", " ", text).strip()
        if len(normalized) <= 1500:
            return normalized

        sentences = re.split(r"(?<=[.!?])\s+", normalized)
        ranked = sorted(
            enumerate(sentences),
            key=lambda item: (
                sum(term in item[1].lower() for term in focus_terms),
                -item[0],
            ),
            reverse=True,
        )
        selected_indexes = sorted(index for index, _ in ranked[:6])
        excerpt = " ".join(sentences[index] for index in selected_indexes).strip()
        return (excerpt or normalized[:1500])[:2000]

    async def search_documents(
        self,
        question: str,
        profile: Optional[Dict[str, Any]] = None,
        user_id: Optional[str] = None,
        limit: int = 3,
    ) -> List[dict]:
        """
        Rank government documents from Firestore for relevance to the question
        and the citizen's profile.

        Profile terms are deliberately used for scheme/eligibility questions — this
        allows "What schemes am I eligible for?" to discover a document mentioning
        the citizen's location or occupation even when the question has no direct
        document-specific keyword.
        """
        question_keywords = self._keywords(question)
        profile_keywords = self._profile_keywords(profile)
        eligibility_question = self._is_eligibility_question(question_keywords)
        focus_terms = list(dict.fromkeys(question_keywords + profile_keywords))

        # ── Fetch from all 3 collections in parallel ─────────────────────────────
        loop = asyncio.get_event_loop()

        def _fetch_all():
            gov_docs  = list(get_col("government_documents").limit(100).stream())
            bills     = list(get_col("bills").limit(100).stream())
            schemes   = list(get_col("schemes").limit(100).stream())
            return gov_docs + bills + schemes

        raw_docs = await loop.run_in_executor(None, _fetch_all)

        # ── Rank in-memory ────────────────────────────────────────────────────────
        ranked_documents = []
        for doc_snapshot in raw_docs:
            document = doc_snapshot.to_dict() or {}
            document["id"] = doc_snapshot.id

            # Bills and schemes are public — always include them
            # government_documents respect owner/visibility rules
            is_owner = (
                user_id is not None
                and str(document.get("userId")) == str(user_id)
            )
            is_shared_government_record = (
                document.get("isGovernmentDocument") is True
                or document.get("visibility") == "government"
            )
            # schemes and bills are always public
            is_public = (
                document.get("status") in ("active", "passed", "pending", "under_review")
                or document.get("name") is not None   # schemes have "name" field
                or document.get("billNumber") is not None  # bills have "billNumber"
            )
            if not (is_owner or is_shared_government_record or is_public):
                continue

            document_text = self._document_text(document)
            document_terms = Counter(self._tokens(document_text))
            question_score = sum(min(document_terms[word], 3) for word in question_keywords)
            profile_score = sum(min(document_terms[word], 2) for word in profile_keywords)
            eligibility_score = sum(
                min(document_terms[word], 2) for word in self.ELIGIBILITY_TERMS
            )

            if eligibility_question:
                score = question_score * 4 + profile_score * 3 + eligibility_score * 2
            else:
                score = question_score * 5 + profile_score

            if score == 0 or (not eligibility_question and question_score == 0):
                continue

            result = dict(document)
            result["contextExcerpt"] = self._make_excerpt(document_text, focus_terms)
            result["retrievalScore"] = score
            ranked_documents.append(result)

        ranked_documents.sort(
            key=lambda document: (
                document["retrievalScore"],
                document.get("uploadedAt", ""),
            ),
            reverse=True,
        )
        return ranked_documents[:limit]

    async def get_sources(self, documents: List[dict]):
        sources = []
        for doc in documents:
            title = doc.get("title", "") or doc.get("name", "")
            number = doc.get("billNumber", "")
            official_source = doc.get("officialSource", "")
            state = doc.get("state", "")

            if official_source:
                sources.append(f"{title} — {official_source}")
            elif number:
                sources.append(f"{title} ({number})")
            elif state and state != "All States":
                sources.append(f"{title} ({state})")
            else:
                sources.append(title)

        return [s for s in sources if s]
