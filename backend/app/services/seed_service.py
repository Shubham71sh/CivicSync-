"""
Seed service — seeds government schemes into Firestore if collection is empty.
"""

import asyncio
import logging
from app.config.database import get_col

logger = logging.getLogger("uvicorn.error")

SCHEMES = [
    {"name": "PM Kisan Samman Nidhi", "category": "Agriculture", "state": "All States",
     "description": "₹6,000/year direct income support to small and marginal farmers.",
     "eligibility": "Small and marginal farmers owning cultivable land.",
     "benefits": "₹6,000 per year in three equal installments.", "status": "active"},
    {"name": "Ayushman Bharat PM-JAY", "category": "Health", "state": "All States",
     "description": "Cashless health insurance coverage up to ₹5 Lakh per family per year.",
     "eligibility": "Poor and vulnerable families identified through SECC database.",
     "benefits": "₹5 Lakh health cover per family per year.", "status": "active"},
    {"name": "PM Awas Yojana (Urban)", "category": "Housing", "state": "All States",
     "description": "Affordable housing for urban poor through credit-linked subsidy.",
     "eligibility": "EWS/LIG/MIG categories in urban areas.",
     "benefits": "Home loan subsidy up to ₹2.67 Lakh.", "status": "active"},
    {"name": "PM Mudra Yojana", "category": "Loans", "state": "All States",
     "description": "Micro-finance loans for non-corporate small businesses.",
     "eligibility": "Non-farm small/micro enterprises.",
     "benefits": "Loans from ₹50,000 to ₹10 Lakh.", "status": "active"},
    {"name": "Pradhan Mantri Ujjwala Yojana", "category": "Energy", "state": "All States",
     "description": "LPG connections to BPL households.",
     "eligibility": "BPL households without LPG connection.",
     "benefits": "Free LPG connection and first refill.", "status": "active"},
    {"name": "National Scholarship Portal", "category": "Education", "state": "All States",
     "description": "Scholarships for students from minority and SC/ST communities.",
     "eligibility": "Students from SC/ST/OBC/Minority communities.",
     "benefits": "Annual scholarship from ₹5,000 to ₹25,000.", "status": "active"},
    {"name": "Skill India / PMKVY", "category": "Skill Development", "state": "All States",
     "description": "Short-term skill training and certification.",
     "eligibility": "Indian youth aged 15-45 years.",
     "benefits": "Free training and industry-recognized certification.", "status": "active"},
    {"name": "Startup India Seed Fund", "category": "Entrepreneurship", "state": "All States",
     "description": "Capital grant for early-stage startups.",
     "eligibility": "DPIIT-recognized startups less than 2 years old.",
     "benefits": "Grant up to ₹20 Lakh for product validation.", "status": "active"},
]


async def seed_schemes() -> int:
    loop = asyncio.get_event_loop()

    def _check_and_seed():
        schemes_col = get_col("schemes")
        existing = list(schemes_col.limit(1).stream())
        if existing:
            return 0
        for scheme in SCHEMES:
            schemes_col.add(scheme)
        return len(SCHEMES)

    count = await loop.run_in_executor(None, _check_and_seed)
    return count
