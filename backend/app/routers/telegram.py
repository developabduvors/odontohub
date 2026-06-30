from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.database import get_db
from app.core.phone import normalize_phone, phones_match
from app.core.security import create_access_token, get_current_user
from app.models.user import User
from app.schemas.auth import TokenSchema
from app.schemas.telegram import TelegramAuthSchema, TelegramLinkSchema
from app.services.telegram_service import (
    remove_keyboard,
    send_contact_request,
    send_webapp_button,
    set_webhook,
    validate_telegram_init_data,
)

router = APIRouter(prefix="/telegram", tags=["telegram"])

# --- Bot xabarlari (o'zbekcha) ---------------------------------------------
WELCOME = (
    "Assalomu alaykum! 👋\n\n"
    "Tizimga kirish uchun telefon raqamingizni tasdiqlang. "
    "Pastdagi tugmani bosing — Telegram raqamingizni xavfsiz ulashadi."
)
SHARE_BTN = "📱 Telefon raqamni ulashish"
LINKED_OK = "✅ Raqamingiz tasdiqlandi! Endi parolsiz kirasiz. Ilovani oching:"
OPEN_BTN = "🦷 Ilovani ochish"
NOT_REGISTERED = (
    "Bu raqam tizimda ro'yxatdan o'tmagan. "
    "Ro'yxatdan o'tish uchun ilovani oching:"
)
REGISTER_BTN = "📝 Ro'yxatdan o'tish"
WRONG_CONTACT = "Iltimos, faqat o'z raqamingizni tugma orqali ulashing."


def _find_user_by_phone(db: Session, raw_phone: str | None) -> User | None:
    """normalize_phone bilan aniq, topilmasa format-bardosh fallback."""
    if not raw_phone:
        return None
    phone = normalize_phone(raw_phone)
    user = db.query(User).filter(User.phone == phone).first()
    if not user:
        user = next((u for u in db.query(User).all() if phones_match(u.phone, raw_phone)), None)
    return user


def _handle_shared_contact(db: Session, message: dict, chat_id: str, contact: dict) -> None:
    """Telegram tasdiqlagan kontaktni akkauntga bog'laydi (parolsiz kirish).

    XAVFSIZLIK: raqam faqat `contact.user_id == message.from.id` bo'lgandagina
    tasdiqlangan hisoblanadi — ya'ni foydalanuvchi O'Z raqamini ulashgan. Boshqa
    birovning kontaktini ilova qilsa, user_id bo'lmaydi yoki mos kelmaydi.
    """
    from_id = (message.get("from") or {}).get("id")
    if contact.get("user_id") != from_id:
        remove_keyboard(chat_id, WRONG_CONTACT)
        return

    tg_id = str(from_id)
    user = _find_user_by_phone(db, contact.get("phone_number"))
    if not user:
        if settings.MINI_APP_URL:
            send_webapp_button(chat_id, NOT_REGISTERED, REGISTER_BTN, settings.MINI_APP_URL)
        else:
            remove_keyboard(chat_id, NOT_REGISTERED)
        return

    # telegram_id boshqa akkauntda bo'lsa (raqam ko'chgan) — uzib, tasdiqlangan
    # raqam egasiga biriktiramiz. Telegram telefonni tasdiqlagani uchun xavfsiz.
    other = db.query(User).filter(User.telegram_id == tg_id).first()
    if other and other.id != user.id:
        other.telegram_id = None
        db.flush()

    user.telegram_id = tg_id
    db.commit()

    if settings.MINI_APP_URL:
        send_webapp_button(chat_id, LINKED_OK, OPEN_BTN, settings.MINI_APP_URL)
    else:
        remove_keyboard(chat_id, "✅ Raqamingiz tasdiqlandi! Endi ilovaga parolsiz kirasiz.")


@router.post("/webhook")
async def telegram_webhook(request: Request, db: Session = Depends(get_db)):
    """Telegram update'larini qabul qiladi (faqat `message`).

    Oqim: /start -> raqam ulashish tugmasi -> kontakt -> akkauntga bog'lash.
    """
    # Soxta so'rovlardan himoya: setWebhook'dagi maxfiy token bilan solishtiramiz.
    if settings.TELEGRAM_WEBHOOK_SECRET:
        header = request.headers.get("X-Telegram-Bot-Api-Secret-Token")
        if header != settings.TELEGRAM_WEBHOOK_SECRET:
            raise HTTPException(status_code=403, detail="Invalid webhook secret")

    update = await request.json()
    message = update.get("message") or {}
    chat = message.get("chat") or {}
    chat_id = str(chat.get("id")) if chat.get("id") is not None else None
    if not chat_id:
        return {"ok": True}

    contact = message.get("contact")
    text = (message.get("text") or "").strip()

    if contact:
        _handle_shared_contact(db, message, chat_id, contact)
    elif text.startswith("/start"):
        send_contact_request(chat_id, WELCOME, SHARE_BTN)
    else:
        # Boshqa xabar — yana tugmani ko'rsatamiz.
        send_contact_request(chat_id, WELCOME, SHARE_BTN)

    return {"ok": True}


@router.get("/set-webhook")
def configure_webhook(base: str | None = None):
    """Utility: webhook'ni Telegram'da ro'yxatdan o'tkazadi (bir marta chaqiriladi).

    `?base=https://<backend>` bermasangiz, WEBHOOK_BASE_URL env'dan olinadi.
    """
    base_url = base or settings.WEBHOOK_BASE_URL
    if not base_url:
        raise HTTPException(status_code=400, detail="base URL kerak: ?base=https://...")
    url = base_url.rstrip("/") + "/api/telegram/webhook"
    result = set_webhook(url, settings.TELEGRAM_WEBHOOK_SECRET)
    return {"webhook_url": url, "telegram_response": result}


@router.post("/request-link")
def request_link(data: TelegramAuthSchema):
    """Mini App bog'lanmagan (404) bo'lsa chaqiriladi: botga raqam ulashish
    tugmasini yuboradi. init_data'dan tasdiqlangan chat_id (=tg user id) olinadi.
    """
    tg_user = validate_telegram_init_data(data.init_data)
    tg_id = tg_user.get("id")
    if not tg_id:
        raise HTTPException(status_code=400, detail="Telegram user aniqlanmadi")
    ok = send_contact_request(str(tg_id), WELCOME, SHARE_BTN)
    return {"sent": ok}


from app.models.patient import PatientProfile
from datetime import datetime

@router.post("/login", response_model=TokenSchema)
def login_via_telegram(data: TelegramAuthSchema, db: Session = Depends(get_db)):
    """Parolsiz kirish: Mini App init_data orqali bog'langan akkauntni topadi."""
    tg_user = validate_telegram_init_data(data.init_data)
    tg_id = str(tg_user.get("id"))

    # 1. Попытка входа по существующему telegram_id
    user = db.query(User).filter(User.telegram_id == tg_id).first()
    
    # 2. Обработка приглашения (invite_token)
    if data.invite_token:
        profile = db.query(PatientProfile).filter(PatientProfile.invite_token == data.invite_token).first()
        if not profile:
            raise HTTPException(status_code=400, detail="Инвайт-код недействителен.")
            
        if profile.invite_expires and profile.invite_expires < datetime.utcnow():
            raise HTTPException(status_code=400, detail="Срок действия приглашения истек.")
            
        if user and user.id != profile.user_id:
            raise HTTPException(status_code=400, detail="Этот Telegram-аккаунт уже привязан к другому пользователю.")
            
        target_user = profile.user
        if not target_user:
            raise HTTPException(status_code=400, detail="Пользователь для этого профиля пациента не найден.")
            
        if target_user.telegram_id and target_user.telegram_id != tg_id:
            raise HTTPException(status_code=400, detail="У этого пациента уже привязан другой Telegram-аккаунт.")
            
        # Привязываем telegram_id и очищаем приглашение
        if not target_user.telegram_id:
            target_user.telegram_id = tg_id

        # Обновляем username и first_name (если доступны)
        if tg_user.get("username"):
            if hasattr(target_user, "username"):
                target_user.username = tg_user.get("username")
            elif hasattr(profile, "username"):
                profile.username = tg_user.get("username")
                
        if tg_user.get("first_name"):
            if hasattr(target_user, "first_name"):
                target_user.first_name = tg_user.get("first_name")
            elif hasattr(profile, "first_name"):
                profile.first_name = tg_user.get("first_name")

        profile.invite_token = None
        profile.invite_expires = None
        db.commit()
        
        user = target_user
        
    if not user:
        # Hali bog'lanmagan — frontend foydalanuvchini botga (raqam ulashishga) yo'naltirsin.
        raise HTTPException(status_code=404, detail="Telegram account not linked")

    token = create_access_token({"sub": str(user.id), "role": user.role.value})
    return {"access_token": token, "token_type": "bearer"}


@router.post("/link")
def link_telegram(data: TelegramLinkSchema, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    tg_user = validate_telegram_init_data(data.init_data)
    tg_id = str(tg_user.get("id"))

    exists = db.query(User).filter(User.telegram_id == tg_id).first()
    if exists and exists.id != user.id:
        raise HTTPException(status_code=400, detail="Telegram account is already linked to another phone number.")

    user.telegram_id = tg_id
    db.commit()
    return {"message": "Telegram account linked successfully!"}
