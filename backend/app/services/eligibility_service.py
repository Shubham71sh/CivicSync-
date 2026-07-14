def check_eligibility(damage_percent):

    if damage_percent >= 70:
        return {
            "is_eligible": True,
            "scheme_name": "National Disaster Relief Fund",
            "reason": "Heavy damage detected"
        }

    elif damage_percent >= 40:
        return {
            "is_eligible": True,
            "scheme_name": "State Disaster Relief Fund",
            "reason": "Moderate damage detected"
        }

    else:
        return {
            "is_eligible": False,
            "scheme_name": "Not Eligible",
            "reason": "Damage is below eligibility threshold"
        }