from fastapi import HTTPException, status
from app.services.fake_news_service import verify_claim_with_ai
from typing import Dict, Any, Optional

class FakeNewsController:
    @staticmethod
    async def verify_claim_flow(text: str, url: Optional[str] = None) -> Dict[str, Any]:
        """
        Orchestrates fake news claim verification.
        """
        if not text or not text.strip():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Verification text content cannot be empty."
            )
            
        try:
            result = verify_claim_with_ai(text, url)
            return result
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Verification failed: {str(e)}"
            )
