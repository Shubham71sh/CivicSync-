"""
Firebase Admin SDK initialization.
Uses service account JSON key (e.g. serviceAccountKey.json or civic-sync-cosmic-firebase-adminsdk-fbsvc-ddcee060c2.json).
"""

import os
import json
import logging
import firebase_admin
from firebase_admin import credentials, firestore as fs_admin

logger = logging.getLogger("uvicorn.error")

_firebase_app = None
_db = None


def _find_service_account_key() -> str:
    """Locate the service account key JSON file in the backend folder or env vars."""

    backend_dir = os.path.abspath(
        os.path.join(os.path.dirname(__file__), "..", "..")
    )

    candidates = [
        os.path.join(backend_dir, "serviceAccountKey.json"),
        os.path.join(
            backend_dir,
            "civic-sync-cosmic-firebase-adminsdk-fbsvc-ddcee060c2.json",
        ),
    ]

    # Environment variables
    for env_var in [
        "FIREBASE_SERVICE_ACCOUNT_KEY",
        "GOOGLE_APPLICATION_CREDENTIALS",
    ]:
        value = os.environ.get(env_var)
        if value:
            candidates.insert(0, os.path.abspath(value))

    # Search backend folder
    if os.path.exists(backend_dir):
        for fname in os.listdir(backend_dir):
            if fname.endswith(".json") and "firebase-adminsdk" in fname:
                full_path = os.path.join(backend_dir, fname)
                if full_path not in candidates:
                    candidates.append(full_path)

    for path in candidates:
        if os.path.isfile(path):
            try:
                with open(path, "r", encoding="utf-8") as f:
                    data = json.load(f)

                if (
                    isinstance(data, dict)
                    and (
                        data.get("type") == "service_account"
                        or "private_key" in data
                    )
                ):
                    return path

            except Exception as err:
                logger.warning(
                    f"Failed to parse Firebase service account JSON ({path}): {err}"
                )

    raise FileNotFoundError(
        "No valid Firebase service account JSON key found. "
        "Expected serviceAccountKey.json or "
        "civic-sync-cosmic-firebase-adminsdk-fbsvc-ddcee060c2.json "
        "inside backend/."
    )


def _init_firebase():
    global _firebase_app, _db

    if _firebase_app is not None and _db is not None:
        return _db

    # Reuse existing Firebase app if already initialized
    if firebase_admin._apps:
        _firebase_app = firebase_admin.get_app()
        logger.info("Using existing Firebase Admin app.")
    else:
        try:
            sa_path = _find_service_account_key()

            logger.info(f"Loading Firebase key: {sa_path}")

            cred = credentials.Certificate(sa_path)

            project_id = "civic-sync-cosmic"

            try:
                with open(sa_path, "r", encoding="utf-8") as f:
                    service_account = json.load(f)

                if service_account.get("project_id"):
                    project_id = service_account["project_id"]

            except Exception:
                pass

            _firebase_app = firebase_admin.initialize_app(
                cred,
                {
                    "projectId": project_id,
                    "storageBucket": f"{project_id}.firebasestorage.app",
                },
            )

            logger.info("✅ Firebase Admin initialized successfully.")

        except Exception as e:
            logger.critical(
                f"❌ Failed to initialize Firebase Admin SDK: {e}",
                exc_info=True,
            )
            _firebase_app = None
            _db = None
            raise

    options = {"projectId": "civic-sync-cosmic"}
    bucket_env = os.environ.get("FIREBASE_STORAGE_BUCKET")
    if bucket_env:
        options["storageBucket"] = bucket_env

    try:
        _db = fs_admin.client(_firebase_app)

        if _db is None:
            raise RuntimeError("Firestore client is None.")

        logger.info("✅ Firestore client initialized.")
        return _db

    except Exception as e:
        logger.critical(
            f"❌ Failed to initialize Firestore client: {e}",
            exc_info=True,
        )
        _db = None
        raise


def get_db():
    """
    Return Firestore client.
    """

    global _db

    if _db is None:
        _init_firebase()

    if _db is None:
        raise RuntimeError(
            "Firestore client is not initialized."
        )

    return _db