def check_eligibility(damage_percent):

    if damage_percent >= 70:
        return {
            "is_eligible": True,
            "scheme_name": "National Disaster Relief Fund",
            "reason": "Heavy structural damage detected by AI",

            "amount": "₹95,100",
            "department": "Ministry of Home Affairs",
            "priority": "High",
            "confidence": 94,

            "benefits": [
                "Financial Assistance",
                "House Reconstruction",
                "Medical Assistance",
                "Food & Essential Supplies"
            ],

            "documents": [
                "Aadhaar Card",
                "Bank Passbook",
                "Damage Photos",
                "Residence Proof"
            ],

            "timeline": "7-14 Days",

            "status": "Approved for Application"
        }

    elif damage_percent >= 40:
        return {
            "is_eligible": True,
            "scheme_name": "State Disaster Relief Fund",
            "reason": "Moderate damage detected",

            "amount": "₹50,000",
            "department": "State Disaster Management Authority",
            "priority": "Medium",
            "confidence": 89,

            "benefits": [
                "Relief Assistance",
                "House Repair",
                "Food Support"
            ],

            "documents": [
                "Aadhaar Card",
                "Damage Photos",
                "Bank Passbook"
            ],

            "timeline": "10-20 Days",

            "status": "Eligible"
        }

    else:
        return {
            "is_eligible": False,
            "scheme_name": "Not Eligible",
            "reason": "Damage below eligibility threshold",

            "amount": "₹0",
            "department": "-",
            "priority": "Low",
            "confidence": 98,

            "benefits": [],
            "documents": [],
            "timeline": "-",

            "status": "Rejected"
        }