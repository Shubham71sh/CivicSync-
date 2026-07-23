import json
import logging
from typing import Dict, Any
from app.config.gemini import get_gemini_client

logger = logging.getLogger("uvicorn.error")

def generate_bill_analysis(text: str, file_name: str) -> Dict[str, Any]:
    """
    Calls the Gemini API to analyze the bill text and generate a structured JSON summary.
    Includes mock fallback data if the Gemini client is not initialized.
    """
    client = get_gemini_client()
    
    # Truncate text to avoid model token limits if the PDF is extremely long
    truncated_text = text[:30000]

    prompt = f"""
    You are a senior legislative analyst and public policy expert.

    Analyze the following bill carefully.

    Return ONLY valid JSON.

    The response should be comprehensive (700-1200 words).

    JSON Format:

    {{
    "title":"",
    "billNumber":"",

    "summary":[
    "",
    "",
    "",
    "",
    "",
    "",
    "",
    ""
    ],

    "purpose":"",

    "majorProvisions":[
    "",
    "",
    "",
    "",
    ""
    ],

    "keyPoints":[
    "",
    "",
    "",
    "",
    "",
    "",
    "",
    ""
    ],

    "benefits":[
    "",
    "",
    ""
    ],

    "challenges":[
    "",
    "",
    ""
    ],

    "stakeholders":[
    "",
    "",
    "",
    ""
    ],

    "financialImpact":"",

    "userImpact":"",

    "implementationTimeline":"",

    "conclusion":"",

    "impactScore":0,

    "tags":[]
    }}

    Important Instructions:

    - Summary MUST contain 8 detailed bullet points.
    - Each bullet should contain 2-3 complete sentences.
    - Explain provisions in simple language.
    - Do not skip important clauses.
    - Mention affected citizens whenever applicable.
    - Mention financial implications.
    - Mention long-term effects.
    - Mention implementation challenges.

    Bill Text:

    {truncated_text}
    """

    if client is None:
        logger.warning("Gemini Client not available. Using mock bill analysis.")
        return get_mock_bill_analysis(file_name)

    try:
        response = client.models.generate_content(
            model="gemini-flash-lite-latest",
            contents=prompt
        )
        
        response_text = response.text.strip()
        
        # Clean markdown code blocks if the model wrapped it
        if response_text.startswith("```json"):
            response_text = response_text[7:]
        if response_text.endswith("```"):
            response_text = response_text[:-3]
        response_text = response_text.strip()
        
        analysis = json.loads(response_text)
        logger.info(f"Successfully generated AI summary for {file_name} using Gemini.")
        
        # Convert summary from list to formatted string
        summary_raw = analysis.get("summary", "Summary of the legislative document.")
        if isinstance(summary_raw, list):
            # Join list items with double newlines for readable formatting
            summary_str = "\n\n".join(summary_raw)
        else:
            summary_str = summary_raw
        
        return {
            "title": analysis.get("title", file_name.replace(".pdf", "").title()),
            "billNumber": analysis.get("billNumber", "GEN-2026"),
            "summary": summary_str,
            "keyPoints": analysis.get("keyPoints", ["Provisions of the policy document."]),
            "impactScore": int(analysis.get("impactScore", 50)),
            "userImpact": analysis.get("userImpact", "Moderate impact on registered citizens."),
            "tags": analysis.get("tags", ["policy"]),
            "status": "pending"
        }
    except Exception as e:
        logger.error(f"Gemini API request failed: {e}. Falling back to mock summary.")
        return get_mock_bill_analysis(file_name)

def get_mock_bill_analysis(file_name: str) -> Dict[str, Any]:
    """
    Returns realistic mock analysis for fallback / development.
    """
    return {
        "title": file_name.replace(".pdf", "").replace("_", " ").replace("-", " ").title(),
        "billNumber": f"CC-{1000 + hash(file_name) % 9000}",
        "summary": "This regulatory bill proposes standard operating guidelines and reporting requirements for local municipal operations.",
        "keyPoints": [
            "Mandates transparent quarterly disclosures of expenditure budgets.",
            "Requires third-party independent compliance audits every two years.",
            "Enforces strict data classification rules for public documents."
        ],
        "impactScore": 72,
        "userImpact": "High impact for municipal workers and small service providers who must adapt their reporting frameworks.",
        "tags": ["governance", "transparency", "finance"],
        "status": "under_review"
    }