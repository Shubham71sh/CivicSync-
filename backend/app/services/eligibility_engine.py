"""
Deterministic Eligibility Engine.

CRITICAL RULE: Eligibility decisions must be computed strictly via deterministic code rules.
The LLM is NOT permitted to make or override eligibility decisions.
RAG retrieves official scheme evidence, and the LLM formats a grounded explanation of the deterministic outcome.
"""

import logging
from typing import Any, Dict, List, Optional, Tuple

logger = logging.getLogger("uvicorn.error")


class DeterministicEligibilityEngine:
    """
    Evaluates citizen profile against structured scheme eligibility criteria.
    Returns status: ELIGIBLE | NOT_ELIGIBLE | MAYBE, along with check diagnostics.
    """

    @staticmethod
    def evaluate(profile: Dict[str, Any], scheme: Dict[str, Any]) -> Dict[str, Any]:
        raw_eligibility = scheme.get("eligibility") or {}
        if isinstance(raw_eligibility, str):
            raw_eligibility = {"text": raw_eligibility}

        checks: List[Dict[str, Any]] = []
        passed_fields: List[str] = []
        failed_fields: List[str] = []
        missing_fields: List[str] = []

        # ── 1. Age Check ──────────────────────────────────────────────────────
        user_age = profile.get("age") or profile.get("dob")
        user_age_num: Optional[int] = None
        if isinstance(user_age, (int, float)):
            user_age_num = int(user_age)
        elif isinstance(user_age, str) and user_age.isdigit():
            user_age_num = int(user_age)
        elif isinstance(user_age, str) and "-" in user_age and len(user_age) >= 4:
            try:
                birth_year = int(user_age.split("-")[0])
                user_age_num = 2026 - birth_year
            except Exception:
                pass

        age_min = raw_eligibility.get("ageMin")
        age_max = raw_eligibility.get("ageMax")

        if age_min is not None or age_max is not None:
            if user_age_num is None:
                missing_fields.append("age")
                checks.append({
                    "field": "age",
                    "status": "missing",
                    "details": f"Scheme requires age between {age_min or 0} and {age_max or 'unlimited'}, but user profile does not specify age."
                })
            else:
                passed_min = (age_min is None) or (user_age_num >= age_min)
                passed_max = (age_max is None) or (user_age_num <= age_max)
                if passed_min and passed_max:
                    passed_fields.append("age")
                    checks.append({
                        "field": "age",
                        "status": "pass",
                        "details": f"Age {user_age_num} meets criteria (Min: {age_min or 0}, Max: {age_max or 'None'})."
                    })
                else:
                    failed_fields.append("age")
                    checks.append({
                        "field": "age",
                        "status": "fail",
                        "details": f"Age {user_age_num} does not meet criteria (Min: {age_min or 0}, Max: {age_max or 'None'})."
                    })

        # ── 2. Income Limit Check ─────────────────────────────────────────────
        user_income = profile.get("income")
        income_limit = raw_eligibility.get("incomeLimit")

        if income_limit is not None:
            user_income_num: Optional[float] = None
            if isinstance(user_income, (int, float)):
                user_income_num = float(user_income)
            elif isinstance(user_income, str):
                # Clean currency symbols / text like "₹ 2.5 Lakh"
                cleaned_income = user_income.replace("₹", "").replace(",", "").strip().lower()
                if "lakh" in cleaned_income:
                    val = cleaned_income.replace("lakh", "").strip()
                    try:
                        user_income_num = float(val) * 100000
                    except ValueError:
                        pass
                else:
                    try:
                        user_income_num = float(cleaned_income)
                    except ValueError:
                        pass

            if user_income_num is None:
                missing_fields.append("income")
                checks.append({
                    "field": "income",
                    "status": "missing",
                    "details": f"Scheme requires annual income under ₹{income_limit:,.0f}, but user profile income is unspecified."
                })
            elif user_income_num <= income_limit:
                passed_fields.append("income")
                checks.append({
                    "field": "income",
                    "status": "pass",
                    "details": f"Annual income ₹{user_income_num:,.0f} is within limit of ₹{income_limit:,.0f}."
                })
            else:
                failed_fields.append("income")
                checks.append({
                    "field": "income",
                    "status": "fail",
                    "details": f"Annual income ₹{user_income_num:,.0f} exceeds income limit of ₹{income_limit:,.0f}."
                })

        # ── 3. State / Residence Check ────────────────────────────────────────
        user_state = (profile.get("state") or profile.get("location") or "").strip().lower()
        scheme_state = (scheme.get("state") or "All States").strip().lower()
        allowed_residence = [r.lower() for r in (raw_eligibility.get("residence") or [])]

        if scheme_state != "all states" and user_state:
            if scheme_state in user_state or user_state in scheme_state or any(r in user_state for r in allowed_residence):
                passed_fields.append("state")
                checks.append({
                    "field": "state",
                    "status": "pass",
                    "details": f"Location '{profile.get('state') or profile.get('location')}' matches target state '{scheme.get('state')}'."
                })
            else:
                failed_fields.append("state")
                checks.append({
                    "field": "state",
                    "status": "fail",
                    "details": f"Location '{profile.get('state') or profile.get('location')}' does not match scheme target state '{scheme.get('state')}'."
                })
        elif scheme_state == "all states":
            passed_fields.append("state")
            checks.append({
                "field": "state",
                "status": "pass",
                "details": "Scheme applies to All States across India."
            })

        # ── 4. Occupation Check ───────────────────────────────────────────────
        user_occ = (profile.get("profession") or profile.get("occupation") or "").strip().lower()
        allowed_occs = [o.lower() for o in (raw_eligibility.get("occupation") or [])]

        if allowed_occs:
            if not user_occ:
                missing_fields.append("occupation")
                checks.append({
                    "field": "occupation",
                    "status": "missing",
                    "details": f"Scheme targets professions ({', '.join(raw_eligibility['occupation'])}), but user profession is unspecified."
                })
            elif any(occ in user_occ or user_occ in occ for occ in allowed_occs):
                passed_fields.append("occupation")
                checks.append({
                    "field": "occupation",
                    "status": "pass",
                    "details": f"User profession '{user_occ}' matches target occupations."
                })
            else:
                failed_fields.append("occupation")
                checks.append({
                    "field": "occupation",
                    "status": "fail",
                    "details": f"User profession '{user_occ}' is not listed in target occupations ({', '.join(raw_eligibility['occupation'])})."
                })

        # ── 5. Category Check (SC/ST/OBC/EWS/BPL/General) ──────────────────────
        user_cat = (profile.get("category") or "").strip().lower()
        allowed_cats = [c.lower() for c in (raw_eligibility.get("category") or [])]

        if allowed_cats:
            if not user_cat:
                missing_fields.append("category")
                checks.append({
                    "field": "category",
                    "status": "missing",
                    "details": f"Scheme targets categories ({', '.join(raw_eligibility['category'])}), but user category is unspecified."
                })
            elif any(cat in user_cat or user_cat in cat for cat in allowed_cats):
                passed_fields.append("category")
                checks.append({
                    "field": "category",
                    "status": "pass",
                    "details": f"User category '{profile.get('category')}' matches target category."
                })
            else:
                failed_fields.append("category")
                checks.append({
                    "field": "category",
                    "status": "fail",
                    "details": f"User category '{profile.get('category')}' does not match scheme target categories ({', '.join(raw_eligibility['category'])})."
                })

        # ── Overall Verdict Calculation ──────────────────────────────────────
        if failed_fields:
            status = "NOT_ELIGIBLE"
            eligible = False
            score = max(0, 100 - (len(failed_fields) * 35))
        elif missing_fields and not passed_fields:
            status = "MAYBE"
            eligible = False
            score = 50
        elif missing_fields:
            status = "MAYBE"
            eligible = True
            score = 70
        else:
            status = "ELIGIBLE"
            eligible = True
            score = 95

        return {
            "status": status,
            "eligible": eligible,
            "score": score,
            "checks": checks,
            "passedFields": passed_fields,
            "failedFields": failed_fields,
            "missingFields": missing_fields,
            "schemeId": scheme.get("id"),
            "schemeName": scheme.get("name")
        }
