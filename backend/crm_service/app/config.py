from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    DATABASE_URL: str = "postgresql+asyncpg://smartreach:password@localhost:5432/smartreach"
    REDIS_URL: str = "redis://localhost:6379"
    AI_SERVICE_URL: str = "http://localhost:8001"
    CHANNEL_SERVICE_URL: str = "http://localhost:8002"
    SECRET_KEY: str = "change_this_to_a_long_random_string"
    ALLOWED_ORIGINS: str = "http://localhost:3000"
    SERVICE_NAME: str = "crm-service"

    @property
    def allowed_origins_list(self) -> list[str]:
        return [o.strip() for o in self.ALLOWED_ORIGINS.split(",") if o.strip()]


settings = Settings()
