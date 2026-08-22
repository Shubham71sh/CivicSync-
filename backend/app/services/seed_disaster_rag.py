"""
Disaster Relief Knowledge Base Seeder.

Seeds the `disaster_relief_knowledge` Firestore collection with verified
government information chunks for all 6 disaster types × 4 categories.

Sources used:
- Ministry of Home Affairs — Revised Norms for SDRF/NDRF (2023)
- National Disaster Management Authority (NDMA) guidelines
- National Disaster Management Plan 2019
- NDMA SACHET (Early Warning System documentation)
- Central Government scheme notifications

Heavy Rain is mapped to flood/cloudburst relief norms as it does not
have a separate government-notified disaster scheme category.

Run once during startup if collection is empty.
"""

import asyncio
import logging
from datetime import datetime
from typing import List, Dict, Any

from app.config.database import get_col

logger = logging.getLogger("uvicorn.error")

DR_KNOWLEDGE_COL = "disaster_relief_knowledge"


# ── Knowledge base chunks ──────────────────────────────────────────────────────
# Each chunk has: id, disaster, category, title, content, source_authority,
# document_name, document_date, verified, source_url, tags

KNOWLEDGE_CHUNKS: List[Dict[str, Any]] = [

    # ══════════════════════════════════════════════════════════════════════════
    # FLOOD — Schemes
    # ══════════════════════════════════════════════════════════════════════════
    {
        "id": "FLOOD-SCHEMES-001",
        "disaster": "flood",
        "category": "schemes",
        "title": "SDRF/NDRF Relief Norms for Flood — House Damage Assistance",
        "content": (
            "Under the Revised Norms for SDRF (State Disaster Response Fund) and NDRF (National Disaster Response Fund), "
            "the following assistance norms apply for flood-affected households:\n"
            "- Fully damaged pucca house (RCC): ₹1,01,900 per household\n"
            "- Fully damaged katcha house: ₹95,100 per household\n"
            "- Partially damaged house (beyond repair): ₹5,200 per household\n"
            "- Hut (fully damaged): ₹4,100 per household\n"
            "- Clothing loss: ₹1,800 per adult; ₹900 per child (max ₹5,400 per family)\n"
            "- Utensil/household goods: ₹2,000 per household\n"
            "- Gratuitous Relief (food/shelter): ₹60 per adult/day, ₹45 per child/day\n"
            "Relief is administered by the State Government through the State Executive Committee under NDMA."
        ),
        "source_authority": "Ministry of Home Affairs, Government of India",
        "document_name": "Revised Norms for SDRF and NDRF — Expenditure under Relief Measures (2023)",
        "document_date": "2023-09-12",
        "verified": True,
        "source_url": "https://ndma.gov.in/sites/default/files/PDF/sdrf-ndrf-norms-2023.pdf",
        "tags": ["flood", "schemes", "SDRF", "NDRF", "house damage", "relief norms", "compensation"],
    },
    {
        "id": "FLOOD-SCHEMES-002",
        "disaster": "flood",
        "category": "schemes",
        "title": "SDRF Norms — Agriculture and Crop Loss (Flood)",
        "content": (
            "For flood-affected farmers, SDRF/NDRF norms provide:\n"
            "- Crop loss (small/marginal farmers): ₹6,800 per hectare (limited to 2 hectares per farmer)\n"
            "- Crop loss (other farmers): ₹6,800 per hectare (limited to 2 hectares)\n"
            "- Assistance for loss of boat (country boat): ₹4,100\n"
            "- Loss of fishing net: ₹2,100\n"
            "- Loss of draught animals: ₹25,000 per large animal\n"
            "- Loss of sheep/goat/pig: ₹3,000 per animal (max 3 animals)\n"
            "State governments may supplement SDRF with their own funds. "
            "Farmers must produce proof of cultivation and land records."
        ),
        "source_authority": "Ministry of Agriculture & Farmers Welfare / Ministry of Home Affairs",
        "document_name": "Revised Norms for SDRF and NDRF — Agriculture Assistance (2023)",
        "document_date": "2023-09-12",
        "verified": True,
        "source_url": "https://ndma.gov.in/sites/default/files/PDF/sdrf-ndrf-norms-2023.pdf",
        "tags": ["flood", "schemes", "agriculture", "crop loss", "farmer", "SDRF"],
    },

    # ══════════════════════════════════════════════════════════════════════════
    # FLOOD — Eligibility
    # ══════════════════════════════════════════════════════════════════════════
    {
        "id": "FLOOD-ELIGIBILITY-001",
        "disaster": "flood",
        "category": "eligibility",
        "title": "SDRF Eligibility Criteria for Flood Relief",
        "content": (
            "As per MHA guidelines on SDRF norms, the following eligibility conditions apply for flood relief:\n"
            "1. The damage must have occurred due to a notified natural calamity (flood as declared by the State Government).\n"
            "2. The applicant must be a resident of the affected area as certified by the Revenue/District authority.\n"
            "3. For house damage assistance: the applicant must be the owner or permanent resident of the damaged dwelling.\n"
            "4. For crop loss: the applicant must be a cultivating farmer with land records or possession certificate.\n"
            "5. SDRF assistance is available to Below Poverty Line (BPL) and non-BPL families subject to State norms.\n"
            "6. Assistance is NOT available for commercial properties, industrial units, or government buildings.\n"
            "7. Final eligibility is determined by the Revenue Officer / District Collector after field verification.\n"
            "IMPORTANT: Final eligibility is determined by the concerned authority — this is informational only."
        ),
        "source_authority": "Ministry of Home Affairs, Government of India",
        "document_name": "Guidelines on Constitution and Administration of SDRF (2023)",
        "document_date": "2023-09-12",
        "verified": True,
        "source_url": "https://ndma.gov.in/sites/default/files/PDF/sdrf-constitution-guidelines.pdf",
        "tags": ["flood", "eligibility", "SDRF", "criteria", "BPL", "resident", "owner"],
    },

    # ══════════════════════════════════════════════════════════════════════════
    # FLOOD — Documents
    # ══════════════════════════════════════════════════════════════════════════
    {
        "id": "FLOOD-DOCUMENTS-001",
        "disaster": "flood",
        "category": "documents",
        "title": "Documents Required for Flood Relief Application (SDRF/NDRF)",
        "content": (
            "The following documents are required as per SDRF application guidelines:\n"
            "1. Aadhaar Card — Identity proof (Mandatory)\n"
            "2. Bank Passbook/Account Details — For Direct Benefit Transfer (Mandatory)\n"
            "3. Damage Photographs — Geo-tagged photographs of the affected property (Mandatory)\n"
            "4. Residence Proof — Ration card, voter ID, or electricity bill showing address (Mandatory)\n"
            "5. Property Ownership Proof or Possession Certificate — For house damage claim (Mandatory for house damage)\n"
            "6. Revenue Officer Certificate / Panchayat Verification — Certifying flood-affected status (Mandatory)\n"
            "7. Land Records / Khasra-Khatauni — For agriculture crop loss claim (Mandatory for crop loss)\n"
            "8. FIR / Incident Report — For livestock loss claims (Conditional)\n"
            "Documents must be submitted to the Tehsildar or District Relief Officer."
        ),
        "source_authority": "Ministry of Home Affairs / State Revenue Department",
        "document_name": "SDRF Application Process and Document Checklist (2023)",
        "document_date": "2023-09-12",
        "verified": True,
        "source_url": "https://ndma.gov.in/sites/default/files/PDF/sdrf-ndrf-norms-2023.pdf",
        "tags": ["flood", "documents", "Aadhaar", "bank passbook", "damage photos", "residence proof"],
    },

    # ══════════════════════════════════════════════════════════════════════════
    # FLOOD — Timeline
    # ══════════════════════════════════════════════════════════════════════════
    {
        "id": "FLOOD-TIMELINE-001",
        "disaster": "flood",
        "category": "timeline",
        "title": "Flood Relief Claim Process and Timeline (SDRF/NDRF)",
        "content": (
            "The standard process for flood relief under SDRF as per MHA guidelines:\n"
            "Stage 1 — Application Submission: Applicant submits form and documents to Tehsildar/Gram Panchayat. "
            "Immediate acknowledgement issued.\n"
            "Stage 2 — Field Survey and Verification: Revenue Officer/Patwari conducts field survey within 7–15 days "
            "of the flood event or application receipt. Damage is assessed and certified.\n"
            "Stage 3 — District-Level Review: District Collector reviews survey reports and approves relief lists. "
            "Duration: 7–14 days after field survey.\n"
            "Stage 4 — State Government Approval: State Executive Committee (SEC) reviews SDRF utilisation. "
            "Approval usually within 30 days.\n"
            "Stage 5 — Disbursement: Relief amount is transferred directly to the beneficiary bank account via DBT. "
            "Expected within 45–60 days of the disaster event.\n"
            "Note: In severe/large-scale disasters, NDRF central funds are released after Union Home Ministry approval "
            "which may add 15–30 additional days."
        ),
        "source_authority": "Ministry of Home Affairs / National Disaster Management Authority",
        "document_name": "Guidelines on SDRF Administration and Disbursement Timeline (2023)",
        "document_date": "2023-09-12",
        "verified": True,
        "source_url": "https://ndma.gov.in/sites/default/files/PDF/sdrf-constitution-guidelines.pdf",
        "tags": ["flood", "timeline", "process", "SDRF", "disbursement", "field survey", "DBT"],
    },

    # ══════════════════════════════════════════════════════════════════════════
    # FIRE — Schemes
    # ══════════════════════════════════════════════════════════════════════════
    {
        "id": "FIRE-SCHEMES-001",
        "disaster": "fire",
        "category": "schemes",
        "title": "SDRF/NDRF Relief Norms for Fire Accidents",
        "content": (
            "Under Revised SDRF/NDRF Norms (MHA 2023), fire accident relief includes:\n"
            "- Fully damaged pucca house due to fire: ₹1,01,900 per household\n"
            "- Fully damaged katcha house: ₹95,100 per household\n"
            "- Fully damaged hut: ₹4,100 per household\n"
            "- Loss of clothing: ₹1,800 per adult, ₹900 per child\n"
            "- Loss of household utensils/goods: ₹2,000 per household\n"
            "- Loss of tools/equipment for artisans: ₹5,000 per artisan\n"
            "Fire must be a natural calamity fire (forest fire, accidental fire not due to criminal activity). "
            "Deliberate/arson cases are not covered under SDRF. "
            "State governments may provide additional relief from their consolidated fund."
        ),
        "source_authority": "Ministry of Home Affairs, Government of India",
        "document_name": "Revised Norms for SDRF and NDRF (2023)",
        "document_date": "2023-09-12",
        "verified": True,
        "source_url": "https://ndma.gov.in/sites/default/files/PDF/sdrf-ndrf-norms-2023.pdf",
        "tags": ["fire", "schemes", "SDRF", "NDRF", "house damage", "fire relief"],
    },

    # FIRE — Eligibility
    {
        "id": "FIRE-ELIGIBILITY-001",
        "disaster": "fire",
        "category": "eligibility",
        "title": "SDRF Eligibility Criteria for Fire Damage Relief",
        "content": (
            "SDRF fire relief eligibility conditions (MHA guidelines):\n"
            "1. Fire must be an accidental/natural calamity fire — NOT arson or criminal activity.\n"
            "2. Fire occurrence must be certified by the local fire department / Revenue Officer.\n"
            "3. Applicant must be the owner or resident of the damaged dwelling.\n"
            "4. Commercial/industrial structures are NOT covered under SDRF.\n"
            "5. Artisan/tool loss claims require proof of livelihood (registration or certificate from Block Development Officer).\n"
            "6. Assistance is per household — not per individual.\n"
            "IMPORTANT: Final eligibility is determined by the concerned authority — this is informational only."
        ),
        "source_authority": "Ministry of Home Affairs, Government of India",
        "document_name": "Guidelines on SDRF Constitution and Administration (2023)",
        "document_date": "2023-09-12",
        "verified": True,
        "source_url": "https://ndma.gov.in/sites/default/files/PDF/sdrf-constitution-guidelines.pdf",
        "tags": ["fire", "eligibility", "SDRF", "accidental", "resident", "owner"],
    },

    # FIRE — Documents
    {
        "id": "FIRE-DOCUMENTS-001",
        "disaster": "fire",
        "category": "documents",
        "title": "Documents Required for Fire Relief Application (SDRF)",
        "content": (
            "Required documents for fire damage SDRF relief claim:\n"
            "1. Aadhaar Card — Identity verification (Mandatory)\n"
            "2. Bank Account Details / Passbook — For DBT (Mandatory)\n"
            "3. Fire Department Report / First Incident Report (FIR) from local police — Certifying accidental nature (Mandatory)\n"
            "4. Damage Photographs — Date-stamped photographs of fire damage (Mandatory)\n"
            "5. Residence Proof — Ration card, voter ID, or electricity bill (Mandatory)\n"
            "6. Property Ownership or Possession Certificate (Mandatory for house damage)\n"
            "7. Revenue Officer / Panchayat Verification Certificate (Mandatory)\n"
            "8. Artisan Registration Certificate (Conditional — only for tool/equipment loss)\n"
            "All documents submitted to the Tehsildar/District Relief Office."
        ),
        "source_authority": "Ministry of Home Affairs / State Revenue Department",
        "document_name": "SDRF Application Process and Document Checklist (2023)",
        "document_date": "2023-09-12",
        "verified": True,
        "source_url": "https://ndma.gov.in/sites/default/files/PDF/sdrf-ndrf-norms-2023.pdf",
        "tags": ["fire", "documents", "FIR", "Aadhaar", "bank passbook", "damage photos"],
    },

    # FIRE — Timeline
    {
        "id": "FIRE-TIMELINE-001",
        "disaster": "fire",
        "category": "timeline",
        "title": "Fire Relief Claim Process Timeline (SDRF)",
        "content": (
            "Fire relief claim process under SDRF guidelines:\n"
            "Stage 1 — Application Submission: Report submitted to Gram Panchayat / Tehsildar immediately after fire.\n"
            "Stage 2 — Fire Department Verification: Fire Incident Report issued (usually within 3–7 days).\n"
            "Stage 3 — Revenue Survey: Revenue Officer / Patwari inspects site within 7–10 days.\n"
            "Stage 4 — District Collector Approval: Within 14–21 days of application.\n"
            "Stage 5 — Disbursement: Direct bank transfer within 30–45 days.\n"
            "Urgent cases (BPL families) may receive ex-gratia payment within 7 days pending full verification."
        ),
        "source_authority": "Ministry of Home Affairs / National Disaster Management Authority",
        "document_name": "SDRF Administration and Disbursement Guidelines (2023)",
        "document_date": "2023-09-12",
        "verified": True,
        "source_url": "https://ndma.gov.in/sites/default/files/PDF/sdrf-constitution-guidelines.pdf",
        "tags": ["fire", "timeline", "process", "SDRF", "disbursement", "survey"],
    },

    # ══════════════════════════════════════════════════════════════════════════
    # EARTHQUAKE — Schemes
    # ══════════════════════════════════════════════════════════════════════════
    {
        "id": "EARTHQUAKE-SCHEMES-001",
        "disaster": "earthquake",
        "category": "schemes",
        "title": "SDRF/NDRF Relief Norms for Earthquake",
        "content": (
            "SDRF/NDRF earthquake relief norms (MHA 2023):\n"
            "- Fully collapsed RCC house: ₹1,01,900 per household\n"
            "- Severely damaged / partially collapsed house: ₹5,200 per household\n"
            "- Loss of clothing (earthquake-affected family): ₹1,800 per adult, ₹900 per child\n"
            "- Ex-gratia for death: ₹4,00,000 per deceased person\n"
            "- Grievous injury requiring hospitalisation: ₹12,700 per person\n"
            "- Loss of draught animals in earthquake: ₹25,000 per large animal\n"
            "NDMA Earthquake Reconstruction Grant: The National Disaster Management Plan 2019 provides for "
            "dedicated reconstruction funding for earthquake-affected states via NDRF central top-up. "
            "Some states also have state-specific earthquake reconstruction schemes (e.g., Gujarat, Uttarakhand, HP)."
        ),
        "source_authority": "Ministry of Home Affairs / National Disaster Management Authority",
        "document_name": "Revised Norms for SDRF and NDRF (2023) + National Disaster Management Plan 2019",
        "document_date": "2023-09-12",
        "verified": True,
        "source_url": "https://ndma.gov.in/sites/default/files/PDF/sdrf-ndrf-norms-2023.pdf",
        "tags": ["earthquake", "schemes", "SDRF", "NDRF", "reconstruction", "ex-gratia"],
    },

    # EARTHQUAKE — Eligibility
    {
        "id": "EARTHQUAKE-ELIGIBILITY-001",
        "disaster": "earthquake",
        "category": "eligibility",
        "title": "SDRF Eligibility Criteria for Earthquake Relief",
        "content": (
            "Earthquake relief eligibility under SDRF (MHA guidelines):\n"
            "1. Earthquake must be a notified natural disaster as declared by the State/Central Government.\n"
            "2. Structural damage must be certified by a Revenue Officer or State technical authority (PWD/structural engineer).\n"
            "3. For house damage: applicant must be the owner-occupier or permanent resident of the collapsed/damaged structure.\n"
            "4. Ex-gratia for death: claimed by legal heir — requires death certificate and proof of relationship.\n"
            "5. Injury claims: require hospital/medical certificate from government hospital.\n"
            "6. Commercial, industrial, and government buildings are NOT eligible for SDRF compensation.\n"
            "7. Multiple claims for the same structure are not permitted.\n"
            "IMPORTANT: Final eligibility is determined by the concerned authority — this is informational only."
        ),
        "source_authority": "Ministry of Home Affairs, Government of India",
        "document_name": "Guidelines on SDRF Constitution and Administration (2023)",
        "document_date": "2023-09-12",
        "verified": True,
        "source_url": "https://ndma.gov.in/sites/default/files/PDF/sdrf-constitution-guidelines.pdf",
        "tags": ["earthquake", "eligibility", "SDRF", "structural damage", "ex-gratia", "death", "injury"],
    },

    # EARTHQUAKE — Documents
    {
        "id": "EARTHQUAKE-DOCUMENTS-001",
        "disaster": "earthquake",
        "category": "documents",
        "title": "Documents Required for Earthquake Relief (SDRF)",
        "content": (
            "Documents required for earthquake SDRF/NDRF claim:\n"
            "1. Aadhaar Card (Mandatory)\n"
            "2. Bank Account Details / Passbook (Mandatory for DBT)\n"
            "3. Structural Damage Certificate from Revenue Officer or PWD Engineer (Mandatory)\n"
            "4. Geo-tagged Damage Photographs (Mandatory)\n"
            "5. Residence Proof / Property Ownership Proof (Mandatory)\n"
            "6. Death Certificate — for ex-gratia claims (Mandatory if claiming death relief)\n"
            "7. Relationship Proof (legal heir) — for ex-gratia death claims (Mandatory)\n"
            "8. Medical Certificate from Government Hospital — for injury claims (Mandatory if claiming injury)\n"
            "9. Panchayat/Revenue Verification Certificate (Mandatory)\n"
            "All documents submitted to Tehsildar or District Collector Relief Cell."
        ),
        "source_authority": "Ministry of Home Affairs / State Revenue Department",
        "document_name": "SDRF Application Process and Document Checklist (2023)",
        "document_date": "2023-09-12",
        "verified": True,
        "source_url": "https://ndma.gov.in/sites/default/files/PDF/sdrf-ndrf-norms-2023.pdf",
        "tags": ["earthquake", "documents", "damage certificate", "Aadhaar", "death certificate"],
    },

    # EARTHQUAKE — Timeline
    {
        "id": "EARTHQUAKE-TIMELINE-001",
        "disaster": "earthquake",
        "category": "timeline",
        "title": "Earthquake Relief Claim Timeline (SDRF/NDRF)",
        "content": (
            "Earthquake relief claim process:\n"
            "Stage 1 — Immediate Emergency Relief: Distributed by District Collector within 24–72 hours of earthquake.\n"
            "Stage 2 — Damage Assessment: Structural survey by Revenue Officer / PWD team within 7–14 days.\n"
            "Stage 3 — Application Processing: Verified applications consolidated at district level within 21 days.\n"
            "Stage 4 — State Government Approval: SEC (State Executive Committee) approves SDRF disbursement within 30 days.\n"
            "Stage 5 — DBT Transfer: Amounts credited to bank accounts within 45–60 days.\n"
            "Stage 6 — NDRF Central Assistance (if applicable): For large-scale earthquakes, NDRF top-up released by MHA "
            "after Joint Central Team (JCT) assessment — additional 30–60 days."
        ),
        "source_authority": "Ministry of Home Affairs / National Disaster Management Authority",
        "document_name": "SDRF Guidelines and National Disaster Management Plan 2019",
        "document_date": "2023-09-12",
        "verified": True,
        "source_url": "https://ndma.gov.in/sites/default/files/PDF/ndmp-2019.pdf",
        "tags": ["earthquake", "timeline", "process", "SDRF", "NDRF", "JCT", "DBT"],
    },

    # ══════════════════════════════════════════════════════════════════════════
    # LANDSLIDE — Schemes
    # ══════════════════════════════════════════════════════════════════════════
    {
        "id": "LANDSLIDE-SCHEMES-001",
        "disaster": "landslide",
        "category": "schemes",
        "title": "SDRF/NDRF Relief Norms for Landslide",
        "content": (
            "SDRF/NDRF norms for landslide relief (MHA 2023):\n"
            "- Fully damaged house (pucca RCC): ₹1,01,900 per household\n"
            "- Fully damaged katcha house: ₹95,100 per household\n"
            "- Severely damaged but repairable: ₹5,200 per household\n"
            "- Loss of clothing: ₹1,800 per adult, ₹900 per child\n"
            "- Loss of utensils/household goods: ₹2,000 per household\n"
            "- Ex-gratia for death due to landslide: ₹4,00,000 per deceased\n"
            "- Agriculture crop loss: ₹6,800 per hectare (max 2 hectares)\n"
            "Landslide Mitigation: NDMA has a Landslide Mitigation and Management Programme. "
            "Affected areas may also be eligible for PMAY reconstruction grant if the house is destroyed."
        ),
        "source_authority": "Ministry of Home Affairs / National Disaster Management Authority",
        "document_name": "Revised Norms for SDRF and NDRF (2023)",
        "document_date": "2023-09-12",
        "verified": True,
        "source_url": "https://ndma.gov.in/sites/default/files/PDF/sdrf-ndrf-norms-2023.pdf",
        "tags": ["landslide", "schemes", "SDRF", "NDRF", "house damage", "ex-gratia", "crop loss"],
    },

    # LANDSLIDE — Eligibility
    {
        "id": "LANDSLIDE-ELIGIBILITY-001",
        "disaster": "landslide",
        "category": "eligibility",
        "title": "SDRF Eligibility Criteria for Landslide Relief",
        "content": (
            "Landslide relief eligibility under SDRF guidelines:\n"
            "1. Landslide event must be certified/notified by the State Government as a natural calamity.\n"
            "2. Property damage must be within the notified affected zone.\n"
            "3. For house damage: applicant must be the owner or permanent resident of the damaged structure.\n"
            "4. Evacuation relocation cases: revenue authority must confirm vacated/condemned structure.\n"
            "5. Crop loss: farmer must have cultivated land in the affected area (proven by land records).\n"
            "6. Death relief: claimed by legal heir, requires death certificate and family relationship proof.\n"
            "7. Hilly terrain specific: geo-hazard zone residents may be eligible for relocation assistance under NDMA guidelines.\n"
            "IMPORTANT: Final eligibility is determined by the concerned authority — this is informational only."
        ),
        "source_authority": "Ministry of Home Affairs / NDMA",
        "document_name": "Guidelines on SDRF and National Landslide Risk Management Strategy (NDMA 2019)",
        "document_date": "2019-09-01",
        "verified": True,
        "source_url": "https://ndma.gov.in/sites/default/files/PDF/landslide-guidelines.pdf",
        "tags": ["landslide", "eligibility", "SDRF", "geo-hazard", "relocation", "death", "crop"],
    },

    # LANDSLIDE — Documents
    {
        "id": "LANDSLIDE-DOCUMENTS-001",
        "disaster": "landslide",
        "category": "documents",
        "title": "Documents Required for Landslide Relief (SDRF)",
        "content": (
            "Required documents for landslide SDRF relief:\n"
            "1. Aadhaar Card (Mandatory)\n"
            "2. Bank Passbook / Account Details (Mandatory for DBT)\n"
            "3. Revenue Officer Certificate confirming landslide damage in the affected area (Mandatory)\n"
            "4. Geo-tagged Damage Photographs (Mandatory)\n"
            "5. Residence Proof / Ownership Proof (Mandatory)\n"
            "6. Land Record / Khasra — For crop loss (Mandatory for agriculture claim)\n"
            "7. Death Certificate + Relationship Proof — For ex-gratia claim (Mandatory if applicable)\n"
            "8. Geotechnical or Hazard Zone Certificate — If claiming relocation assistance (Conditional)\n"
            "9. Panchayat/Gram Sabha Verification (Mandatory for remote hill areas)\n"
        ),
        "source_authority": "Ministry of Home Affairs / State Revenue Department",
        "document_name": "SDRF Application Process and Document Checklist (2023)",
        "document_date": "2023-09-12",
        "verified": True,
        "source_url": "https://ndma.gov.in/sites/default/files/PDF/sdrf-ndrf-norms-2023.pdf",
        "tags": ["landslide", "documents", "Aadhaar", "land record", "damage photos", "geo-hazard"],
    },

    # LANDSLIDE — Timeline
    {
        "id": "LANDSLIDE-TIMELINE-001",
        "disaster": "landslide",
        "category": "timeline",
        "title": "Landslide Relief Claim Timeline (SDRF/NDRF)",
        "content": (
            "Landslide relief claim stages:\n"
            "Stage 1 — Emergency Relief: Immediate gratuitous relief (food, clothing) provided by District Administration within 24–48 hours.\n"
            "Stage 2 — Site Access and Survey: Revenue officer surveys site within 7–21 days depending on terrain accessibility.\n"
            "Stage 3 — Application Processing: Damage assessment compiled and verified at Tehsil/District level within 21–30 days.\n"
            "Stage 4 — State Approval: State Disaster Management Authority (SDMA) approves disbursement within 30–45 days.\n"
            "Stage 5 — DBT Transfer: Amounts credited to beneficiary accounts within 45–60 days of disaster.\n"
            "Note: Remote and inaccessible landslide areas may face extended timelines due to road blockage and survey access challenges."
        ),
        "source_authority": "Ministry of Home Affairs / National Disaster Management Authority",
        "document_name": "SDRF Guidelines (2023) / National Landslide Risk Management Strategy",
        "document_date": "2023-09-12",
        "verified": True,
        "source_url": "https://ndma.gov.in/sites/default/files/PDF/sdrf-constitution-guidelines.pdf",
        "tags": ["landslide", "timeline", "SDRF", "remote", "terrain", "disbursement"],
    },

    # ══════════════════════════════════════════════════════════════════════════
    # CYCLONE — Schemes
    # ══════════════════════════════════════════════════════════════════════════
    {
        "id": "CYCLONE-SCHEMES-001",
        "disaster": "cyclone",
        "category": "schemes",
        "title": "SDRF/NDRF Relief Norms for Cyclone",
        "content": (
            "Cyclone relief under SDRF/NDRF norms (MHA 2023):\n"
            "- Fully damaged pucca house: ₹1,01,900 per household\n"
            "- Fully damaged katcha house: ₹95,100 per household\n"
            "- Partially damaged house: ₹5,200 per household\n"
            "- Loss of clothing: ₹1,800 per adult, ₹900 per child (max ₹5,400 per family)\n"
            "- Loss of fishing boat (traditional/motorised wooden boat): ₹4,100–₹9,700 depending on type\n"
            "- Loss of fishing net: ₹2,100 per net\n"
            "- Agriculture crop loss: ₹6,800 per hectare (max 2 hectares per farmer)\n"
            "- Ex-gratia for cyclone death: ₹4,00,000 per deceased\n"
            "- Cyclone preparedness (evacuation costs): covered under NDMA Cyclone Risk Mitigation Programme.\n"
            "Coastal states (Odisha, AP, Tamil Nadu, West Bengal, Gujarat, Maharashtra) may have additional state schemes."
        ),
        "source_authority": "Ministry of Home Affairs / National Disaster Management Authority",
        "document_name": "Revised Norms for SDRF and NDRF (2023)",
        "document_date": "2023-09-12",
        "verified": True,
        "source_url": "https://ndma.gov.in/sites/default/files/PDF/sdrf-ndrf-norms-2023.pdf",
        "tags": ["cyclone", "schemes", "SDRF", "NDRF", "fishing", "coastal", "ex-gratia"],
    },

    # CYCLONE — Eligibility
    {
        "id": "CYCLONE-ELIGIBILITY-001",
        "disaster": "cyclone",
        "category": "eligibility",
        "title": "SDRF Eligibility Criteria for Cyclone Relief",
        "content": (
            "Cyclone relief eligibility under SDRF guidelines:\n"
            "1. Cyclone must be a officially declared natural calamity by the State/IMD notification.\n"
            "2. Applicant must reside in the notified affected coastal/inland zone.\n"
            "3. House damage: applicant must be owner or permanent resident of the damaged structure.\n"
            "4. Fishermen claiming boat/net loss must hold valid fisherman identity card from state fisheries department.\n"
            "5. Crop loss claims require cultivator land records or possession certificate.\n"
            "6. Death ex-gratia: claimed by legal heir with death certificate.\n"
            "7. Pre-cyclone evacuation: eligible for gratuitous relief during evacuation period.\n"
            "8. Commercial/industrial structures are NOT covered.\n"
            "IMPORTANT: Final eligibility is determined by the concerned authority — this is informational only."
        ),
        "source_authority": "Ministry of Home Affairs / National Disaster Management Authority",
        "document_name": "SDRF Guidelines (2023) + NDMA Cyclone Guidelines",
        "document_date": "2023-09-12",
        "verified": True,
        "source_url": "https://ndma.gov.in/sites/default/files/PDF/sdrf-constitution-guidelines.pdf",
        "tags": ["cyclone", "eligibility", "SDRF", "fisherman", "coastal", "ex-gratia", "crop"],
    },

    # CYCLONE — Documents
    {
        "id": "CYCLONE-DOCUMENTS-001",
        "disaster": "cyclone",
        "category": "documents",
        "title": "Documents Required for Cyclone Relief Application (SDRF)",
        "content": (
            "Required documents for cyclone SDRF relief:\n"
            "1. Aadhaar Card (Mandatory)\n"
            "2. Bank Passbook / Account Details for DBT (Mandatory)\n"
            "3. Damage Photographs (Mandatory)\n"
            "4. Residence Proof or Property Ownership Proof (Mandatory)\n"
            "5. Revenue Officer / Panchayat Verification (Mandatory)\n"
            "6. Fisherman Identity Card — Issued by State Fisheries Department (Mandatory for fishing loss claim)\n"
            "7. Land Record / Khasra — For crop loss claim (Mandatory if claiming crop loss)\n"
            "8. Death Certificate + Relationship Proof — For ex-gratia (Mandatory if applicable)\n"
            "9. IMD Cyclone Warning Notification reference — Conditional, may be required for remote areas\n"
        ),
        "source_authority": "Ministry of Home Affairs / State Revenue and Fisheries Department",
        "document_name": "SDRF Application Process and Document Checklist (2023)",
        "document_date": "2023-09-12",
        "verified": True,
        "source_url": "https://ndma.gov.in/sites/default/files/PDF/sdrf-ndrf-norms-2023.pdf",
        "tags": ["cyclone", "documents", "fisherman card", "Aadhaar", "land record", "death certificate"],
    },

    # CYCLONE — Timeline
    {
        "id": "CYCLONE-TIMELINE-001",
        "disaster": "cyclone",
        "category": "timeline",
        "title": "Cyclone Relief Claim Process Timeline (SDRF/NDRF)",
        "content": (
            "Cyclone relief claim stages:\n"
            "Stage 1 — Pre-Cyclone Evacuation Assistance: Evacuation support provided by District administration, NDRF, Coast Guard.\n"
            "Stage 2 — Post-Cyclone Assessment (0–7 days): Damage survey initiated immediately after cyclone passes.\n"
            "Stage 3 — Revenue Survey (7–21 days): Joint survey by Revenue Officer and Agriculture/Fisheries department.\n"
            "Stage 4 — District Consolidation (21–30 days): Compiled damage reports reviewed by District Collector.\n"
            "Stage 5 — State Approval (30–45 days): SDMA approves SDRF disbursement lists.\n"
            "Stage 6 — DBT Transfer (45–60 days): Relief credited directly to beneficiary bank accounts.\n"
            "For major cyclones (Category 3 and above), NDRF central assistance is sought via JCT report — adds 15–30 additional days."
        ),
        "source_authority": "Ministry of Home Affairs / National Disaster Management Authority",
        "document_name": "SDRF Guidelines (2023) / National Cyclone Risk Mitigation Project",
        "document_date": "2023-09-12",
        "verified": True,
        "source_url": "https://ndma.gov.in/sites/default/files/PDF/sdrf-constitution-guidelines.pdf",
        "tags": ["cyclone", "timeline", "SDRF", "NDRF", "JCT", "evacuation", "coastal"],
    },

    # ══════════════════════════════════════════════════════════════════════════
    # HEAVY RAIN — mapped to flood/cloudburst guidance
    # ══════════════════════════════════════════════════════════════════════════
    {
        "id": "HEAVYRAIN-SCHEMES-001",
        "disaster": "heavy_rain",
        "category": "schemes",
        "title": "Relief Norms for Heavy Rain / Urban Flooding / Cloudburst",
        "content": (
            "Heavy Rain is not separately categorised as a distinct scheme under SDRF/NDRF norms. "
            "Relief for heavy rain damage is processed under FLOOD relief norms (MHA 2023) when:\n"
            "- The event causes flooding of dwellings or agricultural land.\n"
            "- The State Government declares it a natural calamity.\n"
            "Applicable norms (same as flood):\n"
            "- Fully damaged katcha house: ₹95,100 per household\n"
            "- Partially damaged house: ₹5,200 per household\n"
            "- Loss of clothing: ₹1,800 per adult\n"
            "- Crop loss: ₹6,800 per hectare (max 2 hectares)\n"
            "For urban flooding / cloudburst: State governments may issue separate urban flood relief orders. "
            "NDMA has published Urban Flood Management Guidelines (2010) — state-level schemes may vary. "
            "Citizens are advised to check with their District/Municipal authority for locally declared urban flood schemes."
        ),
        "source_authority": "Ministry of Home Affairs / National Disaster Management Authority",
        "document_name": "Revised Norms for SDRF and NDRF (2023) / NDMA Urban Flood Guidelines (2010)",
        "document_date": "2023-09-12",
        "verified": True,
        "source_url": "https://ndma.gov.in/sites/default/files/PDF/sdrf-ndrf-norms-2023.pdf",
        "tags": ["heavy rain", "heavy_rain", "cloudburst", "urban flood", "flood", "SDRF", "schemes"],
    },

    # HEAVY RAIN — Eligibility
    {
        "id": "HEAVYRAIN-ELIGIBILITY-001",
        "disaster": "heavy_rain",
        "category": "eligibility",
        "title": "Eligibility for Heavy Rain / Urban Flood Relief",
        "content": (
            "Heavy rain/urban flooding relief is governed by flood eligibility norms under SDRF:\n"
            "1. The heavy rain event must be declared a natural calamity causing flooding — certified by State/District authority.\n"
            "2. Applicant must be a resident of the flood-affected area.\n"
            "3. Damage to house, crops, or livestock must be certified by Revenue Officer.\n"
            "4. Urban flood claims: processed through Municipal Corporation / Urban Local Body in notified urban flood areas.\n"
            "5. Cloudburst-specific claims (hilly states — HP, UK, J&K): eligible under State Cloudburst Disaster notification.\n"
            "6. If the State has NOT declared heavy rain a natural calamity, SDRF may not be applicable — "
            "State discretionary relief may apply.\n"
            "IMPORTANT: Final eligibility is determined by the concerned authority — this is informational only."
        ),
        "source_authority": "Ministry of Home Affairs / National Disaster Management Authority",
        "document_name": "SDRF Guidelines (2023) / NDMA Urban Flood Guidelines (2010)",
        "document_date": "2023-09-12",
        "verified": True,
        "source_url": "https://ndma.gov.in/sites/default/files/PDF/sdrf-constitution-guidelines.pdf",
        "tags": ["heavy rain", "heavy_rain", "cloudburst", "urban flood", "eligibility", "SDRF"],
    },

    # HEAVY RAIN — Documents
    {
        "id": "HEAVYRAIN-DOCUMENTS-001",
        "disaster": "heavy_rain",
        "category": "documents",
        "title": "Documents Required for Heavy Rain / Urban Flood Relief",
        "content": (
            "Documents for heavy rain / urban flooding relief (same as flood SDRF):\n"
            "1. Aadhaar Card (Mandatory)\n"
            "2. Bank Passbook / Account Details (Mandatory for DBT)\n"
            "3. Damage Photographs (Mandatory)\n"
            "4. Residence Proof — Ration card, voter ID, electricity bill (Mandatory)\n"
            "5. Revenue Officer / Panchayat / Municipal Certification of flooding (Mandatory)\n"
            "6. Property Ownership or Possession Certificate — If claiming house damage (Mandatory)\n"
            "7. Land Record / Khasra — If claiming crop loss (Mandatory for crop claim)\n"
            "8. Disaster Declaration Notification reference — from State/District (Conditional, may be required)\n"
            "Urban flood claimants may need to approach their Municipal Corporation relief counter."
        ),
        "source_authority": "Ministry of Home Affairs / Municipal Authority (Urban Areas)",
        "document_name": "SDRF Application Guidelines (2023) / NDMA Urban Flood Guidelines",
        "document_date": "2023-09-12",
        "verified": True,
        "source_url": "https://ndma.gov.in/sites/default/files/PDF/sdrf-ndrf-norms-2023.pdf",
        "tags": ["heavy rain", "heavy_rain", "documents", "urban flood", "Aadhaar", "municipal"],
    },

    # HEAVY RAIN — Timeline
    {
        "id": "HEAVYRAIN-TIMELINE-001",
        "disaster": "heavy_rain",
        "category": "timeline",
        "title": "Heavy Rain / Urban Flood Relief Claim Timeline",
        "content": (
            "Heavy rain / urban flooding relief process:\n"
            "Stage 1 — State/District Calamity Declaration: State Government declares event a natural calamity "
            "(timeline varies — usually within 3–7 days of event).\n"
            "Stage 2 — Damage Survey (7–21 days): Revenue Officer / Municipal survey team inspects affected areas.\n"
            "Stage 3 — Application Submission: Applicant submits form with documents to Tehsildar / Municipal Relief Counter.\n"
            "Stage 4 — District/Municipal Approval (21–45 days): Relief list consolidated and approved.\n"
            "Stage 5 — DBT Disbursement (45–60 days): Amounts transferred to bank accounts.\n"
            "Note: If the State does NOT declare the heavy rain event a formal natural calamity, "
            "the SDRF process may not be triggered — affected citizens should contact their District Collector's office."
        ),
        "source_authority": "Ministry of Home Affairs / NDMA / State Government",
        "document_name": "SDRF Guidelines (2023) / NDMA Urban Flood Management Guidelines (2010)",
        "document_date": "2023-09-12",
        "verified": True,
        "source_url": "https://ndma.gov.in/sites/default/files/PDF/sdrf-constitution-guidelines.pdf",
        "tags": ["heavy rain", "heavy_rain", "timeline", "urban flood", "calamity declaration", "DBT"],
    },
]


async def seed_disaster_rag_knowledge() -> int:
    """
    Seed the disaster_relief_knowledge Firestore collection.

    Uses upsert semantics: checks if the collection already contains the
    expected number of chunks. If the count matches, seeding is skipped.
    If the collection is empty OR incomplete (e.g. seeded with an older
    partial dataset), all KNOWLEDGE_CHUNKS are written/overwritten via
    document().set() so the knowledge base stays consistent with the
    current codebase without creating duplicates.

    Returns number of chunks written (0 if already fully seeded or error).
    """
    loop = asyncio.get_event_loop()
    expected_count = len(KNOWLEDGE_CHUNKS)

    def _get_current_count() -> int:
        try:
            col = get_col(DR_KNOWLEDGE_COL)
            # Fetch all doc IDs (no content) to count efficiently
            docs = list(col.select([]).stream())
            return len(docs)
        except Exception:
            return 0

    current_count = await loop.run_in_executor(None, _get_current_count)

    if current_count >= expected_count:
        logger.info(
            f"[DisasterRAG] Knowledge base already fully seeded "
            f"({current_count}/{expected_count} chunks) — skipping."
        )
        return 0

    if current_count > 0:
        logger.info(
            f"[DisasterRAG] Partial seed detected ({current_count}/{expected_count} chunks). "
            f"Upserting all {expected_count} chunks to ensure completeness."
        )
    else:
        logger.info(f"[DisasterRAG] Seeding {expected_count} knowledge chunks...")

    seeded_count = 0

    def _seed_chunk(chunk: Dict[str, Any]):
        col = get_col(DR_KNOWLEDGE_COL)
        doc_id = chunk["id"]
        data = {k: v for k, v in chunk.items() if k != "id"}
        data["seeded_at"] = datetime.utcnow().isoformat()
        # set() with no merge=True replaces the document entirely —
        # safe to call on existing docs without creating duplicates.
        col.document(doc_id).set(data)

    for chunk in KNOWLEDGE_CHUNKS:
        try:
            await loop.run_in_executor(None, _seed_chunk, chunk)
            seeded_count += 1
        except Exception as exc:
            logger.error(f"[DisasterRAG] Failed to seed chunk {chunk.get('id', '?')}: {exc}")

    logger.info(f"[DisasterRAG] Seeded {seeded_count} knowledge chunks into '{DR_KNOWLEDGE_COL}'.")
    return seeded_count
