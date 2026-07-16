from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.database import init_db
from app.routers import auth, chat, agent, admin


@asynccontextmanager
async def lifespan(app: FastAPI):
    # 启动时初始化数据库
    await init_db()
    yield


app = FastAPI(
    title="AI Platform API",
    description="AI在线软件 - 问答与Agent平台",
    version="1.0.0",
    lifespan=lifespan,
)

# CORS配置
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 注册路由
app.include_router(auth.router)
app.include_router(chat.router)
app.include_router(agent.router)
app.include_router(admin.router)


@app.get("/api/health")
async def health_check():
    return {"status": "ok", "message": "AI Platform is running"}
