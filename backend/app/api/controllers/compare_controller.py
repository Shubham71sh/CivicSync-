from fastapi import HTTPException, status
from app.config.database import get_db
from app.services.compare_service import compare_bills_with_ai
from typing import List, Dict, Any

class CompareController:
    @staticmethod
    async def compare_bills_flow(bill_ids: List[str]) -> Dict[str, Any]:
        """
        Retrieves details of specified bills from MongoDB and calls compare_service to generate AI difference logs.
        """
        if len(bill_ids) < 2:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Must specify at least 2 bill IDs for side-by-side comparison."
            )

        db = get_db()
        try:
            # Query for the requested bill IDs
            cursor = db.bills.find({"_id": {"$in": bill_ids}})
            bills_list = []
            async for doc in cursor:
                bills_list.append(doc)
            
            # If the user selects a second bill that is mocked or doesn't exist, we can fetch
            # a default one from database or use the same bill twice for demo safety.
            if len(bills_list) == 0:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="None of the selected bill IDs exist in database."
                )
            
            # Safety fallback for demo: if they select only one existing bill, duplicate it to allow analysis
            if len(bills_list) == 1:
                bills_list.append(bills_list[0])

            # Call AI Comparison Service
            comparison_results = compare_bills_with_ai(bills_list)
            
            return {
                "comparison": {
                    "bills": bills_list,
                    "similarities": comparison_results.get("similarities", []),
                    "differences": comparison_results.get("differences", [])
                }
            }
        except HTTPException:
            raise
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to generate bill comparison: {str(e)}"
            )
