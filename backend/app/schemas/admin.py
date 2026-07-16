from typing import List, Optional
from pydantic import BaseModel


class AdminUserResponse(BaseModel):
    id: str
    username: str
    email: str
    is_admin: bool
    is_active: bool
    created_at: str

    class Config:
        from_attributes = True


class StatsResponse(BaseModel):
    total_users: int
    active_users: int
    total_conversations: int
    total_messages: int
    total_invite_codes: int
    used_invite_codes: int
