from app.config.database import get_col

collection = get_col("disaster_schemes")

disasters = {
    "flood": [
        ("National Disaster Relief Fund", "₹5,00,000", 70, 100, "Financial assistance for severe flood damage."),
        ("Flood Rehabilitation Assistance Scheme", "₹3,00,000", 40, 69, "Support for rehabilitation after floods."),
        ("PM Flood Housing Assistance", "₹1,50,000", 20, 39, "House repair assistance for moderate damage."),
        ("State Flood Relief Grant", "₹50,000", 0, 19, "Immediate flood relief support."),
    ],

    "earthquake": [
        ("National Earthquake Relief Fund", "₹6,00,000", 70, 100, "Financial assistance for severe earthquake damage."),
        ("Earthquake House Reconstruction Scheme", "₹4,00,000", 40, 69, "House reconstruction assistance."),
        ("PM Rural Housing Assistance", "₹2,00,000", 20, 39, "Support for partially damaged houses."),
        ("Emergency Infrastructure Restoration Scheme", "₹75,000", 0, 19, "Basic infrastructure restoration support."),
    ],

    "cyclone": [
        ("Cyclone Relief Assistance Scheme", "₹5,50,000", 70, 100, "Relief for cyclone affected families."),
        ("Coastal Family Rehabilitation Scheme", "₹3,50,000", 40, 69, "Coastal rehabilitation assistance."),
        ("PM Emergency Shelter Assistance", "₹2,00,000", 20, 39, "Temporary shelter support."),
        ("Fishermen Compensation Scheme", "₹80,000", 0, 19, "Support for fishermen affected by cyclone."),
    ],

    "landslide": [
        ("Landslide Relief Assistance", "₹5,00,000", 70, 100, "Relief for severe landslide damage."),
        ("Hill Area Rehabilitation Scheme", "₹3,20,000", 40, 69, "Rehabilitation in hill regions."),
        ("House Reconstruction Grant", "₹1,80,000", 20, 39, "House reconstruction assistance."),
        ("Emergency Evacuation Support Scheme", "₹60,000", 0, 19, "Immediate evacuation support."),
    ],

    "fire": [
        ("Fire Damage Relief Scheme", "₹4,50,000", 70, 100, "Relief for major fire accidents."),
        ("House Reconstruction Assistance", "₹3,00,000", 40, 69, "House rebuilding assistance."),
        ("Small Business Compensation Scheme", "₹2,00,000", 20, 39, "Compensation for business loss."),
        ("Emergency Family Support Scheme", "₹75,000", 0, 19, "Immediate family assistance."),
    ],

    "heavy_rain": [
        ("Heavy Rain Damage Relief Scheme", "₹4,80,000", 70, 100, "Relief for severe heavy rain damage."),
        ("Urban Flood Compensation Scheme", "₹3,00,000", 40, 69, "Urban flooding compensation."),
        ("House Repair Assistance Scheme", "₹1,75,000", 20, 39, "House repair support."),
        ("Emergency Rain Relief Fund", "₹60,000", 0, 19, "Immediate rain relief assistance."),
    ],
}


count = 0

for disaster, schemes in disasters.items():
    for scheme_name, amount, min_damage, max_damage, description in schemes:

        collection.add({
            "disasterType": disaster,
            "state": "Punjab",
            "schemeName": scheme_name,
            "reliefAmount": amount,
            "minDamage": min_damage,
            "maxDamage": max_damage,
            "description": description,
            "active": True,
        })

        count += 1
        print(f"✅ Added: {scheme_name}")

print("\n==============================")
print(f"Successfully added {count} schemes.")
print("==============================")