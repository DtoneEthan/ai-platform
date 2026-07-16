from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.middleware.auth import get_current_user
from app.models.user import User
from app.schemas.auth import RegisterRequest, LoginRequest, TokenResponse, UserResponse
from app.services.auth_service import AuthService

router = APIRouter(prefix="/api/auth", tags=["认证"])


@router.post("/register", response_model=TokenResponse)
async def register(request: RegisterRequest, db: AsyncSession = Depends(get_db)):
    auth_service = AuthService(db)
    try:
        user = await auth_service.register_user(
            username=request.username,
            email=request.email,
            password=request.password,
            invite_code_str=request.invite_code,
        )
        token = auth_service.create_token(user)
        return TokenResponse(
            access_token=token,
            user=UserResponse(
                id=str(user.id),
                username=user.username,
                email=user.email,
                is_admin=user.is_admin,
                is_active=user.is_active,
                created_at=user.created_at.isoformat(),
            ),
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/login", response_model=TokenResponse)
async def login(request: LoginRequest, db: AsyncSession = Depends(get_db)):
    auth_service = AuthService(db)
    try:
        user = await auth_service.authenticate(request.username, request.password)
        token = auth_service.create_token(user)
        return TokenResponse(
            access_token=token,
            user=UserResponse(
                id=str(user.id),
                username=user.username,
                email=user.email,
                is_admin=user.is_admin,
                is_active=user.is_active,
                created_at=user.created_at.isoformat(),
            ),
        )
    except ValueError as e:
        raise HTTPException(status_code=401, detail=str(e))


@router.get("/me", response_model=UserResponse)
async def get_me(current_user: User = Depends(get_current_user)):
    return UserResponse(
        id=str(current_user.id),
        username=current_user.username,
        email=current_user.email,
        is_admin=current_user.is_admin,
        is_active=current_user.is_active,
        created_at=current_user.created_at.isoformat(),
    )
