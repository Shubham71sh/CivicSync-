import re
from collections import Counter
from typing import Any, Dict, Iterable, List, Optional


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

    def __init__(self, db):
        self.db = db

    @staticmethod
    def _tokens(text: Any) -> List[str]:
        return re.findall(r"\b[\w-]+\b", str(text or "").lower())

    def _keywords(self, text: Any) -> List[str]:
        return [
            word for word in self._tokens(text)
            if word not in self.STOPWORDS and len(word) > 2
        ]

    @staticmethod
    def _document_text(document: Dict[str, Any]) -> str:
     values: Iterable[Any] = (
        document.get("title", ""),
        document.get("billNumber", ""),
        document.get("summary", ""),
        document.get("content", ""),
        document.get("description", ""),
        document.get("category", ""),
        document.get("objectives", ""),
        document.get("provisions", ""),
        " ".join(document.get("tags", []) or []),
        " ".join(document.get("keyPoints", []) or []),
        " ".join(document.get("eligibilityCriteria", []) or []),
        document.get("benefits", ""),
        document.get("extractedText", ""),
    )

     return "\n".join(
        str(value) for value in values if value
    )
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
        if len(normalized) <= 2500:
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
        selected_indexes = sorted(index for index, _ in ranked[:12])
        excerpt = " ".join(sentences[index] for index in selected_indexes).strip()
        return (excerpt or normalized[:2500])[:4000]

    async def search_documents(
        self,
        question: str,
        profile: Optional[Dict[str, Any]] = None,
        user_id: Optional[str] = None,
        limit: int = 5,
    ) -> List[dict]:
        """Rank a user's uploads and shared government records for their profile.

        Profile terms are deliberately used for scheme/eligibility questions. That
        allows a question such as "What schemes am I eligible for?" to discover a
        document which mentions the citizen's location or occupation even when the
        question itself contains no document-specific keyword.
        """
        question_keywords = self._keywords(question)
        profile_keywords = self._profile_keywords(profile)
        eligibility_question = self._is_eligibility_question(question_keywords)
        focus_terms = list(dict.fromkeys(question_keywords + profile_keywords))

        # Python ranking keeps MongoDB and the local JSON fallback consistent, and it
        # includes the extracted PDF text rather than just an AI-generated summary.
        cursor = self.db.government_documents.find({}).limit(100)
        ranked_documents = []

        async for document in cursor:
            is_owner = user_id is not None and str(document.get("userId")) == str(user_id)
            is_shared_government_record = (
                document.get("isGovernmentDocument") is True
                or document.get("visibility") == "government"
            )
            if not (is_owner or is_shared_government_record):
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

            # Normal questions need a direct factual match. An eligibility question
            # may also match a scheme document through eligibility rules alone.
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
            title = doc.get("title", "")
            number = doc.get("billNumber", "")
            official_source = doc.get("officialSource", "")

            if official_source:
                sources.append(f"{title} — {official_source}")
            elif number:
                sources.append(f"{title} ({number})")
            else:
                sources.append(title)

        return sources
