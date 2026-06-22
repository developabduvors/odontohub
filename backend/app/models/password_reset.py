from datetime import datetime

from sqlalchemy import String, Boolean, Integer, DateTime
from sqlalchemy.orm import Mapped, mapped_column

from .base import Base


class PasswordResetCode(Base):
    """Telegram orqali parolni tiklash kodi.

    Kod backend'da generatsiya qilinadi va foydalanuvchining bog'langan
    Telegram chatiga yuboriladi. Bu yerda faqat kod HASH'i saqlanadi.
    """

    __tablename__ = "password_reset_codes"

    id: Mapped[int] = mapped_column(primary_key=True)
    phone: Mapped[str] = mapped_column(String, index=True)          # normalize_phone bilan
    # Kod maqsadi: 'reset' (parolni tiklash) yoki 'login' (Telegram kodi orqali kirish).
    # Bitta jadval ikkala oqimga xizmat qiladi — limit/urinish/TTL mantig'i umumiy.
    purpose: Mapped[str] = mapped_column(String, default="reset", server_default="reset", nullable=False)
    code_hash: Mapped[str] = mapped_column(String, nullable=False)  # sha256(kod)
    expires_at: Mapped[datetime] = mapped_column(DateTime, nullable=False)  # kod kiritish muddati (90s)
    reset_deadline: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)  # tasdiqlangach parol qo'yish oynasi
    attempts_left: Mapped[int] = mapped_column(Integer, default=2, nullable=False)
    verified: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    used: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)  # ishlatilgan yoki bekor qilingan
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)
