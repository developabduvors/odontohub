"""Telegram Bot API orqali xabar yuborish (alohida bot runtime shart emas).

Foydalanuvchining chat_id si = User.telegram_id (WebApp orqali bog'langanda
saqlanadi). Bot tokeni config/env'dan o'qiladi.
"""

import hashlib
import hmac
import json
import urllib.parse

import httpx
from fastapi import HTTPException

from app.core.config import settings

# Token .env -> TELEGRAM_BOT_TOKEN; bo'lmasa mavjud hardcoded'ga fallback.
BOT_TOKEN = getattr(settings, "TELEGRAM_BOT_TOKEN", None) or "8764650815:AAH-x4sS9Uym3M5wdTYY2OkRtgHBjNCKJ5w"
_API = f"https://api.telegram.org/bot{BOT_TOKEN}"


def validate_telegram_init_data(init_data: str) -> dict:
    """Telegram WebApp initData ni HMAC bilan tekshiradi va `user` obyektini qaytaradi.

    Telegram WebApp tomonidan imzolangan ma'lumotni tasdiqlaydi: hash bo't tokeni
    asosidagi maxfiy kalit bilan qayta hisoblanadi. Mos kelmasa 401. Bu funksiya
    ham telegram routerda (login/link), ham ro'yxatdan o'tishda ishlatiladi.
    """
    parsed = dict(urllib.parse.parse_qsl(init_data))
    received_hash = parsed.pop("hash", None)
    if not received_hash:
        raise HTTPException(status_code=400, detail="Hash is missing")

    data_check_string = "\n".join(sorted(f"{k}={v}" for k, v in parsed.items()))
    secret_key = hmac.new(b"WebAppData", BOT_TOKEN.encode(), hashlib.sha256).digest()
    calculated_hash = hmac.new(secret_key, data_check_string.encode(), hashlib.sha256).hexdigest()

    if calculated_hash != received_hash:
        raise HTTPException(status_code=401, detail="Invalid Telegram hash")

    return json.loads(parsed.get("user", "{}"))


def send_telegram_message(chat_id: str, text: str, reply_markup: dict | None = None) -> bool:
    """Berilgan chat_id ga matn (ixtiyoriy reply_markup bilan) yuboradi.

    Foydalanuvchi bot bilan suhbat boshlamagan bo'lsa (yoki bloklasa)
    Telegram 403 qaytaradi -> False.
    """
    payload: dict = {"chat_id": chat_id, "text": text}
    if reply_markup is not None:
        payload["reply_markup"] = reply_markup
    try:
        resp = httpx.post(f"{_API}/sendMessage", json=payload, timeout=10)
        return resp.status_code == 200 and resp.json().get("ok", False)
    except Exception as exc:  # tarmoq/timeout
        print(f"[TELEGRAM] sendMessage xatosi: {exc}")
        return False


def send_contact_request(chat_id: str, text: str, button_text: str) -> bool:
    """Telefon raqamini ulashish tugmasini ko'rsatadi (request_contact).

    Foydalanuvchi bossa, Telegram TASDIQLANGAN telefon raqamini service-message
    sifatida botga yuboradi (webhook qabul qiladi). Bu raqamni hujumchi
    soxtalashtira olmaydi — shuning uchun bog'lash xavfsiz.
    """
    keyboard = {
        "keyboard": [[{"text": button_text, "request_contact": True}]],
        "resize_keyboard": True,
        "one_time_keyboard": True,
    }
    return send_telegram_message(chat_id, text, reply_markup=keyboard)


def send_webapp_button(chat_id: str, text: str, button_text: str, url: str) -> bool:
    """Mini App'ni ochadigan inline tugma yuboradi."""
    keyboard = {"inline_keyboard": [[{"text": button_text, "web_app": {"url": url}}]]}
    return send_telegram_message(chat_id, text, reply_markup=keyboard)


def remove_keyboard(chat_id: str, text: str) -> bool:
    """Reply-keyboard'ni olib tashlab matn yuboradi (ulashgandan keyin tozalash)."""
    return send_telegram_message(chat_id, text, reply_markup={"remove_keyboard": True})


def set_webhook(url: str, secret: str | None) -> dict:
    """Telegram webhook'ini ro'yxatdan o'tkazadi. Telegram javobini qaytaradi."""
    payload: dict = {"url": url, "allowed_updates": ["message"]}
    if secret:
        payload["secret_token"] = secret
    try:
        resp = httpx.post(f"{_API}/setWebhook", json=payload, timeout=10)
        return resp.json()
    except Exception as exc:
        return {"ok": False, "error": str(exc)}
