"""
Firebase ID Token verification for FastAPI.
Verifies tokens from the Firebase Auth client SDK using Firebase Admin SDK.
No service account key required for token verification if Firebase Admin is initialized.
Falls back to REST API verification if admin SDK is not available.
"""

import os
import logging
import httpx
from typing import Optional

logger = logging.getLogger("uvicorn.error")

FIREBASE_PROJECT_ID = "civic-sync-cosmic"
FIREBASE_API_KEY = "AIzaSyDMMKT-hq0Aczc4mDT4MMWD6bLgJB8hfAE"


async def verify_firebase_token(id_token: str) -> Optional[dict]:
    """
    Verify a Firebase ID token.
    Primary: Use firebase_admin.auth.verify_id_token()
    Fallback: Use Firebase REST API
    Returns decoded token claims dict or None on failure.
    """
    # ── Primary: Firebase Admin SDK ──────────────────────────────────────────
    try:
        from firebase_admin import auth as fb_auth
        from app.core.firebase import get_db
        get_db()  # Ensure Firebase Admin SDK is initialized
        decoded = fb_auth.verify_id_token(id_token)
        return decoded
    except Exception as admin_err:
        logger.debug(f"Firebase Admin token verify failed ({admin_err}), trying REST fallback...")


    # ── Fallback: Firebase REST API token lookup ──────────────────────────────
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            resp = await client.post(
                f"https://identitytoolkit.googleapis.com/v1/accounts:lookup?key={FIREBASE_API_KEY}",
                json={"idToken": id_token},
            )
            if resp.status_code == 200:
                data = resp.json()
                users = data.get("users", [])
                if users:
                    user = users[0]
                    return {
                        "uid": user.get("localId"),
                        "email": user.get("email"),
                        "email_verified": user.get("emailVerified", False),
                        "name": user.get("displayName", ""),
                        "picture": user.get("photoUrl", ""),
                    }
            logger.warning(f"Firebase REST token lookup failed: {resp.status_code} {resp.text[:200]}")
    except Exception as rest_err:
        logger.error(f"Firebase REST token verify error: {rest_err}")

    return None
