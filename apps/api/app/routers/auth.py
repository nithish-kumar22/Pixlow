"""Auth: register, login, me (JWT email/password)."""
import uuid
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException
from passlib.context import CryptContext
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth import create_access_token, get_current_user_id
from app.database import AsyncSessionLocal, get_db
from app.schemas.auth import LoginRequest, RegisterRequest, TokenResponse, UserMeResponse

router = APIRouter()
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def _hash_password(password: str) -> str:
    return pwd_context.hash(password)


def _verify_password(plain: str, hashed: str) -> bool:
    return pwd_context.verify(plain, hashed)


@router.post("/register", response_model=TokenResponse)
async def register(body: RegisterRequest) -> TokenResponse:
    """Create user and return JWT."""
    async with AsyncSessionLocal() as session:
        result = await session.execute(
            text("SELECT id FROM users WHERE email = :email"),
            {"email": body.email},
        )
        if result.mappings().first():
            raise HTTPException(status_code=400, detail="Email already registered")
        password_hash = _hash_password(body.password)
        await session.execute(
            text("""
                INSERT INTO users (email, password_hash, name, created_at, updated_at)
                VALUES (:email, :password_hash, NULL, now(), now())
            """),
            {"email": body.email, "password_hash": password_hash},
        )
        await session.commit()
        result = await session.execute(
            text("SELECT id FROM users WHERE email = :email"),
            {"email": body.email},
        )
        row = result.mappings().first()
        if not row:
            raise HTTPException(status_code=500, detail="User not created")
        user_id = row["id"]
    token = create_access_token(user_id, body.email)
    return TokenResponse(access_token=token)


@router.post("/login", response_model=TokenResponse)
async def login(body: LoginRequest) -> TokenResponse:
    """Verify email/password and return JWT."""
    async with AsyncSessionLocal() as session:
        result = await session.execute(
            text("SELECT id, password_hash FROM users WHERE email = :email"),
            {"email": body.email},
        )
        row = result.mappings().first()
        if not row:
            raise HTTPException(status_code=401, detail="Invalid email or password")
        user_id = row["id"]
        password_hash = row["password_hash"]
        if not password_hash or not _verify_password(body.password, password_hash):
            raise HTTPException(status_code=401, detail="Invalid email or password")
    token = create_access_token(user_id, body.email)
    return TokenResponse(access_token=token)


@router.get("/me", response_model=UserMeResponse)
async def me(
    user_id: Annotated[uuid.UUID, Depends(get_current_user_id)],
    db: Annotated[AsyncSession, Depends(get_db)],
) -> UserMeResponse:
    """Return current user id, email, name."""
    result = await db.execute(
        text("SELECT id, email, name FROM users WHERE id = :id"),
        {"id": user_id},
    )
    row = result.mappings().first()
    if not row:
        raise HTTPException(status_code=404, detail="User not found")
    return UserMeResponse(id=row["id"], email=row["email"], name=row["name"])
