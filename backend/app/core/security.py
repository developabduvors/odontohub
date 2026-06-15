import bcrypt
from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from jose import jwt, JWTError
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer

from app.core.database import get_db
from app.models.user import User, UserRole
from app.core.config import settings

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login")

# Используем bcrypt напрямую, так как passlib имеет баги совместимости с новыми версиями bcrypt
def hash_password(password: str) -> str:
    pwd_bytes = password.encode('utf-8')
    salt = bcrypt.gensalt()
    hashed = bcrypt.hashpw(pwd_bytes, salt)
    return hashed.decode('utf-8')


def verify_password(plain_password: str, hashed_password: str) -> bool:
    try:
        password_byte_enc = plain_password.encode('utf-8')
        hashed_password_enc = hashed_password.encode('utf-8')
        return bcrypt.checkpw(password_byte_enc, hashed_password_enc)
    except Exception:
        return False


def create_access_token(data: dict, expires_delta: timedelta = None) -> str:
    to_encode = data.copy()
    # expires_delta берёт верх над дефолтом (нужно для 7-дневных magic-ссылок)
    expire = datetime.utcnow() + (
        expires_delta
        if expires_delta is not None
        else timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    )
    to_encode.update({"exp": expire})
    return jwt.encode(
        to_encode,
        settings.SECRET_KEY,
        algorithm=settings.ALGORITHM
    )


def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db)
) -> User:
    try:
        payload = jwt.decode(
            token,
            settings.SECRET_KEY,
            algorithms=[settings.ALGORITHM],
        )
        user_id = payload.get("sub")
        if user_id is None:
            print(f"[AUTH] Invalid token: no user_id in payload")
            raise HTTPException(status_code=401, detail="Invalid token")

    except JWTError as e:
        print(f"[AUTH] JWT Error: {e}")
        raise HTTPException(status_code=401, detail="Invalid token")

    user = db.query(User).filter(User.id == int(user_id)).first()

    if not user:
        print(f"[AUTH] User not found: {user_id}")
        raise HTTPException(status_code=401, detail="User not found")

    print(f"[AUTH] User authenticated: {user.id} ({user.role.value})")
    return user




def require_role(role: UserRole):
    def checker(user: User = Depends(get_current_user)):
        if user.role != role:
            print(f"[AUTH] Access denied: user {user.id} has role {user.role.value}, required {role.value}")
            raise HTTPException(status_code=403, detail=f"Access denied. Required role: {role.value}, your role: {user.role.value}")
        return user
    return checker
