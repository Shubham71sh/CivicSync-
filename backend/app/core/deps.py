"""
FastAPI dependency: get_current_user
Bridges app/core/deps.py to app/middleware/auth.py for consistency.
"""

from app.middleware.auth import get_current_user
