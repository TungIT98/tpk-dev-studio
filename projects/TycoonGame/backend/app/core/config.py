import os
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    DATABASE_URL: str = "postgresql+asyncpg://postgres:postgres@localhost:5432/tycoon_game"
    SYNC_DATABASE_URL: str = "postgresql://postgres:postgres@localhost:5432/tycoon_game"
    REDIS_URL: str = "redis://localhost:6379/0"
    SECRET_KEY: str = "change-me-in-production-use-openssl-rand-hex-32"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60
    OFFLINE_EARNINGS_RATE: float = 0.5  # 50% of normal income while offline

    # Push notification providers
    BRAZE_API_URL: str = "https://rest.fra-01.braze.com"
    BRAZE_API_KEY: str = ""
    ONESIGNAL_API_URL: str = "https://onesignal.com/api/v1"
    ONESIGNAL_API_KEY: str = ""


settings = Settings()
