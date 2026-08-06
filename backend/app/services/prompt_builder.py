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
        for message in history:
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
            excerpt     = doc.get("contextExcerpt", "")
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

        return f"""You are CivicSync AI — a helpful, knowledgeable assistant for Indian citizens.

You have access to relevant government documents, bills, and scheme information below.
Use this information to answer the user's question accurately and completely.

IMPORTANT RULES:
- Answer the question directly and fully
- If the question is about a specific scheme or bill, use the document details provided
- If the question is about eligibility, compare with the citizen profile
- If documents are relevant, cite them by title
- If the question is general (taxes, laws, policies), answer from the documents AND your knowledge
- Always give a complete, helpful answer — never say "no schemes found" if the question is not about schemes
- You MUST respond entirely in {language}

-----------------------------------------
Citizen Profile
-----------------------------------------
{profile_text}

-----------------------------------------
Conversation History
-----------------------------------------
{history_text if history_text else "No previous conversation."}

-----------------------------------------
Relevant Documents
-----------------------------------------
{document_text if document_text else "No specific documents found."}

-----------------------------------------
User Question
-----------------------------------------
{question}

-----------------------------------------
Instructions
-----------------------------------------
Answer the question helpfully and completely in {language}.
If {language} is Hindi, write entirely in Hindi (Devanagari script).
If {language} is Punjabi, write entirely in Punjabi (Gurmukhi script).
If {language} is Bengali, write entirely in Bengali script.
If {language} is Telugu, write entirely in Telugu script.
"""
