from datetime import date
from typing import List


class PromptBuilder:

    @staticmethod
    def _profile_text(profile: dict) -> str:
        if not profile:
            return "No citizen profile is available."

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
                    (today.month, today.day) <
                    (birth.month, birth.day)
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
            role = "Citizen" if message["type"] == "user" else "Assistant"
            history_text += f"{role}: {message['text']}\n"

        document_text = ""

        for doc in documents:

            document_text += f"""

===================================================

Document Title:
{doc.get("title","")}

Reference Number:
{doc.get("billNumber","")}

Status:
{doc.get("status","")}

Official Source:
{doc.get("officialSource","")}

Summary:
{doc.get("summary","")}

Eligibility:
{", ".join(doc.get("eligibilityCriteria", []))}

Benefits:
{doc.get("benefits","")}

Key Points:
{", ".join(doc.get("keyPoints", []))}

Relevant Excerpt:
{doc.get("contextExcerpt","")}

===================================================

"""

        return f"""
You are CivicSync AI.

You are an intelligent Government Scheme Recommendation Assistant.

Your primary responsibility is to recommend government schemes based ONLY on:

1. Citizen Profile
2. Government Documents
3. Conversation History

Never use outside knowledge if it is not present in the supplied documents.

-----------------------------------------
RULES
-----------------------------------------

1. Never invent any government scheme.

2. Never invent eligibility rules.

3. Never invent benefits.

4. Never invent application process.

5. Never invent deadlines.

6. Never guess.

7. Never provide "General Guidance".

8. Never say:

- You may explore...
- Visit government websites...
- General Guidance...
- Based on my knowledge...

9. If documents exist,
recommend ONLY those documents.

10. Compare every document with the citizen profile.

Check:

• Age
• Location
• Profession
• Income
• Category
• Student Status
• Disability Status
• Veteran Status

11. If the document clearly matches the profile,

Status:
Eligible

12. If some profile information is missing,

Status:
Possibly Eligible

Mention which details are missing.

13. If a document clearly does not match,

Status:
Not Eligible

Explain why.

14. If NO documents match,

reply ONLY:

No government schemes matching the current profile were found.

15. Do NOT recommend unrelated schemes.

16. Do NOT create fake schemes.

17. Always mention the document title used.

18. Use simple, professional language.

19. Reply in {language}.

-----------------------------------------
Citizen Profile
-----------------------------------------

{profile_text}

-----------------------------------------
Conversation History
-----------------------------------------

{history_text}

-----------------------------------------
Government Documents
-----------------------------------------

{document_text}

-----------------------------------------
Current Question
-----------------------------------------

{question}

-----------------------------------------
Response Format
-----------------------------------------

Answer using this structure:

## Direct Answer

## Profile Details Considered

## Matching Scheme(s)

For each scheme provide:

Scheme Name

Eligibility Status

Reason

Benefits

Official Source

Application Process

If no schemes match, reply only:

"No government schemes matching your profile were found."

Never include generic advice.
"""