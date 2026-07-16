#!/bin/bash
set -e

echo "Waiting for database to be ready..."
until pg_isready -h db -U ai_user -d ai_platform 2>/dev/null; do
  sleep 1
done

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
        admin = await auth_service.get_user_by_username('${ADMIN_USERNAME}')
        if not admin:
            await auth_service.create_admin_user(
                username='${ADMIN_USERNAME}',
                email='${ADMIN_EMAIL}',
                password='${ADMIN_PASSWORD}'
            )
            print('Admin user created successfully!')
        else:
            print('Admin user already exists.')

asyncio.run(create_admin())
"

echo "Starting FastAPI server..."
exec uvicorn app.main:app --host 0.0.0.0 --port 8000
