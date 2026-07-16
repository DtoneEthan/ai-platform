from typing import List, Optional
from pydantic import BaseModel, Field


class AgentRunRequest(BaseModel):
    task: str = Field(..., min_length=1)
    model: str = Field(default="llama3")
    tools: List[str] = Field(default_factory=lambda: ["search", "calculator", "python"])


class AgentHistoryResponse(BaseModel):
    id: str
    task: str
    model: str
    result: str
    tool_calls: Optional[str] = None
    created_at: str

    class Config:
        from_attributes = True
