from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import datetime


class RegisterRequest(BaseModel):
    firstName: str
    lastName: str
    email: EmailStr
    password: str


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class UserOut(BaseModel):
    id: str
    firstName: str
    lastName: str
    email: str
    role: str = "citizen"
    verified: bool = False
    avatar: Optional[str] = None
    createdAt: Optional[datetime] = None


class TokenOut(BaseModel):
    success: bool = True
    message: str
    user: UserOut
    token: str
