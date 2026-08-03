"""
Auth service — uses Firebase Authentication REST API.
The frontend uses Firebase Auth SDK directly, so these endpoints
are for backend-side registration/login for compatibility.
In practice, the frontend should use Firebase Auth SDK directly.
"""

import asyncio
import httpx
import logging
from datetime import datetime
from fastapi import HTTPException

from app.config.database import get_col, doc_to_dict

logger = logging.getLogger("uvicorn.error")

FIREBASE_API_KEY = "AIzaSyDMMKT-hq0Aczc4mDT4MMWD6bLgJB8hfAE"
FIREBASE_SIGNUP_URL = f"https://identitytoolkit.googleapis.com/v1/accounts:signUp?key={FIREBASE_API_KEY}"
FIREBASE_SIGNIN_URL = f"https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key={FIREBASE_API_KEY}"


async def _firebase_rest(url: str, payload: dict) -> dict:
    async with httpx.AsyncClient(timeout=15.0) as client:
        resp = await client.post(url, json=payload)
        data = resp.json()
        if resp.status_code != 200:
            err = data.get("error", {}).get("message", "Firebase auth error")
            if "EMAIL_EXISTS" in err:
                raise HTTPException(status_code=400, detail="Email already registered.")
            if "INVALID_EMAIL" in err:
                raise HTTPException(status_code=400, detail="Invalid email format.")
            if "INVALID_PASSWORD" in err or "INVALID_LOGIN_CREDENTIALS" in err:
                raise HTTPException(status_code=401, detail="Invalid credentials.")
            if "WEAK_PASSWORD" in err:
                raise HTTPException(status_code=400, detail="Password should be at least 6 characters.")
            raise HTTPException(status_code=400, detail=err)
        return data


async def register_user(first_name: str, last_name: str, email: str, password: str) -> dict:
    """Register a new user with Firebase Auth and create a Firestore user document."""
    fire_resp = await _firebase_rest(FIREBASE_SIGNUP_URL, {
        "email": email,
        "password": password,
        "returnSecureToken": True,
    })

    uid = fire_resp["localId"]
    id_token = fire_resp["idToken"]

    # Also update Firebase Auth display name
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            await client.post(
                f"https://identitytoolkit.googleapis.com/v1/accounts:update?key={FIREBASE_API_KEY}",
                json={"idToken": id_token, "displayName": f"{first_name} {last_name}"},
            )
    except Exception:
        pass

    # Create Firestore user doc
    now = datetime.utcnow().isoformat()
    user_data = {
        "uid": uid,
        "firstName": first_name,
        "lastName": last_name,
        "email": email,
        "role": "citizen",
        "isActive": True,
        "createdAt": now,
        "updatedAt": now,
    }
    loop = asyncio.get_event_loop()
    await loop.run_in_executor(None, lambda: get_col("users").document(uid).set(user_data))

    return {
        "token": id_token,
        "user": {
            "id": uid,
            **user_data,
        }
    }


async def login_user(email: str, password: str) -> dict:
    """Sign in with Firebase Auth and return ID token."""
    fire_resp = await _firebase_rest(FIREBASE_SIGNIN_URL, {
        "email": email,
        "password": password,
        "returnSecureToken": True,
    })

    uid = fire_resp["localId"]
    id_token = fire_resp["idToken"]

    # Fetch user doc from Firestore
    loop = asyncio.get_event_loop()
    doc = await loop.run_in_executor(None, lambda: get_col("users").document(uid).get())
    user_data = doc.to_dict() if doc.exists else {}
    user_data["id"] = uid

    return {
        "token": id_token,
        "user": user_data,
    }


async def get_me(uid: str) -> dict:
    """Get the current user's profile from Firestore."""
    loop = asyncio.get_event_loop()
    doc = await loop.run_in_executor(None, lambda: get_col("users").document(uid).get())
    if not doc.exists:
        raise HTTPException(status_code=404, detail="User not found.")
    data = doc.to_dict()
    data["id"] = uid
    return {"user": data}
