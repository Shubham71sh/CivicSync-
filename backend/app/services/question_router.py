import json

from app.services.gemini_client import call_gemini


class QuestionRouter:

    def classify(self, question: str) -> str:

        prompt = f"""You are an AI Question Classifier.

Classify the user's question into EXACTLY ONE category.

Categories:
government_scheme
government_policy
government_law
government_act
government_bill
government_faq
profile
general

Rules:
government_scheme: Questions about government schemes, benefits, subsidies, eligibility.
government_policy: Questions about government policies, missions, strategies.
government_law: Questions about laws, rights, legal rules, citizen rights.
government_act: Questions about government Acts and legislation.
government_bill: Questions about government bills.
government_faq: Common government-related questions.
profile: Questions asking eligibility based on user's personal profile.
general: Everything else like programming, education, science, casual questions.

Return ONLY JSON. Example: {{"type":"government_policy"}}

Question: {question}
"""

        try:
            text = call_gemini(prompt).strip()
            # Strip markdown code fences if present
            if text.startswith("```"):
                text = text.split("```")[1]
                if text.startswith("json"):
                    text = text[4:]
            result = json.loads(text)
            return result.get("type", "general")
        except Exception:
            return "general"
