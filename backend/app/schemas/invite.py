from typing import Optional
from pydantic import BaseModel, Field


class InviteCodeCreate(BaseModel):
    max_uses: int = Field(default=1, ge=1)
    expires_in_days: Optional[int] = Field(default=None, ge=1)


class InviteCodeResponse(BaseModel):
    id: str
    code: str
    max_uses: int
    current_uses: int
    is_active: bool
    expires_at: Optional[str] = None
    created_at: str

    class Config:
        from_attributes = True
