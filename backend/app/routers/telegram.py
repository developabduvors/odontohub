from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.user import User
from app.core.security import create_access_token, get_current_user
from app.schemas.telegram import TelegramAuthSchema, TelegramLinkSchema
from app.schemas.auth import TokenSchema
from app.services.telegram_service import validate_telegram_init_data

router = APIRouter(prefix="/telegram", tags=["telegram"])


@router.post("/login", response_model=TokenSchema)
def login_via_telegram(data: TelegramAuthSchema, db: Session = Depends(get_db)):
    tg_user = validate_telegram_init_data(data.init_data)
    tg_id = str(tg_user.get("id"))
    
    user = db.query(User).filter(User.telegram_id == tg_id).first()
    if not user:
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
