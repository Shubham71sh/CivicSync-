"""
Firebase Storage Service — optional helper for uploading files to Firebase Storage.

Usage:
    from app.services.storage_service import upload_file_to_storage

    url = await upload_file_to_storage(local_path="/path/to/file.pdf", blob_name="bills/abc.pdf")
    if url:
        # File is in Firebase Storage — url is the public download URL
    else:
        # Storage is disabled or unavailable — use local file path as fallback

Design:
- Returns the public download URL (str) on success.
- Returns None on any failure (Storage not configured, bucket unreachable, etc.)
  so callers can fall back to local disk storage without crashing.
- Uploads are performed synchronously in a thread executor to avoid blocking
  FastAPI's async event loop.
"""

import asyncio
import logging
import os

logger = logging.getLogger("uvicorn.error")


def _do_upload(local_path: str, blob_name: str) -> str | None:
    """
    Synchronous inner upload — runs in a thread executor.
    Returns the public download URL or None.
    """
    try:
        from firebase_admin import storage as fb_storage
        try:
            bucket = fb_storage.bucket()
        except Exception:
            return None

        if not bucket or not bucket.name:
            return None

        blob = bucket.blob(blob_name)
        content_type = "application/pdf" if local_path.endswith(".pdf") else "application/octet-stream"
        blob.upload_from_filename(local_path, content_type=content_type)

        # Make the blob publicly readable
        blob.make_public()
        url = blob.public_url
        logger.info(f"✅ Uploaded {blob_name} to Firebase Storage: {url}")
        return url

    except ImportError:
        return None
    except Exception as e:
        logger.debug(f"Firebase Storage upload skipped: {e}")
        return None


async def upload_file_to_storage(local_path: str, blob_name: str) -> str | None:
    """
    Upload a local file to Firebase Storage.

    Args:
        local_path: Absolute path to the file on disk.
        blob_name:  Destination path within the Storage bucket (e.g. "bills/abc.pdf").

    Returns:
        Public download URL string on success, None if Storage is unavailable.
    """
    if not os.path.exists(local_path):
        logger.warning(f"⚠️  upload_file_to_storage: file not found at {local_path}")
        return None

    loop = asyncio.get_event_loop()
    return await loop.run_in_executor(None, _do_upload, local_path, blob_name)


async def delete_file_from_storage(blob_name: str) -> bool:
    """
    Delete a file from Firebase Storage by its blob name.

    Returns True on success, False if Storage is unavailable or deletion fails.
    """
    def _do_delete():
        try:
            from firebase_admin import storage as fb_storage
            try:
                bucket = fb_storage.bucket()
            except Exception:
                return False
            if not bucket or not bucket.name:
                return False
            blob = bucket.blob(blob_name)
            blob.delete()
            logger.info(f"🗑️  Deleted {blob_name} from Firebase Storage.")
            return True
        except Exception as e:
            logger.debug(f"Firebase Storage delete skipped: {e}")
            return False

    loop = asyncio.get_event_loop()
    return await loop.run_in_executor(None, _do_delete)
