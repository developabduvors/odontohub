import hashlib
import secrets
from datetime import datetime, timedelta

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.exc import IntegrityError, SQLAlchemyError
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.phone import normalize_phone, phones_match
from app.core.security import create_access_token, get_current_user, verify_password
from app.models.dentist import DentistProfile, VerificationStatus
from app.models.password_reset import PasswordResetCode
from app.models.patient import PatientProfile
from app.models.user import User, UserRole
from app.schemas.auth import (
    BackupPhoneResponseSchema,
    BackupPhoneSchema,
    ChangePasswordSchema,
    ForgotPasswordResponseSchema,
    ForgotPasswordSchema,
    LoginSchema,
    RegisterSchema,
    ResetPasswordSchema,
    SendLoginCodeResponseSchema,
    SendLoginCodeSchema,
    TokenSchema,
    VerifyLoginCodeSchema,
    VerifyResetCodeResponseSchema,
    VerifyResetCodeSchema,
)
from app.services.telegram_service import (
    send_telegram_message,
    validate_telegram_init_data,
)

CODE_TTL_SECONDS = 90        # parolni tiklash kodi kiritish muddati
LOGIN_CODE_TTL_SECONDS = 120  # Telegram orqali kirish kodi muddati (2 daqiqa)
RESET_WINDOW_MINUTES = 5     # kod tasdiqlangach yangi parol qo'yish oynasi
DAILY_LIMIT = 2             # bir telefon uchun kuniga nechta kod (maqsad bo'yicha alohida)
MAX_ATTEMPTS = 2            # bitta kodni nechta marta kiritish mumkin


def _hash_code(code: str) -> str:
    return hashlib.sha256(code.encode()).hexdigest()


def _find_user_by_phone(db: Session, raw_phone: str) -> User | None:
    """normalize_phone bilan aniq, topilmasa format-bardosh fallback."""
    phone = normalize_phone(raw_phone)
    user = db.query(User).filter(User.phone == phone).first()
    if not user:
        user = next((u for u in db.query(User).all() if phones_match(u.phone, raw_phone)), None)
    return user


def _create_and_send_code(
    db: Session, user: User, phone: str, *, purpose: str, ttl_seconds: int, message: str
) -> None:
    """Bir martalik kod yaratib, foydalanuvchining Telegram chatiga yuboradi.

    `reset` va `login` oqimlari uchun umumiy: kunlik limit va eski kodlarni bekor
    qilish maqsad (purpose) bo'yicha alohida hisoblanadi. message ichida `{code}`
    bo'lishi shart — kod o'rniga qo'yiladi.
    """
    if not user.telegram_id:
        raise HTTPException(
            status_code=400,
            detail="Bu raqamga Telegram bog'lanmagan. Avval Telegram orqali kiring.",
        )

    # Kunlik limit (shu maqsad uchun bugun yaratilgan kodlar soni).
    today_start = datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)
    today_count = (
        db.query(PasswordResetCode)
        .filter(
            PasswordResetCode.phone == phone,
            PasswordResetCode.purpose == purpose,
            PasswordResetCode.created_at >= today_start,
        )
        .count()
    )
    if today_count >= DAILY_LIMIT:
        raise HTTPException(
            status_code=429,
            detail="Kuniga 2 martadan ko'p kod so'rab bo'lmaydi. Ertaga urinib ko'ring.",
        )

    # Faqat eng oxirgi kod amal qilsin — eski ishlatilmaganlarini bekor qilamiz.
    db.query(PasswordResetCode).filter(
        PasswordResetCode.phone == phone,
        PasswordResetCode.purpose == purpose,
        PasswordResetCode.used == False,  # noqa: E712
    ).update({"used": True})

    code = f"{secrets.randbelow(1_000_000):06d}"  # 6 xonali
    if not send_telegram_message(user.telegram_id, message.format(code=code)):
        raise HTTPException(
            status_code=502, detail="Telegram'ga kod yuborib bo'lmadi. Keyinroq urinib ko'ring."
        )

    db.add(PasswordResetCode(
        phone=phone,
        purpose=purpose,
        code_hash=_hash_code(code),
        expires_at=datetime.utcnow() + timedelta(seconds=ttl_seconds),
        attempts_left=MAX_ATTEMPTS,
    ))
    db.commit()


router = APIRouter()


@router.post("/register", response_model=TokenSchema)
def register(data: RegisterSchema, db: Session = Depends(get_db)):
    phone = normalize_phone(data.phone)  # kanonik shaklda saqlaymiz: +998XXXXXXXXX
    email = data.email.strip() if data.email else None
    full_name = data.full_name.strip()

    existing = db.query(User).filter(User.phone == phone).first()
    if existing:
        raise HTTPException(status_code=400, detail="Номер уже зарегистрирован")

    role_value = data.role.value

    # Mini App orqali ro'yxatdan o'tishda Telegram'ni darrov bog'laymiz —
    # shunda foydalanuvchi keyingi safar avtomatik kiradi (qayta login shart emas).
    # init_data yaroqsiz yoki tg_id band bo'lsa, ro'yxatdan o'tishni bloklamaymiz.
    telegram_id = None
    if data.init_data:
        try:
            tg_user = validate_telegram_init_data(data.init_data)
            tg_id = str(tg_user.get("id")) if tg_user.get("id") else None
            if tg_id and not db.query(User).filter(User.telegram_id == tg_id).first():
                telegram_id = tg_id
        except Exception as exc:
            print(f"[REGISTER] Telegram init_data e'tiborsiz qoldirildi: {exc}")

    try:
        user = User(
            phone=phone,
            email=email,
            password=data.password,  # Store password directly for now (should be hashed in production)
            role=UserRole(role_value),
            telegram_id=telegram_id,
        )
        db.add(user)
        db.flush()

        if role_value == "patient":
            db.add(PatientProfile(user_id=user.id, full_name=full_name))
        elif role_value == "dentist":
            db.add(
                DentistProfile(
                    user_id=user.id,
                    full_name=full_name,
                    # Avto-tasdiqlash: yangi doktor ro'yxatdan o'tishi bilan darrov
                    # bemorlarga ko'rinsin (admin tasdiqlashini kutmasdan).
                    verification_status=VerificationStatus.APPROVED,
                )
            )

        db.commit()
        db.refresh(user)
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=400, detail="Номер уже зарегистрирован")
    except SQLAlchemyError as exc:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Registration failed: {str(exc)}")

    token = create_access_token({"sub": str(user.id), "role": user.role.value})
    return {"access_token": token, "token_type": "bearer"}


@router.post("/login", response_model=TokenSchema)
def login(data: LoginSchema, db: Session = Depends(get_db)):
    phone = normalize_phone(data.phone)
    print(f"[DEBUG] LOGIN: phone '{data.phone}' -> normalized '{phone}'")

    # 1) Tez yo'l: kanonik shaklda aniq moslik.
    user = db.query(User).filter(User.phone == phone).first()

    # 2) Fallback: tarixiy yozuvlar boshqa formatda saqlangan bo'lishi mumkin
    #    (eski frontend, dentist qo'shgan bemorlar, bo'shliqli format). Klinika
    #    bazasi kichik — normalizatsiyadan keyin solishtirib qidiramiz.
    if not user:
        user = next(
            (u for u in db.query(User).all() if phones_match(u.phone, data.phone)),
            None,
        )

    print(f"[DEBUG] LOGIN: User found: {user is not None}")
    if not user:
        raise HTTPException(status_code=401, detail="Пользователь не найден")

    if user.password != data.password:
        print(f"[DEBUG] LOGIN: Password mismatch. Expected: '{user.password}', Got: '{data.password}'")
        raise HTTPException(status_code=401, detail="Неверный пароль")

    token = create_access_token({"sub": str(user.id), "role": user.role.value})
    return {"access_token": token, "token_type": "bearer"}


@router.get("/me")
def get_me(user: User = Depends(get_current_user)):
    full_name = "User"
    patient_id = None
    dentist_id = None

    if user.role.value == UserRole.PATIENT.value and user.patient_profile:
        full_name = user.patient_profile.full_name
        patient_id = user.patient_profile.id
    elif user.role.value == UserRole.DENTIST.value and user.dentist_profile:
        full_name = user.dentist_profile.full_name
        dentist_id = user.dentist_profile.id

    # has_password=False => faqat magic-link placeholder bor, frontend "parol
    # o'rnатиш" rejimини ko'рсатади (eski parol so'rамаydi).
    has_password = bool(user.password) and not verify_password(user.phone, user.password)

    return {
        "id": user.id,
        "phone": user.phone,
        "backup_phone": user.backup_phone,
        "role": user.role.value,
        "email": user.email,
        "full_name": full_name,
        "patient_id": patient_id,
        "dentist_id": dentist_id,
        "has_password": has_password,
    }


@router.delete("/delete-account")
def delete_account(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    try:
        db.delete(user)
        db.commit()
        return {"message": "Account deleted successfully"}
    except Exception as exc:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(exc))


@router.put("/change-password")
def change_password(
    data: ChangePasswordSchema,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    # Doktor qo'shган bemorда parol = telefon raqамининг bcrypt placeholder'и.
    # verify_password(phone, stored) faqat o'ша avto-generated placeholder uchun True
    # bo'lади — ya'ni foydаланувчи hali haqiqий parol o'rnатmagan. Bunday holда
    # birinchи marta parol o'rnатишга ruxsat (eski parol talab qilинmaydi).
    has_real_password = bool(user.password) and not verify_password(user.phone, user.password)

    if has_real_password and user.password != data.current_password:
        raise HTTPException(status_code=400, detail="Текущий пароль неверен")

    # Plaintext saqlanади — login ham plaintext solishtirади (mavjуd sxema bilan mos).
    user.password = data.new_password
    db.commit()

    return {"message": "Пароль успешно изменен"}


# ───────────────────────── Parolni tiklash (Telegram) ─────────────────────────

@router.post("/forgot-password", response_model=ForgotPasswordResponseSchema)
def forgot_password(data: ForgotPasswordSchema, db: Session = Depends(get_db)):
    phone = normalize_phone(data.phone)
    user = _find_user_by_phone(db, data.phone)
    if not user:
        raise HTTPException(status_code=404, detail="Bu raqam bo'yicha foydalanuvchi topilmadi")

    _create_and_send_code(
        db, user, phone,
        purpose="reset",
        ttl_seconds=CODE_TTL_SECONDS,
        message=(
            "OdontoHub — parolni tiklash kodi: {code}\n"
            f"Kod {CODE_TTL_SECONDS} soniya amal qiladi. Agar bu siz bo'lmasangiz, e'tibormang."
        ),
    )
    return {"sent": True, "expires_in": CODE_TTL_SECONDS}


def _active_code(db: Session, phone: str, purpose: str = "reset") -> PasswordResetCode | None:
    """Eng oxirgi ishlatilmagan, muddati o'tmagan kod yozuvi (maqsad bo'yicha)."""
    return (
        db.query(PasswordResetCode)
        .filter(
            PasswordResetCode.phone == phone,
            PasswordResetCode.purpose == purpose,
            PasswordResetCode.used == False,  # noqa: E712
            PasswordResetCode.expires_at > datetime.utcnow(),
        )
        .order_by(PasswordResetCode.created_at.desc())
        .first()
    )


@router.post("/verify-reset-code", response_model=VerifyResetCodeResponseSchema)
def verify_reset_code(data: VerifyResetCodeSchema, db: Session = Depends(get_db)):
    phone = normalize_phone(data.phone)
    rec = _active_code(db, phone)
    if not rec:
        raise HTTPException(status_code=400, detail="Kod muddati tugagan yoki topilmadi. Qaytadan so'rang.")
    if rec.attempts_left <= 0:
        rec.used = True
        db.commit()
        raise HTTPException(status_code=400, detail="Urinishlar tugadi. Qaytadan kod so'rang.")

    if rec.code_hash != _hash_code(data.code.strip()):
        rec.attempts_left -= 1
        if rec.attempts_left <= 0:
            rec.used = True
        db.commit()
        raise HTTPException(
            status_code=400,
            detail=f"Kod noto'g'ri. Qolgan urinish: {max(rec.attempts_left, 0)}",
        )

    # To'g'ri — parol qo'yish oynasini ochamiz.
    rec.verified = True
    rec.reset_deadline = datetime.utcnow() + timedelta(minutes=RESET_WINDOW_MINUTES)
    db.commit()
    return {"valid": True, "attempts_left": rec.attempts_left}


@router.post("/reset-password")
def reset_password(data: ResetPasswordSchema, db: Session = Depends(get_db)):
    phone = normalize_phone(data.phone)
    rec = (
        db.query(PasswordResetCode)
        .filter(
            PasswordResetCode.phone == phone,
            PasswordResetCode.purpose == "reset",
            PasswordResetCode.used == False,  # noqa: E712
            PasswordResetCode.verified == True,  # noqa: E712
        )
        .order_by(PasswordResetCode.created_at.desc())
        .first()
    )
    if not rec or not rec.reset_deadline or rec.reset_deadline < datetime.utcnow():
        raise HTTPException(status_code=400, detail="Tiklash muddati tugadi. Qaytadan boshlang.")
    if rec.code_hash != _hash_code(data.code.strip()):
        raise HTTPException(status_code=400, detail="Kod mos kelmadi.")
    if len(data.new_password) < 6:
        raise HTTPException(status_code=400, detail="Parol kamida 6 ta belgidan iborat bo'lsin.")

    user = _find_user_by_phone(db, data.phone)
    if not user:
        raise HTTPException(status_code=404, detail="Foydalanuvchi topilmadi")

    user.password = data.new_password  # plaintext — mavjud login sxemasi bilan mos
    rec.used = True
    db.commit()
    return {"message": "Parol muvaffaqiyatli yangilandi"}


# ───────────────────── Telegram kodi orqali kirish (passwordless) ─────────────────────

@router.post("/send-login-code", response_model=SendLoginCodeResponseSchema)
def send_login_code(data: SendLoginCodeSchema, db: Session = Depends(get_db)):
    """Telefon raqami bo'yicha foydalanuvchini topib, Telegram'ga bir martalik
    kirish kodi yuboradi. Foydalanuvchida telegram_id bo'lishi shart."""
    phone = normalize_phone(data.phone)
    user = _find_user_by_phone(db, data.phone)
    if not user:
        raise HTTPException(status_code=404, detail="Bu raqam bo'yicha foydalanuvchi topilmadi")

    _create_and_send_code(
        db, user, phone,
        purpose="login",
        ttl_seconds=LOGIN_CODE_TTL_SECONDS,
        message=(
            "OdontoHub — kirish kodi: {code}\n"
            f"Kod {LOGIN_CODE_TTL_SECONDS // 60} daqiqa amal qiladi. Agar bu siz bo'lmasangiz, e'tibormang."
        ),
    )
    return {"sent": True, "expires_in": LOGIN_CODE_TTL_SECONDS}


@router.post("/verify-login-code", response_model=TokenSchema)
def verify_login_code(data: VerifyLoginCodeSchema, db: Session = Depends(get_db)):
    """Kirish kodini tekshiradi va to'g'ri bo'lsa darrov access_token qaytaradi."""
    phone = normalize_phone(data.phone)
    rec = _active_code(db, phone, purpose="login")
    if not rec:
        raise HTTPException(status_code=400, detail="Kod muddati tugagan yoki topilmadi. Qaytadan so'rang.")
    if rec.attempts_left <= 0:
        rec.used = True
        db.commit()
        raise HTTPException(status_code=400, detail="Urinishlar tugadi. Qaytadan kod so'rang.")

    if rec.code_hash != _hash_code(data.code.strip()):
        rec.attempts_left -= 1
        if rec.attempts_left <= 0:
            rec.used = True
        db.commit()
        raise HTTPException(
            status_code=400,
            detail=f"Kod noto'g'ri. Qolgan urinish: {max(rec.attempts_left, 0)}",
        )

    user = _find_user_by_phone(db, data.phone)
    if not user:
        raise HTTPException(status_code=404, detail="Foydalanuvchi topilmadi")

    rec.used = True  # kod bir martalik
    db.commit()

    token = create_access_token({"sub": str(user.id), "role": user.role.value})
    return {"access_token": token, "token_type": "bearer"}


@router.get("/backup-phone", response_model=BackupPhoneResponseSchema)
def get_backup_phone(user: User = Depends(get_current_user)):
    return {"backup_phone": user.backup_phone}


@router.put("/backup-phone", response_model=BackupPhoneResponseSchema)
def update_backup_phone(
    data: BackupPhoneSchema,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    normalized_phone = data.backup_phone.strip() if data.backup_phone else None

    if normalized_phone == "":
        normalized_phone = None

    if normalized_phone and normalized_phone == user.phone:
        raise HTTPException(status_code=400, detail="Backup phone must be different from the main phone")

    if normalized_phone:
        existing_user = (
            db.query(User)
            .filter(User.backup_phone == normalized_phone, User.id != user.id)
            .first()
        )
        if existing_user:
            raise HTTPException(status_code=400, detail="Backup phone is already in use")

    user.backup_phone = normalized_phone
    db.commit()
    db.refresh(user)

    return {"backup_phone": user.backup_phone}
