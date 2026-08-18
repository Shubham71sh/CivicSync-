"""
Seed service — seeds government schemes into Firestore if collection is empty.
"""

import asyncio
import logging
from app.config.database import get_col

logger = logging.getLogger("uvicorn.error")

SCHEMES = [
    {"name": "PM Kisan Samman Nidhi", "category": "Agriculture", "state": "All States",
     "description": "6000 rupees per year direct income support to small and marginal farmers.",
     "eligibility": "Small and marginal farmers owning cultivable land.",
     "benefits": "6000 rupees per year in three equal installments.", "status": "active"},
    {"name": "Ayushman Bharat PM-JAY", "category": "Health", "state": "All States",
     "description": "Cashless health insurance coverage up to 5 Lakh per family per year.",
     "eligibility": "Poor and vulnerable families identified through SECC database.",
     "benefits": "5 Lakh health cover per family per year.", "status": "active"},
    {"name": "PM Awas Yojana Urban", "category": "Housing", "state": "All States",
     "description": "Affordable housing for urban poor through credit-linked subsidy.",
     "eligibility": "EWS LIG MIG categories in urban areas.",
     "benefits": "Home loan subsidy up to 2.67 Lakh.", "status": "active"},
    {"name": "PM Mudra Yojana", "category": "Loans", "state": "All States",
     "description": "Micro-finance loans for non-corporate small businesses.",
     "eligibility": "Non-farm small and micro enterprises.",
     "benefits": "Loans from 50000 to 10 Lakh.", "status": "active"},
    {"name": "Pradhan Mantri Ujjwala Yojana", "category": "Energy", "state": "All States",
     "description": "LPG connections to BPL households.",
     "eligibility": "BPL households without LPG connection.",
     "benefits": "Free LPG connection and first refill.", "status": "active"},
    {"name": "National Scholarship Portal", "category": "Education", "state": "All States",
     "description": "Scholarships for students from minority and SC ST communities.",
     "eligibility": "Students from SC ST OBC Minority communities.",
     "benefits": "Annual scholarship from 5000 to 25000 rupees.", "status": "active"},
    {"name": "Skill India PMKVY", "category": "Skill Development", "state": "All States",
     "description": "Short-term skill training and certification for Indian youth.",
     "eligibility": "Indian youth aged 15 to 45 years.",
     "benefits": "Free training and industry-recognized certification.", "status": "active"},
    {"name": "Startup India Seed Fund", "category": "Entrepreneurship", "state": "All States",
     "description": "Capital grant for early-stage startups.",
     "eligibility": "DPIIT-recognized startups less than 2 years old.",
     "benefits": "Grant up to 20 Lakh for product validation.", "status": "active"},
    {"name": "PM SVANidhi", "category": "Loans", "state": "All States",
     "description": "Micro credit for street vendors affected by COVID-19.",
     "eligibility": "Street vendors who were vending before March 24 2020.",
     "benefits": "Working capital loan of 10000 rupees with subsidy.", "status": "active"},
    {"name": "Atal Pension Yojana", "category": "Pension", "state": "All States",
     "description": "Pension scheme for workers in the unorganised sector.",
     "eligibility": "Indian citizens aged 18 to 40 years with a savings bank account.",
     "benefits": "Fixed monthly pension of 1000 to 5000 rupees after age 60.", "status": "active"},
    {"name": "PM Fasal Bima Yojana", "category": "Agriculture", "state": "All States",
     "description": "Crop insurance scheme to protect farmers against crop loss.",
     "eligibility": "All farmers including sharecroppers and tenant farmers.",
     "benefits": "Insurance coverage for crop loss due to natural calamities.", "status": "active"},
    {"name": "Sukanya Samriddhi Yojana", "category": "Women and Child", "state": "All States",
     "description": "Small savings scheme for the girl child.",
     "eligibility": "Parents or guardians of girl child below 10 years of age.",
     "benefits": "High interest savings with tax benefits for girl child education and marriage.", "status": "active"},
]

BILLS = [
    {"title": "The Infrastructure Development Act 2024", "billNumber": "IDA-2024",
     "summary": "A comprehensive act to boost infrastructure development across India including roads highways railways ports and digital infrastructure.",
     "description": "The Infrastructure Development Act 2024 aims to streamline approvals for large infrastructure projects, create a national infrastructure pipeline, and attract private investment through public-private partnerships.",
     "provisions": "Fast-track approval within 60 days for projects above 500 crore. Single window clearance system. PPP framework for roads railways and ports. Digital infrastructure fund of 10000 crore.",
     "eligibility": "All Indian citizens and businesses benefit from improved infrastructure.",
     "userImpact": "Better roads connectivity faster travel reduced logistics costs improved digital connectivity.",
     "status": "passed", "category": "Infrastructure"},
    {"title": "The Digital Personal Data Protection Act 2023", "billNumber": "DPDP-2023",
     "summary": "Law to protect personal data of Indian citizens and regulate how companies collect and use personal data.",
     "description": "This act establishes rights of citizens over their personal data, obligations of companies processing data, and creates a Data Protection Board.",
     "provisions": "Right to know what data is collected. Right to correct and erase data. Consent required before data collection. Heavy fines up to 250 crore for violations.",
     "eligibility": "All Indian citizens whose personal data is processed by any organization.",
     "userImpact": "Citizens can now demand companies delete their data, correct wrong information, and must give consent before data is collected.",
     "status": "passed", "category": "Technology Law"},
    {"title": "The Bharatiya Nyaya Sanhita 2023", "billNumber": "BNS-2023",
     "summary": "New criminal law replacing the Indian Penal Code of 1860. Modernizes criminal justice system.",
     "description": "The Bharatiya Nyaya Sanhita replaces the IPC with updated laws suited to modern India. It introduces new offences for organised crime terrorism and cybercrime.",
     "provisions": "New sections on cybercrime. Terrorism defined clearly. Organised crime provisions. Trial must complete within 3 years. Community service as punishment for minor offences.",
     "eligibility": "Applicable to all citizens of India.",
     "userImpact": "Faster trials. Modern definitions of crime. Community service option for small offences instead of jail.",
     "status": "passed", "category": "Criminal Law"},
    {"title": "The Telecommunications Act 2023", "billNumber": "TELE-2023",
     "summary": "New law governing telecom sector in India replacing the Indian Telegraph Act of 1885.",
     "description": "The Telecommunications Act 2023 modernizes the legal framework for telecom. It covers spectrum allocation licensing and consumer protection in telecom services.",
     "provisions": "Spectrum to be auctioned. Government can take over telecom networks in national emergency. SIM cards require biometric verification. Stricter rules against spam calls.",
     "eligibility": "All telecom service users in India.",
     "userImpact": "Better protection against spam calls. Clearer rules for telecom companies. Government can block services during emergencies.",
     "status": "passed", "category": "Telecommunications"},
    {"title": "The Right to Education Amendment 2024", "billNumber": "RTE-2024",
     "summary": "Amendment to strengthen free and compulsory education for children aged 6 to 14 years.",
     "description": "This amendment extends provisions of the Right to Education Act to improve quality of education, teacher training requirements, and inclusion of children with disabilities.",
     "provisions": "25 percent seats reserved for economically weaker sections in private schools. Teacher qualification standards raised. Special provisions for children with disabilities. No detention policy revised.",
     "eligibility": "All children aged 6 to 14 years in India.",
     "userImpact": "Free education guaranteed. Private school seats available for poor children. Better qualified teachers.",
     "status": "passed", "category": "Education"},
]


async def seed_schemes() -> int:
    loop = asyncio.get_event_loop()

    def _check_and_seed():
        count = 0

        # Seed schemes
        schemes_col = get_col("schemes")
        existing_schemes = list(schemes_col.limit(1).stream())
        if not existing_schemes:
            for scheme in SCHEMES:
                schemes_col.add(scheme)
            count += len(SCHEMES)

        # Seed bills
        bills_col = get_col("bills")
        existing_bills = list(bills_col.limit(1).stream())
        if not existing_bills:
            for bill in BILLS:
                bills_col.add(bill)
            count += len(BILLS)

        return count

    count = await loop.run_in_executor(None, _check_and_seed)
    return count
