"""
DEPRECATED: This module previously used SQLAlchemy.
All database operations now use Firebase Firestore via app.config.database.
This stub is kept for backward compatibility in case any old code imports from here.
"""

# Re-export Firestore helpers so any legacy imports still work
from app.config.database import get_col, doc_to_dict, docs_to_list  # noqa: F401


def get_db():
    """Deprecated: Returns Firestore client. Use get_col() from app.config.database instead."""
    from app.core.firebase import get_db as _get_firestore_db
    db = _get_firestore_db()
    if db is None:
        raise RuntimeError("Firestore client is None.")
    return db