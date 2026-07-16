import uuid
from datetime import datetime, timedelta

from jose import jwt
from passlib.context import CryptContext
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings
from app.models.user import User
from app.models.invite_code import InviteCode

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


class AuthService:
    def __init__(self, db: AsyncSession):
        self.db = db

    def hash_password(self, password: str) -> str:
        return pwd_context.hash(password)

    def verify_password(self, plain_password: str, hashed_password: str) -> bool:
        return pwd_context.verify(plain_password, hashed_password)

    def create_token(self, user: User) -> str:
        expire = datetime.utcnow() + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
        payload = {
            "sub": str(user.id),
            "exp": expire,
            "is_admin": user.is_admin,
        }
        return jwt.encode(payload, settings.SECRET_KEY, algorithm=settings.ALGORITHM)

    async def get_user_by_username(self, username: str) -> User | None:
        result = await self.db.execute(select(User).where(User.username == username))
        return result.scalar_one_or_none()

    async def get_user_by_id(self, user_id: str) -> User | None:
        result = await self.db.execute(select(User).where(User.id == user_id))
        return result.scalar_one_or_none()

    async def create_admin_user(self, username: str, email: str, password: str) -> User:
        user = User(
            username=username,
            email=email,
            password_hash=self.hash_password(password),
            is_admin=True,
            is_active=True,
        )
        self.db.add(user)
        await self.db.commit()
        await self.db.refresh(user)
        return user

    async def register_user(self, username: str, email: str, password: str, invite_code_str: str) -> User:
        # 验证邀请码
        result = await self.db.execute(
            select(InviteCode).where(
                InviteCode.code == invite_code_str,
                InviteCode.is_active == True,
            )
        )
        invite_code = result.scalar_one_or_none()

        if not invite_code:
            raise ValueError("邀请码无效")

        if invite_code.expires_at and invite_code.expires_at < datetime.utcnow():
            raise ValueError("邀请码已过期")

        if invite_code.current_uses >= invite_code.max_uses:
            raise ValueError("邀请码已达使用上限")

        # 检查用户名是否已存在
        existing = await self.get_user_by_username(username)
        if existing:
            raise ValueError("用户名已存在")

        # 创建用户
        user = User(
            username=username,
            email=email,
            password_hash=self.hash_password(password),
            invite_code_id=invite_code.id,
        )
        self.db.add(user)

        # 更新邀请码使用次数
        invite_code.current_uses += 1
        if invite_code.current_uses >= invite_code.max_uses:
            invite_code.is_active = False

        await self.db.commit()
        await self.db.refresh(user)
        return user

    async def authenticate(self, username: str, password: str) -> User:
        user = await self.get_user_by_username(username)
        if not user:
            raise ValueError("用户名或密码错误")
        if not self.verify_password(password, user.password_hash):
            raise ValueError("用户名或密码错误")
        if not user.is_active:
            raise ValueError("账户已被禁用")
        return user
