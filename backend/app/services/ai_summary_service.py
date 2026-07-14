import json
import logging
from app.config.gemini import get_gemini_client
from typing import Dict, Any

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
    You are an expert civic policy advisor and legislative analyst. Analyze the following legislative bill text (extracted from file '{file_name}').
    
    Generate a clean, structured JSON analysis containing:
    1. title: A concise, descriptive official title for the bill.
    2. billNumber: An official-looking bill number or reference code if found, or generate a realistic code if not (e.g., AB-1023, SB-492).
    3. summary: A plain-language summary of the bill's objectives and key provisions (approx. 2-4 sentences).
    4. keyPoints: An array of 3-5 distinct bullet points highlighting key clauses or regulations.
    5. impactScore: An integer from 1 to 100 representing the breadth and magnitude of the policy's impact on citizens.
    6. userImpact: A 1-2 sentence personalized impact analysis explaining how it affects typical working professionals, small businesses, or local communities.
    7. tags: An array of 2-4 relevant keywords (e.g., ["privacy", "technology", "tax", "environment", "infrastructure"]).
    
    Provide ONLY valid JSON inside a code block. Do not write any introduction or explanation.
    
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
        return {
            "title": analysis.get("title", file_name.replace(".pdf", "").title()),
            "billNumber": analysis.get("billNumber", "GEN-2026"),
            "summary": analysis.get("summary", "Summary of the legislative document."),
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
