"""
routes/auth.py
JWT Authentication:
  POST /auth/register  → create user
  POST /auth/login     → get JWT token
  GET  /auth/me        → get current user
"""

import os
import jwt
import hashlib
from datetime import datetime, timedelta
from fastapi import APIRouter, HTTPException, Header
from typing import Optional

from database.connection import get_users_collection
from models.task_model import UserRegister, UserLogin

router = APIRouter()

# ─── JWT Config ───────────────────────────────────────────────────────────────
JWT_SECRET = os.getenv("JWT_SECRET", "classroom_secret_key_change_in_production")
JWT_ALGORITHM = "HS256"
JWT_EXPIRY_HOURS = 24

def hash_password(password: str) -> str:
    """Simple SHA-256 hash (use bcrypt in production)."""
    return hashlib.sha256(password.encode()).hexdigest()

def create_token(user_id: str, role: str) -> str:
    """Create a JWT token."""
    payload = {
        "user_id": user_id,
        "role": role,
        "exp": datetime.utcnow() + timedelta(hours=JWT_EXPIRY_HOURS)
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)

def verify_token(token: str) -> dict:
    """Verify and decode JWT token."""
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        return payload
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token has expired.")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token.")

# ─── POST /auth/register ──────────────────────────────────────────────────────
@router.post("/register")
async def register(user: UserRegister):
    """Register a new teacher or student."""
    collection = get_users_collection()

    # Check if email already exists
    existing = await collection.find_one({"email": user.email})
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered.")

    doc = {
        "name":       user.name,
        "email":      user.email,
        "password":   hash_password(user.password),
        "role":       user.role,
        "created_at": datetime.utcnow().isoformat(),
    }
    result = await collection.insert_one(doc)
    user_id = str(result.inserted_id)
    token = create_token(user_id, user.role)

    return {
        "message": "Registration successful!",
        "user": {
            "id":    user_id,
            "name":  user.name,
            "email": user.email,
            "role":  user.role,
        },
        "token": token
    }

# ─── POST /auth/login ─────────────────────────────────────────────────────────
@router.post("/login")
async def login(credentials: UserLogin):
    """Login with email and password, receive JWT token."""
    collection = get_users_collection()

    user = await collection.find_one({"email": credentials.email})
    if not user:
        raise HTTPException(status_code=404, detail="User not found.")

    if user["password"] != hash_password(credentials.password):
        raise HTTPException(status_code=401, detail="Incorrect password.")

    user_id = str(user["_id"])
    token = create_token(user_id, user["role"])

    return {
        "message": "Login successful!",
        "user": {
            "id":    user_id,
            "name":  user["name"],
            "email": user["email"],
            "role":  user["role"],
        },
        "token": token
    }

# ─── GET /auth/me ─────────────────────────────────────────────────────────────
@router.get("/me")
async def get_current_user(authorization: Optional[str] = Header(None)):
    """Get current user details from JWT token."""
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Authorization header missing.")

    token = authorization.split(" ")[1]
    payload = verify_token(token)

    return {
        "user_id": payload["user_id"],
        "role":    payload["role"],
    }
