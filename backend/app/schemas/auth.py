from pydantic import BaseModel
from enum import Enum


class UserRole(str, Enum):
    patient = "patient"
    dentist = "dentist"


class RegisterSchema(BaseModel):
    phone: str
    role: UserRole
    full_name: str
    email: str | None = None
    password: str
    # Mini App'da ro'yxatdan o'tganda Telegram WebApp initData yuboriladi —
    # tasdiqlangach telegram_id saqlanadi va keyingi kirishlarda avto-login ishlaydi.
    init_data: str | None = None


class LoginSchema(BaseModel):
    phone: str
    password: str


class TokenSchema(BaseModel):
    access_token: str
    token_type: str = "bearer"


class ChangePasswordSchema(BaseModel):
    # Optional: magic-link orqali kirган bemorда haqiqий parol yo'q,
    # birinchи marta o'rnатганда current_password yuborмаслиги mumkin.
    current_password: str | None = None
    new_password: str


class ForgotPasswordSchema(BaseModel):
    phone: str


class ForgotPasswordResponseSchema(BaseModel):
    sent: bool = True
    expires_in: int = 90  # soniya


class VerifyResetCodeSchema(BaseModel):
    phone: str
    code: str


class VerifyResetCodeResponseSchema(BaseModel):
    valid: bool
    attempts_left: int = 0


class ResetPasswordSchema(BaseModel):
    phone: str
    code: str
    new_password: str


# ── Telegram kodi orqali kirish (passwordless login) ──
class SendLoginCodeSchema(BaseModel):
    phone: str


class SendLoginCodeResponseSchema(BaseModel):
    sent: bool = True
    expires_in: int = 120  # soniya


class VerifyLoginCodeSchema(BaseModel):
    phone: str
    code: str


class BackupPhoneSchema(BaseModel):
    backup_phone: str | None = None


class BackupPhoneResponseSchema(BaseModel):
    backup_phone: str | None = None
