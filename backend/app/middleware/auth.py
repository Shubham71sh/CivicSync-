from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
import jwt
from app.config.settings import settings
import logging

logger = logging.getLogger("uvicorn.error")

# Configure HTTPBearer security dependency
security = HTTPBearer(auto_error=False)

def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    """
    Decodes and validates a JWT token from the Authorization header.
    Supports a fallback to a default Demo User if the mock demo token is received,
    ensuring that local hackathon/development configurations run smoothly without modification.
    """
    demo_user = {
        "_id": "demo_user_001",
        "firstName": "John",
        "lastName": "Doe",
        "email": "demo@civicsync.com",
        "role": "citizen",
        "location": "Central District, Jharkhand",
        "profession": "Tech Professional",
        "incomeRange": "$50,000 - $100,000"
    }

    if not credentials:
        # Default behavior during local dev: bypass auth and return mock user
        logger.info("No Authorization header provided. Defaulting to mock demo user.")
        return demo_user

    token = credentials.credentials

    # Support the frontend's hardcoded demo token
    if token == "civicsync_demo_token_xyz123":
        logger.info("Bypassing authentication for hardcoded CivicSync demo token.")
        return demo_user

    try:
        # Validate JWT token
        payload = jwt.decode(
            token, 
            settings.JWT_SECRET, 
            algorithms=[settings.JWT_ALGORITHM]
        )
        logger.info(f"JWT token verified for user: {payload.get('email', 'unknown')}")
        return payload
    except jwt.ExpiredSignatureError:
        logger.warning("JWT token verification failed: Token expired.")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token has expired",
            headers={"WWW-Authenticate": "Bearer"},
        )
    except jwt.PyJWTError as e:
        logger.warning(f"JWT token verification failed: {e}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )
