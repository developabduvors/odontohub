from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.user import User
from app.core.security import create_access_token, get_current_user
from app.schemas.telegram import TelegramAuthSchema, TelegramLinkSchema
from app.schemas.auth import TokenSchema
import hashlib
import hmac
import urllib.parse
import json

router = APIRouter(prefix="/telegram", tags=["telegram"])

BOT_TOKEN = "8764650815:AAH-x4sS9Uym3M5wdTYY2OkRtgHBjNCKJ5w"

def validate_telegram_data(init_data: str) -> dict:
    # URL decode standard x-www-form-urlencoded
    parsed_data = dict(urllib.parse.parse_qsl(init_data))
    hash_str = parsed_data.pop("hash", None)
    
    if not hash_str:
        raise HTTPException(status_code=400, detail="Hash is missing")
    
    # Sort key-value pairs alphabetically and form data_check_string
    data_check_list = [f"{k}={v}" for k, v in parsed_data.items()]
    data_check_list.sort()
    data_check_string = "\n".join(data_check_list)
    
    # Compute signature
    secret_key = hmac.new(b"WebAppData", BOT_TOKEN.encode(), hashlib.sha256).digest()
    calculated_hash = hmac.new(secret_key, data_check_string.encode(), hashlib.sha256).hexdigest()
    
    if calculated_hash != hash_str:
        raise HTTPException(status_code=401, detail="Invalid Telegram hash")
    
    return json.loads(parsed_data.get("user", "{}"))

@router.post("/login", response_model=TokenSchema)
def login_via_telegram(data: TelegramAuthSchema, db: Session = Depends(get_db)):
    tg_user = validate_telegram_data(data.init_data)
    tg_id = str(tg_user.get("id"))
    
    user = db.query(User).filter(User.telegram_id == tg_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Telegram account not linked")
    
    token = create_access_token({"sub": str(user.id), "role": user.role.value})
    return {"access_token": token, "token_type": "bearer"}

@router.post("/link")
def link_telegram(data: TelegramLinkSchema, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    tg_user = validate_telegram_data(data.init_data)
    tg_id = str(tg_user.get("id"))
    
    exists = db.query(User).filter(User.telegram_id == tg_id).first()
    if exists and exists.id != user.id:
        raise HTTPException(status_code=400, detail="Telegram account is already linked to another phone number.")
        
    user.telegram_id = tg_id
    db.commit()
    return {"message": "Telegram account linked successfully!"}
