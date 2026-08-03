"""
Bill Controller — handles PDF upload, AI analysis, and Firestore storage.

Migration notes (MongoDB → Firebase):
- All CRUD operations already used Firestore get_col() — no changes there.
- Added: Optional Firebase Storage upload for uploaded bill PDFs.
  If Storage is reachable → `storageUrl` is stored in the Firestore doc.
  If Storage is unavailable/disabled → `filePath` (local disk) is used as fallback.
  The application never crashes due to Storage unavailability.
"""

import os
import uuid
import asyncio
from datetime import datetime
from fastapi import UploadFile, HTTPException, status
from app.config.settings import settings
from app.config.database import get_col
from app.services.pdf_service import extract_text_from_pdf
from app.services.ai_summary_service import generate_bill_analysis
from app.services.storage_service import upload_file_to_storage, delete_file_from_storage
from typing import Dict, Any, Optional
import traceback


class BillController:
    @staticmethod
    async def upload_bill_flow(file: UploadFile, current_user: Dict[str, Any]) -> Dict[str, Any]:
        """
        Flow: validate PDF → save locally → extract text → Gemini analysis →
        optionally upload to Firebase Storage → save to Firestore.
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
            traceback.print_exc()
            if os.path.exists(file_path):
                os.remove(file_path)
            raise HTTPException(
                status_code=status.HTTP_502_BAD_GATEWAY,
                detail=f"AI Summarization failed: {str(e)}"
            )

        bill_number = analysis.get("billNumber", "GEN-2026")

        # ── Optional: upload PDF to Firebase Storage ──────────────────────────
        blob_name = f"bills/{unique_id}/{saved_file_name}"
        storage_url = await upload_file_to_storage(file_path, blob_name)
        # storage_url is None when Storage is unavailable — fall back to local path

        loop = asyncio.get_event_loop()

        def _db_operations():
            # Check if bill with this billNumber already exists to keep its ID
            existing = list(get_col("bills").where("billNumber", "==", bill_number).stream())

            bill_id = unique_id
            if existing:
                existing_doc = existing[0]
                bill_id = existing_doc.id
                existing_data = existing_doc.to_dict()

                # Clean up old local file if different
                old_file_path = existing_data.get("filePath")
                if old_file_path and old_file_path != file_path and os.path.exists(old_file_path):
                    try:
                        os.remove(old_file_path)
                    except Exception:
                        pass

            # Build final bill document
            bill_doc = {
                "id": bill_id,
                "_id": bill_id,
                "title": analysis.get("title", file.filename.replace(".pdf", "").title()),
                "billNumber": bill_number,
                "status": analysis.get("status", "pending"),
                "uploadedAt": datetime.utcnow().isoformat() + "Z",
                "summary": analysis.get("summary", ""),
                "extractedText": extracted_text,
                "impactScore": analysis.get("impactScore", 50),
                "userImpact": analysis.get("userImpact", ""),
                "keyPoints": analysis.get("keyPoints", []),
                "tags": analysis.get("tags", []),
                # Firebase Storage URL takes priority; local path is the fallback
                "storageUrl": storage_url or "",
                "filePath": file_path if not storage_url else "",
                "storageBlobName": blob_name if storage_url else "",
                "userId": current_user.get("uid", "demo_user_001"),
            }

            # Set Firestore document
            get_col("bills").document(bill_id).set(bill_doc)
            return bill_doc, bill_id

        try:
            bill_doc, bill_id = await loop.run_in_executor(None, _db_operations)
        except Exception as e:
            if os.path.exists(file_path):
                os.remove(file_path)
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Database update failed: {str(e)}"
            )

        return {
            "bill": bill_doc,
            "analysisId": bill_id,
        }

    @staticmethod
    async def get_bills_flow(
        search: Optional[str] = None,
        status_filter: Optional[str] = None,
        page: int = 1,
        limit: int = 10,
        current_user: Optional[Dict[str, Any]] = None,
    ) -> Dict[str, Any]:
        """
        Fetch lists of bills with pagination, search queries, and status filtering from Firestore.
        """
        loop = asyncio.get_event_loop()

        def _fetch():
            ref = get_col("bills")
            # Filter by userId if provided
            user_id = current_user.get("uid") if current_user else None
            if user_id:
                ref = ref.where("userId", "==", user_id)
            return list(ref.stream())

        try:
            docs = await loop.run_in_executor(None, _fetch)
            bills_list = []
            for doc in docs:
                data = doc.to_dict()
                data["id"] = doc.id
                data["_id"] = doc.id
                
                # DEFENSIVE: Convert summary from list to string if needed
                summary = data.get("summary", "")
                if isinstance(summary, list):
                    data["summary"] = "\n\n".join(summary)
                
                bills_list.append(data)

            # Filter in-memory for search and status
            if search:
                s_lower = search.lower()
                bills_list = [
                    b for b in bills_list
                    if s_lower in b.get("title", "").lower()
                    or s_lower in b.get("billNumber", "").lower()
                ]

            if status_filter and status_filter != "all":
                bills_list = [b for b in bills_list if b.get("status") == status_filter]

            # Sort in-memory by uploadedAt descending
            bills_list.sort(key=lambda x: x.get("uploadedAt", ""), reverse=True)

            total = len(bills_list)
            skip = (page - 1) * limit
            paginated = bills_list[skip:skip + limit]
            pages = (total + limit - 1) // limit if total > 0 else 1

            return {
                "bills": paginated,
                "total": total,
                "page": page,
                "pages": pages,
            }
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Database query failed: {str(e)}"
            )

    @staticmethod
    async def get_bill_by_id_flow(bill_id: str) -> Dict[str, Any]:
        """Retrieve details of a single bill from Firestore."""
        loop = asyncio.get_event_loop()
        try:
            doc = await loop.run_in_executor(
                None, lambda: get_col("bills").document(bill_id).get()
            )
            if not doc.exists:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail=f"Bill with ID '{bill_id}' not found."
                )
            bill_data = doc.to_dict()
            bill_data["id"] = doc.id
            bill_data["_id"] = doc.id
            
            # DEFENSIVE: Convert summary from list to string if needed
            summary = bill_data.get("summary", "")
            if isinstance(summary, list):
                bill_data["summary"] = "\n\n".join(summary)
            
            return {"bill": bill_data}
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
        Delete a bill from Firestore and clean up its stored file
        (Firebase Storage blob or local disk file).
        """
        loop = asyncio.get_event_loop()
        try:
            doc = await loop.run_in_executor(
                None, lambda: get_col("bills").document(bill_id).get()
            )
            if not doc.exists:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail=f"Bill with ID '{bill_id}' not found."
                )

            bill = doc.to_dict()

            # Delete from Firebase Storage if a blob name is stored
            blob_name = bill.get("storageBlobName")
            if blob_name:
                await delete_file_from_storage(blob_name)

            # Delete local file if it exists (fallback path)
            file_path = bill.get("filePath")
            if file_path and os.path.exists(file_path):
                try:
                    os.remove(file_path)
                except Exception:
                    pass

            # Delete Firestore document
            await loop.run_in_executor(
                None, lambda: get_col("bills").document(bill_id).delete()
            )
            return {"success": True, "message": "Bill deleted successfully."}
        except HTTPException:
            raise
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Database deletion failed: {str(e)}"
            )
