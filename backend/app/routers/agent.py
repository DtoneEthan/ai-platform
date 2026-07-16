import json
import uuid
from datetime import datetime
from typing import List

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select, text
from sqlalchemy.ext.asyncio import AsyncSession
from sse_starlette.sse import EventSourceResponse

from app.database import get_db
from app.middleware.auth import get_current_user
from app.models.user import User
from app.schemas.agent import AgentRunRequest, AgentHistoryResponse
from app.services.agent_service import AgentService

router = APIRouter(prefix="/api/agent", tags=["Agent"])


# Agent历史记录临时用内存存储（可改为数据库表）
agent_history = {}


@router.post("/run")
async def run_agent(
    request: AgentRunRequest,
    current_user: User = Depends(get_current_user),
):
    agent_service = AgentService()

    async def event_stream():
        full_result = ""
        tool_calls = []

        try:
            async for event in agent_service.run_agent_stream(request.task, request.model):
                yield {"event": event["type"], "data": json.dumps(event)}

                if event["type"] == "final":
                    full_result = event["content"]
                    tool_calls = event.get("tool_results", [])
        except Exception as e:
            yield {"event": "error", "data": json.dumps({"error": str(e)})}
            return

        # 保存历史
        history_id = str(uuid.uuid4())
        agent_history[history_id] = {
            "id": history_id,
            "user_id": str(current_user.id),
            "task": request.task,
            "model": request.model,
            "result": full_result,
            "tool_calls": json.dumps(tool_calls, ensure_ascii=False),
            "created_at": datetime.utcnow().isoformat(),
        }

        yield {"event": "done", "data": json.dumps({"history_id": history_id})}

    return EventSourceResponse(event_stream())


@router.get("/history", response_model=List[AgentHistoryResponse])
async def get_history(current_user: User = Depends(get_current_user)):
    user_id = str(current_user.id)
    history = [
        AgentHistoryResponse(**h)
        for h in agent_history.values()
        if h["user_id"] == user_id
    ]
    # 按时间倒序
    history.sort(key=lambda x: x.created_at, reverse=True)
    return history


@router.get("/tools")
async def get_tools():
    return {
        "tools": [
            {
                "name": "calculator",
                "description": "数学计算器，支持各种数学表达式",
                "example": "计算 (123 * 456) / 789 的结果",
            },
            {
                "name": "python_exec",
                "description": "执行Python代码，用于数据处理和分析",
                "example": "用Python生成斐波那契数列前20项",
            },
            {
                "name": "web_search",
                "description": "搜索网络获取信息（演示模式）",
                "example": "搜索今天的天气",
            },
        ]
    }
