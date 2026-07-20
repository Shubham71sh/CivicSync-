from typing import Any, Dict, Optional


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

    def __init__(self, db):
        self.db = db

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

        profile = await self.db.profiles.find_one(
            {
                "userId": str(user_id)
            }
        )

        if not profile and user_defaults is None:
            return None

        merged = self._defaults(user_defaults)
        if profile:
            merged.update(self._public_profile(profile))

        return merged

    async def update_profile(
        self,
        user_id,
        updates: Dict[str, Any],
        user_defaults: Optional[Dict[str, Any]] = None,
    ) -> dict:
        """Persist profile details where the chat service can read them."""
        existing = self._defaults(user_defaults)
        stored_profile = await self.get_profile(user_id, user_defaults)
        if stored_profile:
            existing.update(stored_profile)

        sanitized_updates = {
            field: value.strip() if isinstance(value, str) else value
            for field, value in updates.items()
            if field in PROFILE_FIELDS and value is not None
        }
        profile = {**existing, **sanitized_updates}

        await self.db.profiles.update_one(
            {"userId": str(user_id)},
            {"$set": {**profile, "userId": str(user_id)}},
            upsert=True,
        )

        return self._public_profile(profile)
