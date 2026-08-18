from datetime import date
from typing import List


class PromptBuilder:

    @staticmethod
    def _profile_text(profile: dict) -> str:
        if not profile:
            return "No citizen profile available."

        details = []

        location = profile.get("location") or ", ".join(
            value for value in (
                profile.get("district"),
                profile.get("state")
            ) if value
        )
        if location:
            details.append(f"Location: {location}")

        dob = profile.get("dob", "")
        age = profile.get("age", "")

        if dob and not age:
            try:
                birth = date.fromisoformat(str(dob)[:10])
                today = date.today()
                age = today.year - birth.year - (
                    (today.month, today.day) < (birth.month, birth.day)
                )
            except Exception:
                age = ""

        if age:
            details.append(f"Age: {age}")

        fields = [
            ("Profession", "profession"),
            ("Income", "income"),
            ("Employment Status", "employmentStatus"),
            ("Category", "category"),
            ("Student", "studentStatus"),
            ("Disability", "disabilityStatus"),
            ("Veteran", "veteranStatus"),
            ("Household Size", "householdSize"),
        ]

        for label, key in fields:
            value = profile.get(key)
            if value:
                details.append(f"{label}: {value}")

        return "\n".join(details) if details else "No profile details available."

    @staticmethod
    def _safe_text(value) -> str:
        """Convert any value (list of str or dicts) to plain string."""
        if not value:
            return ""
        if isinstance(value, list):
            parts = []
            for item in value:
                if isinstance(item, str):
                    parts.append(item)
                elif isinstance(item, dict):
                    parts.append(" ".join(str(v) for v in item.values()))
                else:
                    parts.append(str(item))
            return ", ".join(parts)
        return str(value)

    @staticmethod
    def build(
        profile: dict,
        history: List[dict],
        documents: List[dict],
        question: str,
        language="English"
    ):
        profile_text = PromptBuilder._profile_text(profile)

        history_text = ""
        for message in history[-5:]:  # only last 5 messages to save tokens
            role = "Citizen" if message.get("type") == "user" else "Assistant"
            history_text += f"{role}: {message.get('text', '')}\n"

        document_text = ""
        for doc in documents:
            title       = doc.get("title") or doc.get("name", "")
            summary     = doc.get("summary") or doc.get("description", "")
            eligibility = PromptBuilder._safe_text(
                doc.get("eligibilityCriteria") or doc.get("eligibility", "")
            )
            benefits    = PromptBuilder._safe_text(doc.get("benefits", ""))
            key_points  = PromptBuilder._safe_text(doc.get("keyPoints", ""))
            excerpt     = doc.get("contextExcerpt", "")[:600]
            bill_number = doc.get("billNumber", "")
            status      = doc.get("status", "")
            source      = doc.get("officialSource", "")

            document_text += f"""
---
Title: {title}
{f"Bill/Ref Number: {bill_number}" if bill_number else ""}
{f"Status: {status}" if status else ""}
{f"Summary: {summary}" if summary else ""}
{f"Eligibility: {eligibility}" if eligibility else ""}
{f"Benefits: {benefits}" if benefits else ""}
{f"Key Points: {key_points}" if key_points else ""}
{f"Official Source: {source}" if source else ""}
{f"Excerpt: {excerpt}" if excerpt else ""}
---
"""

        return f"""You are CivicSync AI — a friendly assistant that helps Indian citizens understand government schemes, laws, and bills.

IMPORTANT RULES:
- Use very simple, everyday language that anyone can understand
- Do NOT use markdown formatting — no asterisks, no hashtags, no bold, no bullet symbols like * or #
- Write in plain sentences and short paragraphs
- If listing items, use simple numbering like 1. 2. 3.
- Keep answers short and to the point
- Always personalise the answer using the citizen profile provided
- If the question is about eligibility, check the profile and say clearly if they qualify or not
- Never say "I don't have your details" — the profile is provided below
- Never ask the user for details already in the profile
- VERY IMPORTANT: If the documents don't cover the question, answer from your own general knowledge — never say you don't have information or ask the user to provide text
- You MUST respond entirely in {language}

Citizen Profile:
{profile_text}

Recent Conversation:
{history_text if history_text else "No previous conversation."}

Relevant Government Documents:
{document_text if document_text else "No specific documents found in database. Use your own general knowledge to answer this question fully."}

Question:
{question}

Answer in {language} using simple, plain language. No markdown tags or symbols. If documents don't fully cover the question, use your own knowledge to give a complete answer.
If {language} is Hindi, write entirely in Hindi (Devanagari script).
If {language} is Punjabi, write entirely in Punjabi (Gurmukhi script).
If {language} is Bengali, write entirely in Bengali script.
If {language} is Telugu, write entirely in Telugu script.
"""
