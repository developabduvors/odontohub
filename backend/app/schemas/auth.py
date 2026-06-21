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


class BackupPhoneSchema(BaseModel):
    backup_phone: str | None = None


class BackupPhoneResponseSchema(BaseModel):
    backup_phone: str | None = None
