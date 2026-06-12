from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    DATABASE_URL: str = "postgresql+asyncpg://smartreach:password@localhost:5432/smartreach"
    REDIS_URL: str = "redis://localhost:6379"
    GEMINI_API_KEY: str = ""
    SERVICE_NAME: str = "ai-service"
    GEMINI_MODEL: str = "gemini-2.5-flash"


settings = Settings()
