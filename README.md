# AI Platform - AI在线软件

一款免费可用的AI在线软件，自带问答和Agent功能，通过邀请码机制控制用户注册。

> 🌐 **在线演示**: [GitHub Pages 前端](https://你的用户名.github.io/ai-platform) + [Render 后端](https://你的服务.onrender.com)

## 功能特性

### AI智能问答
- 类ChatGPT的多轮对话界面
- 流式输出，实时响应
- Markdown渲染和代码高亮
- 多模型支持（通过Ollama切换）
- 对话历史管理

### AI Agent
- 自主工具调用：计算器、Python执行、网络搜索
- 工具调用过程可视化（思考链展示）
- 复杂任务分步执行

### 邀请码系统
- 管理员生成邀请码（可设次数和有效期）
- 新用户必须凭有效邀请码注册
- 邀请码状态管理和追踪

### 管理后台
- 系统使用统计仪表盘
- 用户管理（查看、启用/禁用）
- 邀请码管理（生成、启用/禁用、删除）

## 技术栈

| 层级 | 技术 |
|------|------|
| 前端 | React + Vite + TypeScript + Tailwind CSS |
| 后端 | Python FastAPI + SQLAlchemy + Alembic |
| 数据库 | PostgreSQL 16 |
| AI引擎 | Ollama（本地开源模型） |
| Agent | 自定义Agent引擎（支持工具调用） |
| 部署 | Docker Compose / Render / GitHub Pages |

---

## 🚀 在线部署（推荐）

### 方案一：GitHub Pages + Railway（全免费，无需信用卡）

#### 第1步：部署后端到 Railway

1. 访问 [Railway.app](https://railway.app) 注册（支持 GitHub 登录，免费）
2. 点击 **New Project → Deploy from GitHub repo**
3. 选择 `DtoneEthan/ai-platform` 仓库
4. Railway 会自动读取 `railway.json` 和 `Dockerfile.railway`
5. 添加 PostgreSQL 数据库插件：**New → Database → Add PostgreSQL**
6. 在 Variables 中添加环境变量：
   - `ADMIN_USERNAME`: `admin`
   - `ADMIN_PASSWORD`: `你的密码`
   - `ADMIN_EMAIL`: `admin@ai-platform.local`
   - `SECRET_KEY`: 随机字符串（如 `openssl rand -hex 32`）
   - `OLLAMA_HOST`: 你的 Ollama 地址（如 `http://你的VPS:11434`）
   - `ALGORITHM`: `HS256`
   - `ACCESS_TOKEN_EXPIRE_MINUTES`: `1440`
7. 部署完成后记录后端地址，例如 `https://ai-platform-production.up.railway.app`

> ⚠️ Railway 的 `DATABASE_URL` 会自动注入，无需手动设置

#### 第2步：部署前端到 GitHub Pages

1. 在 GitHub 仓库的 **Settings → Secrets and variables → Actions → Variables** 中添加：
   - `VITE_API_URL`: 你的 Railway 后端地址
2. 在 **Settings → Pages** 中，将 Source 设为 **GitHub Actions**
3. 推送代码到 `main` 分支，GitHub Actions 会自动部署
4. 访问 `https://DtoneEthan.github.io/ai-platform`

### 方案二：GitHub Pages + Koyeb（免费，无需信用卡）

Koyeb 提供永久免费的 2 个服务实例：

1. 访问 [Koyeb.com](https://koyeb.com) 注册
2. 点击 **Create App → From GitHub**
3. 选择仓库，构建方式选 **Dockerfile**，路径 `Dockerfile.railway`
4. 添加 PostgreSQL 数据库（Koyeb 免费提供）
5. 配置环境变量同上
6. 部署后获取地址

### 方案三：GitHub Pages + 本地/自有服务器

如果你有 VPS 或本地服务器：

```bash
# 在服务器上
git clone https://github.com/DtoneEthan/ai-platform
cd ai-platform
docker-compose up -d
# 后端运行在 :8000，配置nginx反向代理即可
```

> 💡 **Ollama 提示**：免费云平台上 GPU 资源有限，建议：
> - 在本地运行 Ollama，通过 `OLLAMA_HOST` 让云端后端连接
> - 或使用任意 OpenAI 兼容 API 替换 `ai_service.py` 中的调用

---

## 🐳 Docker 本地部署

### 前置要求

- Docker & Docker Compose
- [Ollama](https://ollama.ai)（本地安装并运行）

### 1. 启动Ollama

```bash
# 安装Ollama（如未安装）
curl -fsSL https://ollama.ai/install.sh | sh

# 拉取模型
ollama pull llama3

# 启动Ollama服务
ollama serve
```

### 2. 启动应用

```bash
cd ai-platform
docker-compose up -d
```

### 3. 访问

- 前端：http://localhost:3000
- 后端API：http://localhost:8000
- API文档：http://localhost:8000/docs

### 默认管理员

| 项目 | 值 |
|------|-----|
| 用户名 | `admin` |
| 密码 | `admin123456` |
| 邮箱 | `admin@ai-platform.local` |

> ⚠️ 首次登录后请立即修改默认密码！

### 4. 创建邀请码

1. 使用管理员账号登录
2. 进入「管理后台」→「邀请码」
3. 设置使用次数和有效期
4. 生成邀请码，分享给用户注册

---

## 💻 本地开发

### 后端

```bash
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

### 前端

```bash
cd frontend
npm install
npm run dev
```

前端会自动代理 `/api` 请求到后端 `localhost:8000`。

---

## 📁 项目结构

```
ai-platform/
├── backend/                    # FastAPI后端
│   ├── app/
│   │   ├── main.py            # 应用入口
│   │   ├── config.py          # 配置管理
│   │   ├── database.py        # 数据库连接
│   │   ├── models/            # SQLAlchemy数据模型
│   │   ├── schemas/           # Pydantic验证模型
│   │   ├── routers/           # API路由
│   │   ├── services/          # 业务逻辑层
│   │   └── middleware/        # 认证中间件
│   ├── alembic/               # 数据库迁移
│   ├── Dockerfile
│   └── requirements.txt
├── frontend/                   # React前端
│   ├── src/
│   │   ├── components/        # UI组件
│   │   ├── pages/             # 页面
│   │   ├── services/          # API客户端
│   │   └── store/             # 状态管理
│   ├── Dockerfile
│   └── vite.config.ts
├── .github/workflows/          # GitHub Actions
│   └── deploy.yml             # 前端自动部署
├── nginx/                      # Nginx配置
├── render.yaml                 # Render一键部署
├── docker-compose.yml          # Docker编排
└── README.md
```

---

## 📡 API文档

所有API接口文档可在应用启动后访问：http://localhost:8000/docs

### 主要接口

| 方法 | 路径 | 说明 | 权限 |
|------|------|------|------|
| POST | /api/auth/register | 注册 | 公开（需邀请码） |
| POST | /api/auth/login | 登录 | 公开 |
| GET | /api/auth/me | 当前用户 | 登录 |
| POST | /api/chat | 发送消息(SSE) | 登录 |
| GET | /api/conversations | 对话列表 | 登录 |
| DELETE | /api/conversations/{id} | 删除对话 | 登录 |
| POST | /api/agent/run | 执行Agent(SSE) | 登录 |
| GET | /api/agent/history | Agent历史 | 登录 |
| GET | /api/admin/stats | 系统统计 | 管理员 |
| POST | /api/admin/invite-codes | 生成邀请码 | 管理员 |
| GET | /api/admin/invite-codes | 邀请码列表 | 管理员 |
| GET | /api/admin/users | 用户列表 | 管理员 |

---

## 🔒 安全建议

1. 修改 `docker-compose.yml` 中的 `SECRET_KEY` 和数据库密码
2. 首次登录后立即修改管理员密码
3. 生产环境配置HTTPS（Render 默认提供）
4. 定期审查邀请码使用情况
5. 备份PostgreSQL数据

---

## License

MIT
