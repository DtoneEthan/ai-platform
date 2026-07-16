import json
import uuid
from typing import List

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select, delete
from sqlalchemy.ext.asyncio import AsyncSession
from sse_starlette.sse import EventSourceResponse

from app.database import get_db
from app.middleware.auth import get_current_user
from app.models.user import User
from app.models.conversation import Conversation, Message
from app.schemas.chat import (
    ChatRequest,
    ConversationResponse,
    ConversationDetail,
    MessageResponse,
)
from app.services.ai_service import AIService

router = APIRouter(prefix="/api", tags=["问答"])


@router.get("/conversations", response_model=List[ConversationResponse])
async def list_conversations(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Conversation)
        .where(Conversation.user_id == current_user.id)
        .order_by(Conversation.updated_at.desc())
    )
    conversations = result.scalars().all()
    return [
        ConversationResponse(
            id=str(c.id),
            title=c.title,
            model=c.model,
            created_at=c.created_at.isoformat(),
            updated_at=c.updated_at.isoformat(),
        )
        for c in conversations
    ]


@router.get("/conversations/{conv_id}", response_model=ConversationDetail)
async def get_conversation(
    conv_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Conversation).where(
            Conversation.id == conv_id,
            Conversation.user_id == current_user.id,
        )
    )
    conversation = result.scalar_one_or_none()
    if not conversation:
        raise HTTPException(status_code=404, detail="对话不存在")

    return ConversationDetail(
        id=str(conversation.id),
        title=conversation.title,
        model=conversation.model,
        created_at=conversation.created_at.isoformat(),
        updated_at=conversation.updated_at.isoformat(),
        messages=[
            MessageResponse(
                id=str(m.id),
                role=m.role,
                content=m.content,
                created_at=m.created_at.isoformat(),
            )
            for m in conversation.messages
        ],
    )


@router.delete("/conversations/{conv_id}")
async def delete_conversation(
    conv_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Conversation).where(
            Conversation.id == conv_id,
            Conversation.user_id == current_user.id,
        )
    )
    conversation = result.scalar_one_or_none()
    if not conversation:
        raise HTTPException(status_code=404, detail="对话不存在")

    await db.delete(conversation)
    await db.commit()
    return {"message": "删除成功"}


@router.post("/chat")
async def chat(
    request: ChatRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    ai_service = AIService()

    # 获取或创建对话
    if request.conversation_id:
        result = await db.execute(
            select(Conversation).where(
                Conversation.id == request.conversation_id,
                Conversation.user_id == current_user.id,
            )
        )
        conversation = result.scalar_one_or_none()
        if not conversation:
            raise HTTPException(status_code=404, detail="对话不存在")
    else:
        # 用前20个字符作为标题
        title = request.message[:20] + ("..." if len(request.message) > 20 else "")
        conversation = Conversation(
            user_id=current_user.id,
            title=title,
            model=request.model,
        )
        db.add(conversation)
        await db.commit()
        await db.refresh(conversation)

    # 保存用户消息
    user_msg = Message(
        conversation_id=conversation.id,
        role="user",
        content=request.message,
    )
    db.add(user_msg)
    await db.commit()

    # 获取历史消息构建上下文
    result = await db.execute(
        select(Message)
        .where(Message.conversation_id == conversation.id)
        .order_by(Message.created_at)
    )
    all_messages = result.scalars().all()

    chat_messages = [
        {"role": m.role, "content": m.content}
        for m in all_messages
    ]

    async def event_stream():
        full_response = ""
        try:
            async for chunk in ai_service.chat_stream(chat_messages, request.model):
                full_response += chunk
                yield {"event": "message", "data": json.dumps({"content": chunk, "conversation_id": str(conversation.id)})}
        except Exception as e:
            yield {"event": "error", "data": json.dumps({"error": str(e)})}
            return

        # 保存助手回复
        async with async_session() as save_db:
            assistant_msg = Message(
                conversation_id=conversation.id,
                role="assistant",
                content=full_response,
            )
            save_db.add(assistant_msg)
            await save_db.commit()

        yield {"event": "done", "data": json.dumps({"conversation_id": str(conversation.id)})}

    from app.database import async_session

    return EventSourceResponse(event_stream())


@router.get("/models")
async def list_models():
    ai_service = AIService()
    models = await ai_service.list_models()
    return {"models": models}
