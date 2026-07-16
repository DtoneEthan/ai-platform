from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    DATABASE_URL: str = "postgresql+asyncpg://ai_user:ai_password_2024@localhost:5432/ai_platform"
    SECRET_KEY: str = "change-me-to-a-random-secret-key-in-production"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 1440  # 24 hours

    OLLAMA_HOST: str = "http://localhost:11434"
    OLLAMA_DEFAULT_MODEL: str = "llama3"

    ADMIN_USERNAME: str = "admin"
    ADMIN_EMAIL: str = "admin@ai-platform.local"
    ADMIN_PASSWORD: str = "admin123456"

    class Config:
        env_file = ".env"


settings = Settings()
