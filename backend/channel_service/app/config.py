from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    REDIS_URL: str = "redis://localhost:6379"
    CRM_WEBHOOK_URL: str = "http://localhost:8000/webhooks/communication-event"
    SERVICE_NAME: str = "channel-service"


settings = Settings()
