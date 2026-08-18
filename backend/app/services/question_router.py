"""
QuestionRouter — classifies a user question into a category.

Performance fix: replaced the Groq API call (which cost ~800 ms per message)
with a local keyword-based classifier that runs in under 1 ms.
The category set is identical so no downstream code needs to change.
"""

import re


class QuestionRouter:

    # Keywords that strongly signal each government category
    _SCHEME_TERMS = {
        "scheme", "yojana", "yojna", "subsidy", "subsidi", "grant", "ration",
        "benefit", "welfare", "allowance", "stipend", "pension", "pm kisan",
        "pmay", "pmjay", "ujjwala", "mudra", "kcc", "kisan", "atal",
        "scholarship", "bpl", "apl", "antyodaya", "mnrega", "mgnrega",
        "pradhan mantri", "chief minister", "mukhyamantri",
    }

    _POLICY_TERMS = {
        "policy", "mission", "initiative", "programme", "program", "strategy",
        "campaign", "abhiyan", "digital india", "make in india", "swachh bharat",
        "startup india", "skill india", "national", "niti aayog",
    }

    _LAW_TERMS = {
        "law", "right", "legal", "court", "constitution", "article", "section",
        "ipc", "crpc", "rights", "fundamental", "directive", "judgement",
        "supreme court", "high court", "tribunal",
    }

    _ACT_TERMS = {
        "act", "regulation", "statute", "ordinance", "notification", "gazette",
        "amendment", "rules", "bye-law", "bylaw",
    }

    _BILL_TERMS = {
        "bill", "lok sabha", "rajya sabha", "parliament", "parliamentary",
        "draft bill", "introduced", "passed bill",
    }

    _ELIGIBILITY_TERMS = {
        "eligible", "eligibility", "qualify", "qualification", "who can",
        "am i eligible", "can i apply", "can i get", "do i qualify",
        "what schemes", "which scheme", "schemes for me", "benefits for me",
    }

    _FAQ_TERMS = {
        "apply", "application", "document", "required", "deadline",
        "portal", "online", "offline", "register", "registration",
        "how to get", "how to apply", "where to apply", "status",
        "track", "grievance", "complaint", "helpline",
    }

    _STOPWORDS = {
        "what", "is", "the", "of", "to", "and", "a", "an", "in",
        "on", "for", "about", "tell", "me", "please", "how", "can",
        "i", "my", "do", "does", "with", "under", "from", "am",
        "are", "was", "were", "will", "would", "could", "should",
    }

    @classmethod
    def _tokens(cls, text: str):
        words = re.findall(r"\b[\w-]+\b", text.lower())
        # Also try 2-gram and 3-gram phrases for multi-word terms
        phrases = set(words)
        for i in range(len(words) - 1):
            phrases.add(f"{words[i]} {words[i+1]}")
        for i in range(len(words) - 2):
            phrases.add(f"{words[i]} {words[i+1]} {words[i+2]}")
        return phrases

    def classify(self, question: str) -> str:
        """
        Classify question locally in < 1 ms.
        Returns one of: government_scheme | government_policy | government_law |
                        government_act | government_bill | government_faq |
                        profile | general
        """
        phrases = self._tokens(question)

        # Profile / eligibility check first — highest priority
        if phrases & self._ELIGIBILITY_TERMS:
            return "profile"

        # Specific government categories
        if phrases & self._BILL_TERMS:
            return "government_bill"

        if phrases & self._ACT_TERMS:
            return "government_act"

        if phrases & self._LAW_TERMS:
            return "government_law"

        if phrases & self._SCHEME_TERMS:
            return "government_scheme"

        if phrases & self._POLICY_TERMS:
            return "government_policy"

        if phrases & self._FAQ_TERMS:
            return "government_faq"

        return "general"
