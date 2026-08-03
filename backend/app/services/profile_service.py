"""
Profile Service — Firestore-based user profile storage.

Migration notes (MongoDB → Firebase):
- Removed: `self.db.profiles.find_one({"userId": str(user_id)})` →
  replaced with `get_col("profiles").document(uid).get()`.
- Removed: `self.db.profiles.update_one({...}, {"$set": {...}}, upsert=True)` →
  replaced with `get_col("profiles").document(uid).set({...}, merge=True)`.
- The `db` constructor argument is accepted but ignored for backward compatibility
  with ChatService which instantiates `ProfileService(db)`.
- Uses user UID as the Firestore document ID in the "profiles" collection for
  O(1) lookups without an index query.
"""

import asyncio
from typing import Any, Dict, Optional
from app.config.database import get_col


PROFILE_FIELDS = (
    "name",
    "email",
    "phone",
    "location",
    "dob",
    "profession",
    "income",
    "employmentStatus",
    "householdSize",
    "category",
    "disabilityStatus",
    "veteranStatus",
    "studentStatus",
)


class ProfileService:

    def __init__(self, db=None):
        # `db` is accepted for backward compatibility; Firestore is used directly.
        pass

    @staticmethod
    def _defaults(user: Optional[Dict[str, Any]] = None) -> dict:
        """Build a safe, eligibility-focused profile from the authenticated user."""
        user = user or {}
        full_name = " ".join(
            part for part in (user.get("firstName"), user.get("lastName")) if part
        ).strip()

        return {
            "name": full_name,
            "email": user.get("email", ""),
            "phone": "",
            "location": user.get("location", ""),
            "dob": "",
            "profession": user.get("profession", ""),
            "income": user.get("income", user.get("incomeRange", "")),
            "employmentStatus": "",
            "householdSize": "",
            "category": "",
            "disabilityStatus": "",
            "veteranStatus": "",
            "studentStatus": "",
        }

    @staticmethod
    def _public_profile(profile: Dict[str, Any]) -> dict:
        """Keep database metadata out of API and prompt payloads."""
        return {field: profile.get(field, "") for field in PROFILE_FIELDS}

    async def get_profile(
        self,
        user_id,
        user_defaults: Optional[Dict[str, Any]] = None,
    ) -> Optional[dict]:
        """
        Fetch profile from Firestore by user UID.
        Falls back to defaults derived from the authenticated user dict if not found.
        """
        loop = asyncio.get_event_loop()
        uid = str(user_id)

        doc = await loop.run_in_executor(
            None,
            lambda: get_col("profiles").document(uid).get(),
        )

        if not doc.exists and user_defaults is None:
            return None

        merged = self._defaults(user_defaults)
        if doc.exists:
            merged.update(self._public_profile(doc.to_dict() or {}))

        return merged

    async def update_profile(
        self,
        user_id,
        updates: Dict[str, Any],
        user_defaults: Optional[Dict[str, Any]] = None,
    ) -> dict:
        """Persist profile details where the chat service can read them."""
        loop = asyncio.get_event_loop()
        uid = str(user_id)

        existing = self._defaults(user_defaults)
        stored_profile = await self.get_profile(user_id, user_defaults)
        if stored_profile:
            existing.update(stored_profile)

        sanitized_updates = {
            field: value.strip() if isinstance(value, str) else value
            for field, value in updates.items()
            if field in PROFILE_FIELDS and value is not None
        }
        profile = {**existing, **sanitized_updates, "userId": uid}

        await loop.run_in_executor(
            None,
            lambda: get_col("profiles").document(uid).set(profile, merge=True),
        )

        return self._public_profile(profile)
