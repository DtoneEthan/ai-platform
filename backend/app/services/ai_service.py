import json
from typing import AsyncIterator

import httpx

from app.config import settings


class AIService:
    def __init__(self):
        self.base_url = settings.OLLAMA_HOST

    async def list_models(self) -> list[str]:
        """获取可用的Ollama模型列表"""
        async with httpx.AsyncClient(timeout=10.0) as client:
            try:
                response = await client.get(f"{self.base_url}/api/tags")
                response.raise_for_status()
                data = response.json()
                return [m["name"] for m in data.get("models", [])]
            except Exception:
                return [settings.OLLAMA_DEFAULT_MODEL]

    async def chat_stream(
        self,
        messages: list[dict],
        model: str = None,
    ) -> AsyncIterator[str]:
        """流式聊天"""
        model = model or settings.OLLAMA_DEFAULT_MODEL

        async with httpx.AsyncClient(timeout=120.0) as client:
            async with client.stream(
                "POST",
                f"{self.base_url}/api/chat",
                json={
                    "model": model,
                    "messages": messages,
                    "stream": True,
                },
            ) as response:
                response.raise_for_status()
                async for line in response.aiter_lines():
                    if line.strip():
                        try:
                            data = json.loads(line)
                            if "message" in data and "content" in data["message"]:
                                yield data["message"]["content"]
                            if data.get("done", False):
                                break
                        except json.JSONDecodeError:
                            continue

    async def chat(
        self,
        messages: list[dict],
        model: str = None,
    ) -> str:
        """非流式聊天"""
        model = model or settings.OLLAMA_DEFAULT_MODEL

        async with httpx.AsyncClient(timeout=120.0) as client:
            response = await client.post(
                f"{self.base_url}/api/chat",
                json={
                    "model": model,
                    "messages": messages,
                    "stream": False,
                },
            )
            response.raise_for_status()
            data = response.json()
            return data["message"]["content"]
