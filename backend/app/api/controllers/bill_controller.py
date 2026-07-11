import os
import uuid
from datetime import datetime
from fastapi import UploadFile, HTTPException, status
from app.config.settings import settings
from app.config.database import get_db
from app.services.pdf_service import extract_text_from_pdf
from app.services.ai_summary_service import generate_bill_analysis
from typing import Dict, Any, Optional

class BillController:
    @staticmethod
    async def upload_bill_flow(file: UploadFile, current_user: Dict[str, Any]) -> Dict[str, Any]:
        """
        Flow to handle PDF upload, extract text, call Gemini for analysis, and save to MongoDB.
        """
        # Ensure uploads folder exists
        os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
        
        # Validate file extension
        if not file.filename.endswith(".pdf"):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid file format. Only PDF files are supported."
            )
            
        # Create a unique filename and save to local uploads directory
        unique_id = f"bill_{uuid.uuid4().hex[:8]}"
        saved_file_name = f"{unique_id}_{file.filename}"
        file_path = os.path.join(settings.UPLOAD_DIR, saved_file_name)
        
        try:
            with open(file_path, "wb") as buffer:
                content = await file.read()
                buffer.write(content)
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to save file to disk: {str(e)}"
            )

        # Extract text from the saved PDF file
        try:
            extracted_text = extract_text_from_pdf(file_path)
            if not extracted_text:
                raise ValueError("No readable text found in PDF.")
        except Exception as e:
            # Clean up the file if processing fails
            if os.path.exists(file_path):
                os.remove(file_path)
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail=f"Failed to extract text from PDF: {str(e)}"
            )

        # Call Gemini AI summary service to analyze the bill content
        try:
            analysis = generate_bill_analysis(extracted_text, file.filename)
        except Exception as e:
            if os.path.exists(file_path):
                os.remove(file_path)
            raise HTTPException(
                status_code=status.HTTP_502_BAD_GATEWAY,
                detail=f"AI Summarization failed: {str(e)}"
            )

        # Build final bill document
        bill_doc = {
            "_id": unique_id,
            "title": analysis.get("title", file.filename.replace(".pdf", "").title()),
            "billNumber": analysis.get("billNumber", "GEN-2026"),
            "status": analysis.get("status", "pending"),
            "uploadedAt": datetime.utcnow().isoformat() + "Z", # Match standard ISO format used by JS
            "summary": analysis.get("summary", ""),
            "extractedText": extracted_text,
            "impactScore": analysis.get("impactScore", 50),
            "userImpact": analysis.get("userImpact", ""),
            "keyPoints": analysis.get("keyPoints", []),
            "tags": analysis.get("tags", []),
            "filePath": file_path,
            "userId": current_user.get("_id", "demo_user_001")
        }

        # Store in MongoDB
        db = get_db()
        try:
            await db.bills.insert_one(bill_doc)
        except Exception as e:
            if os.path.exists(file_path):
                os.remove(file_path)
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Database insertion failed: {str(e)}"
            )

        # Form response model (renaming _id to id happens in Schema layer or controller)
        # Note: mapping _id back in returned JSON to match what frontend needs
        return {
            "bill": {**bill_doc, "_id": unique_id},
            "analysisId": unique_id
        }

    @staticmethod
    async def get_bills_flow(
        search: Optional[str] = None,
        status_filter: Optional[str] = None,
        page: int = 1,
        limit: int = 10,
        current_user: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """
        Fetch lists of bills with pagination, search queries, and status filtering.
        """
        db = get_db()
        query = {}
        
        # If we want to isolate by user, we can restrict by userId
        if current_user and current_user.get("_id"):
            query["userId"] = current_user.get("_id")
            
        if search:
            # Case insensitive search on title or billNumber
            query["$or"] = [
                {"title": {"$regex": search, "$options": "i"}},
                {"billNumber": {"$regex": search, "$options": "i"}}
            ]
            
        if status_filter and status_filter != "all":
            query["status"] = status_filter

        try:
            total = await db.bills.count_documents(query)
            skip = (page - 1) * limit
            
            cursor = db.bills.find(query).skip(skip).limit(limit).sort("uploadedAt", -1)
            bills_list = []
            async for doc in cursor:
                bills_list.append(doc)
                
            pages = (total + limit - 1) // limit if total > 0 else 1
            
            return {
                "bills": bills_list,
                "total": total,
                "page": page,
                "pages": pages
            }
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Database query failed: {str(e)}"
            )

    @staticmethod
    async def get_bill_by_id_flow(bill_id: str) -> Dict[str, Any]:
        """
        Retrieve details of a single bill.
        """
        db = get_db()
        try:
            bill = await db.bills.find_one({"_id": bill_id})
            if not bill:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail=f"Bill with ID '{bill_id}' not found."
                )
            return {"bill": bill}
        except HTTPException:
            raise
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Database query failed: {str(e)}"
            )

    @staticmethod
    async def delete_bill_flow(bill_id: str) -> Dict[str, Any]:
        """
        Delete a bill by its ID. Also clean up its file on disk.
        """
        db = get_db()
        try:
            bill = await db.bills.find_one({"_id": bill_id})
            if not bill:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail=f"Bill with ID '{bill_id}' not found."
                )
            
            # Delete file on disk if it exists
            file_path = bill.get("filePath")
            if file_path and os.path.exists(file_path):
                try:
                    os.remove(file_path)
                except Exception as ex:
                    # Log error, but proceed to delete from DB
                    pass
            
            # Delete database document
            await db.bills.delete_one({"_id": bill_id})
            return {"success": True, "message": "Bill deleted successfully."}
        except HTTPException:
            raise
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Database deletion failed: {str(e)}"
            )
