import asyncio
from app.config.database import get_col


async def get_disaster_schemes(disaster_type, damage_percent, state):
    loop = asyncio.get_event_loop()

    def fetch():
        docs = list(get_col("disaster_schemes").stream())

        matched = []

        req_type = (disaster_type or "").lower().replace("_", "").replace(" ", "")

        for doc in docs:
            scheme = doc.to_dict()
            scheme["id"] = doc.id

            d_type = (scheme.get("disasterType") or "").lower().replace("_", "").replace(" ", "")

            # Match disaster type (flood, fire, earthquake, cyclone, landslide, heavyrain, etc.)
            if (
                (d_type in req_type or req_type in d_type or d_type == req_type)
                and scheme.get("active", True)
            ):
                matched.append(scheme)

        return matched

    result = await loop.run_in_executor(None, fetch)

    return result