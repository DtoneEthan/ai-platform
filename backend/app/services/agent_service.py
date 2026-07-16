import json
import asyncio
import subprocess
import math
from typing import AsyncIterator

import httpx

from app.config import settings


class AgentService:
    def __init__(self):
        self.base_url = settings.OLLAMA_HOST

    TOOLS_DEFINITION = [
        {
            "type": "function",
            "function": {
                "name": "calculator",
                "description": "执行数学计算。输入一个数学表达式，返回计算结果。",
                "parameters": {
                    "type": "object",
                    "properties": {
                        "expression": {
                            "type": "string",
                            "description": "要计算的数学表达式，例如: '2 + 3 * 4' 或 'sqrt(16)'",
                        }
                    },
                    "required": ["expression"],
                },
            },
        },
        {
            "type": "function",
            "function": {
                "name": "web_search",
                "description": "搜索网络获取信息。当你需要查找最新信息时使用此工具。",
                "parameters": {
                    "type": "object",
                    "properties": {
                        "query": {
                            "type": "string",
                            "description": "搜索关键词",
                        }
                    },
                    "required": ["query"],
                },
            },
        },
        {
            "type": "function",
            "function": {
                "name": "python_exec",
                "description": "执行Python代码并返回结果。用于数据计算、处理和分析。",
                "parameters": {
                    "type": "object",
                    "properties": {
                        "code": {
                            "type": "string",
                            "description": "要执行的Python代码",
                        }
                    },
                    "required": ["code"],
                },
            },
        },
    ]

    def _execute_tool(self, name: str, args: dict) -> str:
        """执行工具调用"""
        if name == "calculator":
            try:
                expression = args.get("expression", "")
                # 安全的数学计算
                allowed_names = {
                    k: v for k, v in math.__dict__.items()
                    if not k.startswith("_")
                }
                allowed_names["abs"] = abs
                allowed_names["round"] = round
                result = eval(expression, {"__builtins__": {}}, allowed_names)
                return str(result)
            except Exception as e:
                return f"计算错误: {str(e)}"

        elif name == "python_exec":
            try:
                code = args.get("code", "")
                result = subprocess.run(
                    ["python3", "-c", code],
                    capture_output=True,
                    text=True,
                    timeout=30,
                )
                if result.returncode == 0:
                    return result.stdout.strip() or "代码执行成功，无输出"
                else:
                    return f"执行错误: {result.stderr.strip()}"
            except subprocess.TimeoutExpired:
                return "执行超时（30秒限制）"
            except Exception as e:
                return f"执行错误: {str(e)}"

        elif name == "web_search":
            query = args.get("query", "")
            # 返回提示信息（真正的搜索需要额外配置）
            return f'[搜索] 查询: "{query}" — 如需联网搜索功能，请配置SERPAPI_KEY等搜索引擎API。当前为演示模式。'

        return f"未知工具: {name}"

    async def run_agent_stream(
        self,
        task: str,
        model: str = None,
    ) -> AsyncIterator[dict]:
        """运行Agent并流式返回结果"""
        model = model or settings.OLLAMA_DEFAULT_MODEL

        messages = [
            {
                "role": "system",
                "content": (
                    "你是一个智能Agent助手。你可以使用工具来完成任务。"
                    "当需要计算时使用calculator工具，需要执行代码时使用python_exec工具，"
                    "需要搜索信息时使用web_search工具。"
                    "先用工具收集信息和计算，然后基于工具返回的结果给出最终答案。"
                    "请用中文回答。"
                ),
            },
            {"role": "user", "content": task},
        ]

        max_iterations = 5
        tool_results = []

        for iteration in range(max_iterations):
            async with httpx.AsyncClient(timeout=120.0) as client:
                response = await client.post(
                    f"{self.base_url}/api/chat",
                    json={
                        "model": model,
                        "messages": messages,
                        "tools": self.TOOLS_DEFINITION,
                        "stream": False,
                    },
                )
                response.raise_for_status()
                data = response.json()

            assistant_msg = data.get("message", {})
            content = assistant_msg.get("content", "")
            tool_calls = assistant_msg.get("tool_calls", [])

            if tool_calls:
                # 添加助手消息
                messages.append(assistant_msg)

                for tc in tool_calls:
                    func_name = tc["function"]["name"]
                    func_args = tc["function"]["arguments"]

                    # 通知前端工具调用
                    yield {
                        "type": "tool_call",
                        "tool": func_name,
                        "args": func_args,
                    }

                    result = self._execute_tool(func_name, func_args)

                    yield {
                        "type": "tool_result",
                        "tool": func_name,
                        "result": result,
                    }

                    tool_results.append({
                        "tool": func_name,
                        "args": func_args,
                        "result": result,
                    })

                    messages.append({
                        "role": "tool",
                        "content": result,
                    })
            else:
                # 最终响应
                yield {
                    "type": "final",
                    "content": content,
                    "tool_results": tool_results,
                }
                return

        # 超出迭代次数，强制获取最终回答
        messages.append({
            "role": "user",
            "content": "请基于已获取的信息给出最终答案，用中文回答。",
        })

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

        content = data.get("message", {}).get("content", "无法完成任务")

        yield {
            "type": "final",
            "content": content,
            "tool_results": tool_results,
        }
