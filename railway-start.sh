#!/bin/bash
set -e

echo "Running database migrations..."
cd /app
alembic upgrade head

echo "Creating admin user if not exists..."
python3 -c "
import asyncio
from app.database import async_session, init_db
from app.services.auth_service import AuthService

async def create_admin():
    await init_db()
    async with async_session() as db:
        auth_service = AuthService(db)
        admin = await auth_service.get_user_by_username('${ADMIN_USERNAME:-admin}')
        if not admin:
            await auth_service.create_admin_user(
                username='${ADMIN_USERNAME:-admin}',
                email='${ADMIN_EMAIL:-admin@ai-platform.local}',
                password='${ADMIN_PASSWORD:-admin123456}'
            )
            print('Admin user created successfully!')
        else:
            print('Admin user already exists.')

asyncio.run(create_admin())
"

echo "Starting FastAPI server on port ${PORT:-8000}..."
exec uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8000}
