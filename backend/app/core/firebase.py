"""
Firebase Admin SDK initialization.
Uses serviceAccountKey.json if present, otherwise falls back to
project-only initialization (suitable for local dev with Firebase emulator
or when Google Application Default Credentials are configured).
"""

import os
import logging
import firebase_admin
from firebase_admin import credentials, firestore as fs_admin

logger = logging.getLogger("uvicorn.error")

_firebase_app = None
_db = None


def _init_firebase():
    global _firebase_app, _db
    if _firebase_app is not None:
        return _db

    # Path to optional service account key
    sa_path = os.path.join(os.path.dirname(__file__), "..", "..", "serviceAccountKey.json")
    sa_path = os.path.abspath(sa_path)

    try:
        if os.path.exists(sa_path):
            cred = credentials.Certificate(sa_path)
            _firebase_app = firebase_admin.initialize_app(cred, {
                "projectId": "civic-sync-cosmic",
                "storageBucket": "civic-sync-cosmic.appspot.com",
            })
            logger.info("✅ Firebase Admin initialized with service account key.")
        else:
            # Use GOOGLE_APPLICATION_CREDENTIALS env var or ADC
            adc_path = os.environ.get("GOOGLE_APPLICATION_CREDENTIALS", "")
            if adc_path and os.path.exists(adc_path):
                cred = credentials.Certificate(adc_path)
                _firebase_app = firebase_admin.initialize_app(cred, {
                    "projectId": "civic-sync-cosmic",
                    "storageBucket": "civic-sync-cosmic.appspot.com",
                })
                logger.info("✅ Firebase Admin initialized with GOOGLE_APPLICATION_CREDENTIALS.")
            else:
                # No credentials file — initialize with no-auth (works if running
                # locally with 'firebase emulators' or within GCP environment)
                _firebase_app = firebase_admin.initialize_app(options={
                    "projectId": "civic-sync-cosmic",
                    "storageBucket": "civic-sync-cosmic.appspot.com",
                })
                logger.warning(
                    "⚠️  Firebase Admin initialized WITHOUT credentials. "
                    "Place serviceAccountKey.json in backend/ to enable full access."
                )
        _db = fs_admin.client()
        logger.info("✅ Firestore client ready.")
        return _db
    except Exception as e:
        logger.error(f"❌ Firebase Admin init failed: {e}")
        raise e


def get_db():
    """Return the Firestore client, initializing Firebase if needed."""
    global _db
    if _db is None:
        _init_firebase()
    return _db
