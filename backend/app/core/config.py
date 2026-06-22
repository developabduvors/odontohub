from pydantic_settings import BaseSettings
from pydantic import ConfigDict
from typing import Optional


class Settings(BaseSettings):
    # 🔐 Security
    SECRET_KEY: str = "super-secret-key-change-in-production"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24

    # 🤖 Telegram bot (parolni tiklash kodlarini yuborish uchun)
    TELEGRAM_BOT_TOKEN: Optional[str] = None

    # 🗄 Database
    DATABASE_URL: Optional[str] = None
    DB_USER: Optional[str] = None
    DB_PASSWORD: Optional[str] = None
    DB_HOST: Optional[str] = None
    DB_PORT: Optional[int] = None
    DB_NAME: Optional[str] = None

    model_config = ConfigDict(
        env_file=".env",
        extra="ignore",
        env_file_encoding='utf-8'
    )


settings = Settings()

