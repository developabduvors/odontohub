"""Parolni tiklash oqimini Telegram'siz (mock) tekshiruvchi skript.

Ishga tushirish:  python test_password_reset_flow.py
In-memory sqlite ishlatadi — haqiqiy bazaga tegmaydi.
"""
import re
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from fastapi import HTTPException

from app.db.base import Base
# Barcha model modullarini ro'yxatga olamiz (relationship'lar ishlashi uchun)
import importlib, pkgutil
import app.models as _models_pkg
for _m in pkgutil.iter_modules(_models_pkg.__path__):
    importlib.import_module(f"app.models.{_m.name}")
from app.models.user import User, UserRole
from app.models.password_reset import PasswordResetCode
from app.routers import auth
from app.schemas.auth import ForgotPasswordSchema, VerifyResetCodeSchema, ResetPasswordSchema

# In-memory sqlite — bu oqim uchun faqat 2 jadval kerak (boshqalarning FK'lari aralashmasin)
engine = create_engine("sqlite:///:memory:")
Base.metadata.create_all(engine, tables=[User.__table__, PasswordResetCode.__table__])
Session = sessionmaker(bind=engine)
db = Session()

# Test user (Telegram bog'langan)
db.add(User(phone="+998901234567", password="oldpass", telegram_id="555", role=UserRole.PATIENT))
db.commit()

# Telegram'ni mock qilamiz — yuborilgan matndan kodni ushlaymiz
sent = {}
def fake_send(chat_id, text):
    sent["chat_id"] = chat_id
    sent["code"] = re.search(r"(\d{6})", text).group(1)
    return True
auth.send_telegram_message = fake_send

ok = True
def check(name, cond):
    global ok
    ok = ok and cond
    print(("OK  " if cond else "XATO") + "  " + name)

# 1) forgot-password — kod yuborilsin (telefon BOSHQA formatda ham topilsin)
r = auth.forgot_password(ForgotPasswordSchema(phone="998 90 123 45 67"), db)
check("forgot-password sent", r["sent"] and sent.get("chat_id") == "555")
code = sent["code"]

# 2) noto'g'ri kod -> attempts kamayadi
try:
    auth.verify_reset_code(VerifyResetCodeSchema(phone="+998901234567", code="000000"), db)
    check("wrong code rejected", False)
except HTTPException as e:
    check("wrong code rejected (1 urinish qoldi)", "1" in e.detail)

# 3) to'g'ri kod -> verified
v = auth.verify_reset_code(VerifyResetCodeSchema(phone="+998901234567", code=code), db)
check("correct code verified", v["valid"] is True)

# 4) reset-password -> parol yangilanadi
auth.reset_password(ResetPasswordSchema(phone="+998901234567", code=code, new_password="newpass123"), db)
u = db.query(User).filter(User.phone == "+998901234567").first()
check("password updated", u.password == "newpass123")

# 5) kod qayta ishlatilmaydi (used=True)
try:
    auth.verify_reset_code(VerifyResetCodeSchema(phone="+998901234567", code=code), db)
    check("used code blocked", False)
except HTTPException:
    check("used code blocked", True)

# 6) kunlik limit: 2 ta so'rovdan keyin 3-chisi rad etilsin
auth.forgot_password(ForgotPasswordSchema(phone="+998901234567"), db)  # 2-chi (1-chisi yuqorida)
try:
    auth.forgot_password(ForgotPasswordSchema(phone="+998901234567"), db)  # 3-chi
    check("daily limit enforced", False)
except HTTPException as e:
    check("daily limit enforced (429)", e.status_code == 429)

# 7) Telegram bog'lanmagan user -> kod yuborilmaydi
db.add(User(phone="+998900000000", password="x", role=UserRole.PATIENT))
db.commit()
try:
    auth.forgot_password(ForgotPasswordSchema(phone="+998900000000"), db)
    check("no-telegram rejected", False)
except HTTPException as e:
    check("no-telegram rejected (400)", e.status_code == 400)

print("\nNATIJA:", "HAMMASI O'TDI" if ok else "BA'ZILARI XATO")
