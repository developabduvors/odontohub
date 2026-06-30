from pydantic_settings import BaseSettings
from pydantic import ConfigDict
from typing import Optional


class Settings(BaseSettings):
    # 🔐 Security
    SECRET_KEY: str = "super-secret-key-change-in-production"
    ALGORITHM: str = "HS256"
    # Sessiya umri: qurilmada bir marta kirgan foydalanuvchi qayta login
    # qilmasligi uchun token uzoq yashaydi (30 kun). Bir yil uchun 60*24*365.
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 30

    # 🤖 Telegram bot (parolni tiklash kodlarini yuborish uchun)
    TELEGRAM_BOT_TOKEN: Optional[str] = None
    # Webhook'ni soxta so'rovlardan himoya qiladi: setWebhook'da o'rnatiladi va
    # Telegram har so'rovda X-Telegram-Bot-Api-Secret-Token header'ida qaytaradi.
    TELEGRAM_WEBHOOK_SECRET: Optional[str] = None
    # Backendning ommaviy URL'i (Railway), webhook'ni ro'yxatdan o'tkazish uchun.
    WEBHOOK_BASE_URL: Optional[str] = None
    # Telegram Mini App (frontend) URL'i — "Ilovani ochish" tugmasi uchun.
    MINI_APP_URL: Optional[str] = None

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

