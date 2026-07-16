from typing import List, Optional
from pydantic import BaseModel, Field


class ChatRequest(BaseModel):
    conversation_id: Optional[str] = None
    message: str = Field(..., min_length=1)
    model: str = Field(default="llama3")


class MessageResponse(BaseModel):
    id: str
    role: str
    content: str
    created_at: str

    class Config:
        from_attributes = True


class ConversationResponse(BaseModel):
    id: str
    title: str
    model: str
    created_at: str
    updated_at: str

    class Config:
        from_attributes = True


class ConversationDetail(ConversationResponse):
    messages: List[MessageResponse] = []
