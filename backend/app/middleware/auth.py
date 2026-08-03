"""
Authentication Middleware — verifies Firebase ID tokens.
Keeps compatibility with Module 3 (Transparency Engine) by returning
a unified user dict containing both 'uid' and '_id'.
"""

import logging
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from app.core.security import verify_firebase_token

logger = logging.getLogger("uvicorn.error")

security = HTTPBearer(auto_error=False)


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
) -> dict:
    """
    Decodes and validates a Firebase ID token from the Authorization header.
    Supports fallback to Demo User if header is missing or demo token is provided.
    """
    demo_user = {
        "_id": "demo_user_001",
        "uid": "demo_user_001",
        "firstName": "John",
        "lastName": "Doe",
        "email": "demo@civicsync.com",
        "role": "citizen",
        "location": "Central District, Jharkhand",
        "profession": "Tech Professional",
        "incomeRange": "$50,000 - $100,000",
    }

    if not credentials or not credentials.credentials:
        logger.info("No Authorization header provided. Defaulting to mock demo user.")
        return demo_user

    token = credentials.credentials

    # Support the frontend's hardcoded demo token
    if token == "civicsync_demo_token_xyz123":
        logger.info("Bypassing authentication for hardcoded CivicSync demo token.")
        return demo_user

    # Verify using Firebase SDK / API
    decoded = await verify_firebase_token(token)

    if not decoded:
        logger.warning("Firebase ID token verification failed.")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired Firebase ID token.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # Normalize uid to _id for backward compatibility
    decoded["_id"] = decoded.get("uid")
    return decoded
