"""
Dashboard service — aggregates all Overview Dashboard data from Firestore.
Provides single-call data consolidation for the CivicSync Overview page.
"""

import asyncio
import logging
from datetime import datetime, timezone
from app.config.database import get_col

logger = logging.getLogger("uvicorn.error")

MONTH_NAMES = ["Jan", "Feb", "Mar", "Apr", "May", "Jun",
               "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]


def _format_relative_time(iso_str: str) -> str:
    """Format an ISO timestamp as a human-readable relative time string."""
    if not iso_str:
        return "Unknown"
    try:
        dt = datetime.fromisoformat(iso_str.replace("Z", "+00:00"))
        now = datetime.now(timezone.utc)
        diff_seconds = int((now - dt).total_seconds())
        diff_mins = diff_seconds // 60
        diff_hours = diff_mins // 60
        diff_days = diff_hours // 24
        if diff_mins < 1:
            return "Just now"
        if diff_mins < 60:
            return f"{diff_mins} min{'s' if diff_mins != 1 else ''} ago"
        if diff_hours < 24:
            return f"{diff_hours} hour{'s' if diff_hours != 1 else ''} ago"
        if diff_days == 1:
            return "Yesterday"
        return f"{diff_days} days ago"
    except Exception:
        return "Recently"


def _format_time_remaining(iso_deadline: str) -> str:
    """Return a short string like '3 days', '6 hrs', 'Today' for a deadline."""
    if not iso_deadline:
        return ""
    try:
        dt = datetime.fromisoformat(iso_deadline.replace("Z", "+00:00"))
        now = datetime.now(timezone.utc)
        diff = dt - now
        total_secs = int(diff.total_seconds())
        if total_secs < 0:
            return "Overdue"
        if total_secs < 3600:
            return f"{total_secs // 60}m"
        if total_secs < 86400:
            return f"{total_secs // 3600}h"
        return f"{total_secs // 86400}d"
    except Exception:
        return ""


async def get_dashboard_overview(uid: str) -> dict:
    """
    Aggregates all dashboard stats in a single efficient call.
    Returns stats, activityFeed, eligibility top 2, gps summary, impactData.
    """
    loop = asyncio.get_event_loop()

    def _fetch_all():
        # Schemes (global)
        schemes_docs = list(get_col("schemes").stream())

        # User-specific collections
        apps_docs = list(get_col("applications").where("userId", "==", uid).stream())
        notifs_docs = list(get_col("notifications").where("userId", "==", uid).stream())
        # Calendar events — try both collection name variants used in the codebase
        try:
            cal_docs = list(get_col("calendarevents").where("userId", "==", uid).stream())
        except Exception:
            cal_docs = []

        citizen_doc = get_col("citizens").document(uid).get()
        roadmap_doc = get_col("roadmaps").document(uid).get()

        return schemes_docs, apps_docs, notifs_docs, cal_docs, citizen_doc, roadmap_doc

    schemes_docs, apps_docs, notifs_docs, cal_docs, citizen_doc, roadmap_doc = \
        await loop.run_in_executor(None, _fetch_all)

    citizen = citizen_doc.to_dict() if citizen_doc.exists else {}

    # ── Schemes Count ─────────────────────────────────────────────────────────
    active_schemes = [
        s for s in schemes_docs
        if s.to_dict().get("status") in ("active", "upcoming")
    ]
    schemes_count = len(active_schemes)

    # ── Applications ──────────────────────────────────────────────────────────
    apps = [a.to_dict() for a in apps_docs]
    applied_scheme_ids = {a.get("schemeId") for a in apps}

    # ── Unclaimed Benefits ────────────────────────────────────────────────────
    # Schemes that are active/upcoming and user has NOT applied for
    income_val = 0
    income_str = citizen.get("incomeRange") or citizen.get("income") or ""
    if income_str:
        import re
        nums = re.findall(r"\d[\d,]*", str(income_str))
        if nums:
            try:
                income_val = int(nums[0].replace(",", ""))
            except Exception:
                income_val = 0

    age_val = citizen.get("age", 0) or 0
    state_val = (citizen.get("state") or "").lower()

    unclaimed = []
    unclaimed_estimate = 0
    for s_doc in active_schemes:
        s = s_doc.to_dict()
        s_id = s_doc.id
        if s_id in applied_scheme_ids:
            continue
        # Simple eligibility pass: if no hard restrictions, count as potentially eligible
        min_age = s.get("minimumAge")
        max_age = s.get("maximumAge")
        inc_limit = s.get("incomeLimit")
        s_state = (s.get("state") or "").lower()

        age_ok = (min_age is None or age_val == 0 or age_val >= min_age) and \
                 (max_age is None or age_val == 0 or age_val <= max_age)
        inc_ok = inc_limit is None or income_val == 0 or income_val <= inc_limit
        state_ok = s_state in ("", "all india") or state_val == "" or state_val == s_state

        if age_ok and inc_ok and state_ok:
            unclaimed.append(s)
            benefit_str = str(s.get("benefitAmount") or s.get("estimatedBenefit") or "0")
            import re
            nums = re.findall(r"\d[\d,]*", benefit_str)
            if nums:
                try:
                    unclaimed_estimate += int(nums[0].replace(",", ""))
                except Exception:
                    pass

    unclaimed_count = len(unclaimed)

    # ── Upcoming Deadlines ────────────────────────────────────────────────────
    now_iso = datetime.now(timezone.utc).isoformat()
    future_deadlines = []
    for d_doc in cal_docs:
        d = d_doc.to_dict()
        if d.get("type") in ("deadline", "renewal"):
            due = d.get("dueDate") or d.get("date") or ""
            if due and due > now_iso:
                future_deadlines.append(d)

    # Also check scheme deadlines
    for s_doc in active_schemes:
        s = s_doc.to_dict()
        last_date = s.get("lastDate") or s.get("deadline") or ""
        if last_date and last_date > now_iso:
            future_deadlines.append({
                "title": s.get("name", "Scheme Deadline"),
                "dueDate": last_date,
                "type": "deadline"
            })

    # Sort by nearest first
    future_deadlines.sort(key=lambda x: x.get("dueDate") or x.get("date") or "")
    nearest = future_deadlines[0] if future_deadlines else None
    nearest_deadline_title = ""
    nearest_deadline_time = ""
    if nearest:
        nearest_deadline_title = nearest.get("title") or nearest.get("name") or "Upcoming Deadline"
        nearest_deadline_time = _format_time_remaining(nearest.get("dueDate") or nearest.get("date") or "")

    # ── Corruption Alerts ─────────────────────────────────────────────────────
    corruption_types = {"corruption", "fraud_alert", "fraud", "alert", "warning"}
    corruption_alerts = [
        n.to_dict() for n in notifs_docs
        if n.to_dict().get("type", "").lower() in corruption_types
        or "corrupt" in n.to_dict().get("title", "").lower()
        or "fraud" in n.to_dict().get("title", "").lower()
        or "anomal" in n.to_dict().get("title", "").lower()
    ]
    corruption_count = len(corruption_alerts)

    # ── Activity Feed ─────────────────────────────────────────────────────────
    activity_feed = []
    for n_doc in notifs_docs:
        n = n_doc.to_dict()
        n["id"] = n_doc.id
        activity_feed.append(n)

    # Sort newest first
    activity_feed.sort(
        key=lambda x: x.get("createdAt") or x.get("timestamp") or "",
        reverse=True
    )

    shaped_feed = []
    for item in activity_feed[:20]:
        shaped_feed.append({
            "id": item.get("id") or item.get("_id") or "",
            "type": item.get("type") or "info",
            "iconType": item.get("iconType") or item.get("type") or "info",
            "title": item.get("title") or "Notification",
            "desc": item.get("desc") or item.get("message") or item.get("body") or "",
            "read": item.get("read", False),
            "time": _format_relative_time(item.get("createdAt") or item.get("timestamp") or ""),
            "createdAt": item.get("createdAt") or item.get("timestamp") or "",
        })

    # ── Roadmap / GPS ─────────────────────────────────────────────────────────
    roadmap_items = []
    if roadmap_doc.exists:
        roadmap_data = roadmap_doc.to_dict()
        roadmap_items = roadmap_data.get("items") or []

    total_steps = len(roadmap_items)
    completed_steps = sum(1 for i in roadmap_items if i.get("status") == "completed")
    action_required = sum(1 for i in roadmap_items if i.get("status") == "action_required")
    upcoming_steps = sum(1 for i in roadmap_items if i.get("status") == "upcoming")
    pending_steps = sum(1 for i in roadmap_items if i.get("status") == "pending")

    progress_pct = round((completed_steps / total_steps) * 100) if total_steps > 0 else 0

    current_stage = "Not Started"
    next_action = "Generate your civic roadmap"
    if roadmap_items:
        # Find the first non-completed step
        for step in roadmap_items:
            if step.get("status") != "completed":
                current_stage = step.get("title") or "In Progress"
                next_action = step.get("desc") or "Complete current step"
                break
        if all(i.get("status") == "completed" for i in roadmap_items):
            current_stage = "All Steps Completed"
            next_action = "Apply for eligible schemes"

    gps_summary = {
        "currentStage": current_stage,
        "completedSteps": completed_steps,
        "totalSteps": total_steps,
        "pendingSteps": pending_steps + upcoming_steps,
        "actionRequired": action_required,
        "progressPct": progress_pct,
        "nextAction": next_action,
        "hasRoadmap": roadmap_doc.exists,
    }

    # ── Eligibility Top Schemes ───────────────────────────────────────────────
    profile_completion_fields = ["gender", "category", "state", "occupation", "age", "incomeRange", "education", "phone"]
    filled = sum(1 for f in profile_completion_fields if citizen.get(f))
    profile_completion_pct = round((filled / len(profile_completion_fields)) * 100)

    # Top 2 schemes with match scores
    top_eligibility = []
    for s_doc in active_schemes[:50]:
        s = s_doc.to_dict()
        score = _calculate_scheme_score(s, citizen)
        if score > 0:
            top_eligibility.append({
                "name": s.get("name") or s.get("schemeName") or "Scheme",
                "score": score,
                "verdict": "High Match" if score >= 80 else "Potential" if score >= 50 else "Low Match",
            })

    top_eligibility.sort(key=lambda x: x["score"], reverse=True)
    top_eligibility = top_eligibility[:2]

    # ── Impact Analytics ─────────────────────────────────────────────────────
    approved_apps = sum(1 for a in apps if a.get("status") == "approved")
    total_apps = len(apps)

    # Bar chart: last 6 months of applications
    monthly_map = {}
    for app in apps:
        created = app.get("appliedAt") or app.get("createdAt") or ""
        if created:
            try:
                dt = datetime.fromisoformat(created.replace("Z", "+00:00"))
                key = f"{MONTH_NAMES[dt.month - 1]}"
                monthly_map[key] = monthly_map.get(key, 0) + 1
            except Exception:
                pass

    impact_bars = []
    now_dt = datetime.now(timezone.utc)
    for i in range(5, -1, -1):
        month = now_dt.month - i
        year = now_dt.year
        if month <= 0:
            month += 12
            year -= 1
        key = MONTH_NAMES[month - 1]
        impact_bars.append({
            "month": key,
            "count": monthly_map.get(key, 0)
        })

    # Governance transparency: based on corruption alerts found vs resolved
    governance_transparency = max(0, 100 - (corruption_count * 15))
    # Tax optimization: based on eligible schemes
    tax_optimization = min(unclaimed_count * 250, 9999)

    impact_data = {
        "bars": impact_bars,
        "governanceTransparency": f"+{governance_transparency}%",
        "taxOptimization": f"+₹{tax_optimization:,}",
        "totalBills": total_apps,  # will be replaced with real bills count from frontend
        "eligibleSchemes": schemes_count,
        "benefitsClaimed": approved_apps,
        "roadmapCompletion": progress_pct,
    }

    return {
        "stats": {
            "schemesCount": schemes_count,
            "deadlinesCount": len(future_deadlines),
            "nearestDeadlineTitle": nearest_deadline_title,
            "nearestDeadlineTime": nearest_deadline_time,
            "corruptionCount": corruption_count,
            "unclaimedCount": unclaimed_count,
            "unclaimedEstimate": unclaimed_estimate,
        },
        "activityFeed": shaped_feed,
        "eligibility": {
            "profileCompletionPct": profile_completion_pct,
            "topSchemes": top_eligibility,
        },
        "gps": gps_summary,
        "impact": impact_data,
    }


def _calculate_scheme_score(scheme: dict, profile: dict) -> int:
    """Fast score calculation for overview eligibility display (0-100)."""
    if not profile:
        return 0
    passed = 0
    total = 0

    # Age
    min_age = scheme.get("minimumAge")
    max_age = scheme.get("maximumAge")
    age_val = profile.get("age", 0) or 0
    if min_age is not None or max_age is not None:
        total += 1
        age_ok = (min_age is None or age_val == 0 or age_val >= min_age) and \
                 (max_age is None or age_val == 0 or age_val <= max_age)
        if age_ok:
            passed += 1

    # Income
    inc_limit = scheme.get("incomeLimit")
    if inc_limit is not None:
        total += 1
        income_str = str(profile.get("incomeRange") or profile.get("income") or "0")
        import re
        nums = re.findall(r"\d[\d,]*", income_str)
        inc_val = int(nums[0].replace(",", "")) if nums else 0
        if inc_val == 0 or inc_val <= inc_limit:
            passed += 1

    # State
    s_state = (scheme.get("state") or "").lower()
    p_state = (profile.get("state") or "").lower()
    if s_state and s_state != "all india":
        total += 1
        if not p_state or p_state == s_state:
            passed += 1

    # Gender
    s_gender = (scheme.get("gender") or "").lower()
    p_gender = (profile.get("gender") or "").lower()
    if s_gender and s_gender != "all":
        total += 1
        if not p_gender or p_gender == s_gender:
            passed += 1

    if total == 0:
        return 100  # Universally eligible
    return round((passed / total) * 100)


async def get_activity_feed(uid: str, limit: int = 20) -> dict:
    """Get the unified activity feed for the dashboard Live Pulse Feed."""
    loop = asyncio.get_event_loop()

    def _fetch():
        return list(get_col("notifications").where("userId", "==", uid).stream())

    notifs_docs = await loop.run_in_executor(None, _fetch)

    feed = []
    for n_doc in notifs_docs:
        n = n_doc.to_dict()
        feed.append({
            "id": n_doc.id,
            "type": n.get("type") or "info",
            "iconType": n.get("iconType") or n.get("type") or "info",
            "title": n.get("title") or "Notification",
            "desc": n.get("desc") or n.get("message") or n.get("body") or "",
            "read": n.get("read", False),
            "time": _format_relative_time(n.get("createdAt") or n.get("timestamp") or ""),
            "createdAt": n.get("createdAt") or n.get("timestamp") or "",
        })

    feed.sort(key=lambda x: x.get("createdAt") or "", reverse=True)
    return {"feed": feed[:limit], "total": len(feed)}


async def get_eligibility_summary(uid: str) -> dict:
    """Get top 2 eligible schemes for the eligibility card."""
    loop = asyncio.get_event_loop()

    def _fetch():
        citizen_doc = get_col("citizens").document(uid).get()
        schemes = list(get_col("schemes").stream())
        return citizen_doc, schemes

    citizen_doc, scheme_docs = await loop.run_in_executor(None, _fetch)
    citizen = citizen_doc.to_dict() if citizen_doc.exists else {}

    scored = []
    for s_doc in scheme_docs:
        s = s_doc.to_dict()
        if s.get("status") not in ("active", "upcoming"):
            continue
        score = _calculate_scheme_score(s, citizen)
        scored.append({
            "id": s_doc.id,
            "name": s.get("name") or "Scheme",
            "score": score,
            "verdict": "High Match" if score >= 80 else "Potential" if score >= 50 else "Low Match",
        })

    scored.sort(key=lambda x: x["score"], reverse=True)
    return {"schemes": scored[:2], "profileComplete": bool(citizen)}


async def get_gps_summary(uid: str) -> dict:
    """Get roadmap progress for the GPS card."""
    loop = asyncio.get_event_loop()

    def _fetch():
        return get_col("roadmaps").document(uid).get()

    roadmap_doc = await loop.run_in_executor(None, _fetch)

    if not roadmap_doc.exists:
        return {
            "currentStage": "Not Started",
            "completedSteps": 0,
            "totalSteps": 0,
            "pendingSteps": 0,
            "progressPct": 0,
            "nextAction": "Generate your civic roadmap",
            "hasRoadmap": False,
        }

    items = roadmap_doc.to_dict().get("items") or []
    total = len(items)
    completed = sum(1 for i in items if i.get("status") == "completed")
    pending = sum(1 for i in items if i.get("status") in ("pending", "upcoming", "action_required"))
    pct = round((completed / total) * 100) if total > 0 else 0

    current_stage = "Completed"
    next_action = "Apply for eligible schemes"
    for step in items:
        if step.get("status") != "completed":
            current_stage = step.get("title") or "In Progress"
            next_action = step.get("desc") or "Complete current step"
            break

    return {
        "currentStage": current_stage,
        "completedSteps": completed,
        "totalSteps": total,
        "pendingSteps": pending,
        "progressPct": pct,
        "nextAction": next_action,
        "hasRoadmap": True,
    }
