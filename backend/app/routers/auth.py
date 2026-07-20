from fastapi import APIRouter, Depends
from pydantic import BaseModel
from app.services import auth_service
from app.core.deps import get_current_user

router = APIRouter(prefix="/auth", tags=["Auth"])


class RegisterRequest(BaseModel):
    firstName: str
    lastName: str
    email: str
    password: str


class LoginRequest(BaseModel):
    email: str
    password: str


@router.post("/register")
async def register(body: RegisterRequest):
    result = await auth_service.register_user(
        body.firstName, body.lastName, body.email, body.password
    )
    return {"success": True, "message": "Registration successful.", **result}


@router.post("/login")
async def login(body: LoginRequest):
    result = await auth_service.login_user(body.email, body.password)
    return {"success": True, "message": "Login successful.", **result}


@router.get("/me")
async def get_me(current_user: dict = Depends(get_current_user)):
    result = await auth_service.get_me(current_user["uid"])
    return {"success": True, **result}
