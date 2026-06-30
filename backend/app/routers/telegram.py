from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.user import User
from app.core.security import create_access_token, get_current_user
from app.schemas.telegram import TelegramAuthSchema, TelegramLinkSchema
from app.schemas.auth import TokenSchema
from app.services.telegram_service import validate_telegram_init_data

router = APIRouter(prefix="/telegram", tags=["telegram"])


from app.models.patient import PatientProfile
from datetime import datetime

@router.post("/login", response_model=TokenSchema)
def login_via_telegram(data: TelegramAuthSchema, db: Session = Depends(get_db)):
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
