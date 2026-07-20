"""
Analytics service — Firestore-based chart-ready analytics generation.
"""

import asyncio
from datetime import datetime, timedelta
from app.config.database import get_col

MONTH_NAMES = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]


def _calc_completion(citizen: dict) -> int:
    if not citizen:
        return 0
    fields = ["gender", "category", "state", "occupation", "age", "incomeRange"]
    filled = sum(1 for f in fields if citizen.get(f))
    return round((filled / len(fields)) * 100)


async def get_analytics(uid: str) -> dict:
    loop = asyncio.get_event_loop()

    def _fetch():
        citizen_doc = get_col("citizens").document(uid).get()
        apps = list(get_col("applications").where("userId", "==", uid).stream())
        docs = list(get_col("documents").where("userId", "==", uid).stream())
        return citizen_doc, apps, docs

    citizen_doc, apps, docs = await loop.run_in_executor(None, _fetch)
    citizen = citizen_doc.to_dict() if citizen_doc.exists else {}

    # ── Monthly applications (last 6 months) ─────────────────────────────────
    six_months_ago = datetime.utcnow() - timedelta(days=180)
    monthly_map = {}
    for app_doc in apps:
        app = app_doc.to_dict()
        created_at_str = app.get("createdAt")
        if created_at_str:
            try:
                dt = datetime.fromisoformat(created_at_str)
                if dt >= six_months_ago:
                    key = f"{MONTH_NAMES[dt.month - 1]} {dt.year}"
                    monthly_map[key] = monthly_map.get(key, 0) + 1
            except Exception:
                pass

    monthly_applications = []
    for i in range(5, -1, -1):
        dt = datetime.utcnow()
        # approximate month subtraction
        month = dt.month - i
        year = dt.year
        if month <= 0:
            month += 12
            year -= 1
        key = f"{MONTH_NAMES[month - 1]} {year}"
        monthly_applications.append({"month": key, "applications": monthly_map.get(key, 0)})

    # ── Approval rate ─────────────────────────────────────────────────────────
    total_apps = len(apps)
    approved_apps = sum(1 for a in apps if a.to_dict().get("status") == "approved")
    approval_rate = round((approved_apps / total_apps) * 100) if total_apps > 0 else 0

    # ── Scheme category breakdown ─────────────────────────────────────────────
    category_map = {}
    for a in apps:
        cat = a.to_dict().get("schemeCategory") or "general"
        category_map[cat] = category_map.get(cat, 0) + 1
    scheme_categories = [{"name": k, "count": v} for k, v in category_map.items()]

    # ── Benefits received by month ────────────────────────────────────────────
    approved_by_month = []
    for i in range(5, -1, -1):
        dt = datetime.utcnow()
        month = dt.month - i
        year = dt.year
        if month <= 0:
            month += 12
            year -= 1
        key = f"{MONTH_NAMES[month - 1]} {year}"
        
        # count approved applications in this month
        month_approved = 0
        for app_doc in apps:
            app = app_doc.to_dict()
            if app.get("status") == "approved":
                updated_at_str = app.get("updatedAt") or app.get("createdAt")
                if updated_at_str:
                    try:
                        app_dt = datetime.fromisoformat(updated_at_str)
                        if app_dt.month == month and app_dt.year == year:
                            month_approved += 1
                    except Exception:
                        pass
        approved_by_month.append({"month": key, "benefits": month_approved})

    # ── Profile completion ────────────────────────────────────────────────────
    profile_completion = _calc_completion(citizen)

    # ── Eligible vs Applied ───────────────────────────────────────────────────
    docs_uploaded = len(docs)

    return {
        "analytics": {
            "monthlyApplications": monthly_applications,
            "benefitsReceived": approved_by_month,
            "approvalRate": approval_rate,
            "profileCompletion": profile_completion,
            "schemeCategories": scheme_categories,
            "eligibleVsApplied": {
                "eligible": max(total_apps + 2, 3),
                "applied": total_apps,
            },
            "documentsUploaded": docs_uploaded,
            "totalApplications": total_apps,
            "totalApproved": approved_apps,
        }
    }
