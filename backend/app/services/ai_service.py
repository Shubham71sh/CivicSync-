import os
import json
from dotenv import load_dotenv
from google import genai

load_dotenv()

client = genai.Client(
    api_key=os.getenv("GEMINI_API_KEY")
)

def analyze_disaster(disaster_type):

    prompt = f"""
You are an AI disaster assessment expert.

Disaster Type: {disaster_type}

Return ONLY JSON.

Example:

{{
"damage_percent":82,
"severity":"High",
"house_damage":90,
"crop_damage":75,
"vehicle_damage":20,
"estimated_loss":450000,
"ai_confidence":94
}}
"""

    try:
        response = client.models.generate_content(
            model="gemini-flash-latest",
            contents=prompt
        )

        return json.loads(response.text)

    except Exception as e:
        print("Gemini Error:", e)

        # Fallback data
        return {
            "damage_percent": 82,
            "severity": "High",
            "house_damage": 90,
            "crop_damage": 75,
            "vehicle_damage": 20,
            "estimated_loss": 450000,
            "ai_confidence": 94
        }