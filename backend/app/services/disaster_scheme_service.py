import asyncio
from app.config.database import get_col


async def get_disaster_schemes(disaster_type, damage_percent, state):
    loop = asyncio.get_event_loop()

    def fetch():
        docs = list(get_col("disaster_schemes").stream())

        matched = []

        for doc in docs:
            scheme = doc.to_dict()
            scheme["id"] = doc.id

            if (
                scheme.get("disasterType", "").lower() == disaster_type.lower()
                and scheme.get("state", "").lower() == state.lower()
                and damage_percent >= scheme.get("minDamage", 0)
                and damage_percent <= scheme.get("maxDamage", 100)
                and scheme.get("active", True)
            ):
                matched.append(scheme)

        return matched

    result = await loop.run_in_executor(None, fetch)

    return result