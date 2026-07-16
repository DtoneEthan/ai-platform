from datetime import datetime, timedelta
from typing import List

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select, func, delete
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.middleware.auth import get_admin_user
from app.models.user import User
from app.models.invite_code import InviteCode
from app.models.conversation import Conversation, Message
from app.schemas.admin import AdminUserResponse, StatsResponse
from app.schemas.invite import InviteCodeCreate, InviteCodeResponse
from app.services.auth_service import AuthService

router = APIRouter(prefix="/api/admin", tags=["管理后台"])


# ==================== 统计 ====================

@router.get("/stats", response_model=StatsResponse)
async def get_stats(
    admin: User = Depends(get_admin_user),
    db: AsyncSession = Depends(get_db),
):
    total_users = (await db.execute(select(func.count(User.id)))).scalar()
    active_users = (await db.execute(
        select(func.count(User.id)).where(User.is_active == True)
    )).scalar()
    total_conversations = (await db.execute(
        select(func.count(Conversation.id))
    )).scalar()
    total_messages = (await db.execute(
        select(func.count(Message.id))
    )).scalar()
    total_invite_codes = (await db.execute(
        select(func.count(InviteCode.id))
    )).scalar()
    used_invite_codes = (await db.execute(
        select(func.count(InviteCode.id)).where(InviteCode.current_uses > 0)
    )).scalar()

    return StatsResponse(
        total_users=total_users,
        active_users=active_users,
        total_conversations=total_conversations,
        total_messages=total_messages,
        total_invite_codes=total_invite_codes,
        used_invite_codes=used_invite_codes,
    )


# ==================== 用户管理 ====================

@router.get("/users", response_model=List[AdminUserResponse])
async def list_users(
    admin: User = Depends(get_admin_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(User).order_by(User.created_at.desc())
    )
    users = result.scalars().all()
    return [
        AdminUserResponse(
            id=str(u.id),
            username=u.username,
            email=u.email,
            is_admin=u.is_admin,
            is_active=u.is_active,
            created_at=u.created_at.isoformat(),
        )
        for u in users
    ]


@router.put("/users/{user_id}/toggle")
async def toggle_user(
    user_id: str,
    admin: User = Depends(get_admin_user),
    db: AsyncSession = Depends(get_db),
):
    if str(admin.id) == user_id:
        raise HTTPException(status_code=400, detail="不能禁用自己的账户")

    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="用户不存在")

    user.is_active = not user.is_active
    await db.commit()
    return {"message": f"用户已{'启用' if user.is_active else '禁用'}", "is_active": user.is_active}


# ==================== 邀请码管理 ====================

@router.post("/invite-codes", response_model=InviteCodeResponse)
async def create_invite_code(
    request: InviteCodeCreate,
    admin: User = Depends(get_admin_user),
    db: AsyncSession = Depends(get_db),
):
    expires_at = None
    if request.expires_in_days:
        expires_at = datetime.utcnow() + timedelta(days=request.expires_in_days)

    invite_code = InviteCode(
        max_uses=request.max_uses,
        expires_at=expires_at,
        created_by=admin.id,
    )
    db.add(invite_code)
    await db.commit()
    await db.refresh(invite_code)

    return InviteCodeResponse(
        id=str(invite_code.id),
        code=invite_code.code,
        max_uses=invite_code.max_uses,
        current_uses=invite_code.current_uses,
        is_active=invite_code.is_active,
        expires_at=invite_code.expires_at.isoformat() if invite_code.expires_at else None,
        created_at=invite_code.created_at.isoformat(),
    )


@router.get("/invite-codes", response_model=List[InviteCodeResponse])
async def list_invite_codes(
    admin: User = Depends(get_admin_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(InviteCode).order_by(InviteCode.created_at.desc())
    )
    codes = result.scalars().all()
    return [
        InviteCodeResponse(
            id=str(c.id),
            code=c.code,
            max_uses=c.max_uses,
            current_uses=c.current_uses,
            is_active=c.is_active,
            expires_at=c.expires_at.isoformat() if c.expires_at else None,
            created_at=c.created_at.isoformat(),
        )
        for c in codes
    ]


@router.put("/invite-codes/{code_id}/toggle")
async def toggle_invite_code(
    code_id: str,
    admin: User = Depends(get_admin_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(InviteCode).where(InviteCode.id == code_id))
    code = result.scalar_one_or_none()
    if not code:
        raise HTTPException(status_code=404, detail="邀请码不存在")

    code.is_active = not code.is_active
    await db.commit()
    return {"message": f"邀请码已{'启用' if code.is_active else '禁用'}", "is_active": code.is_active}


@router.delete("/invite-codes/{code_id}")
async def delete_invite_code(
    code_id: str,
    admin: User = Depends(get_admin_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(InviteCode).where(InviteCode.id == code_id))
    code = result.scalar_one_or_none()
    if not code:
        raise HTTPException(status_code=404, detail="邀请码不存在")

    await db.delete(code)
    await db.commit()
    return {"message": "邀请码已删除"}
