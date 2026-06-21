from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.exc import IntegrityError, SQLAlchemyError
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import create_access_token, get_current_user, verify_password
from app.models.dentist import DentistProfile, VerificationStatus
from app.models.patient import PatientProfile
from app.models.user import User, UserRole
from app.schemas.auth import (
    BackupPhoneResponseSchema,
    BackupPhoneSchema,
    ChangePasswordSchema,
    LoginSchema,
    RegisterSchema,
    TokenSchema,
)

router = APIRouter()


@router.post("/register", response_model=TokenSchema)
def register(data: RegisterSchema, db: Session = Depends(get_db)):
    phone = data.phone.strip()
    email = data.email.strip() if data.email else None
    full_name = data.full_name.strip()

    existing = db.query(User).filter(User.phone == phone).first()
    if existing:
        raise HTTPException(status_code=400, detail="Номер уже зарегистрирован")

    role_value = data.role.value

    try:
        user = User(
            phone=phone,
            email=email,
            password=data.password,  # Store password directly for now (should be hashed in production)
            role=UserRole(role_value),
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
    print(f"[DEBUG] LOGIN: Received phone: '{data.phone}', password: '{data.password}'")
    user = db.query(User).filter(User.phone == data.phone).first()
    print(f"[DEBUG] LOGIN: User found: {user is not None}")

    if not user:
        users = db.query(User).limit(5).all()
        for existing_user in users:
            print(f"   - ID: {existing_user.id}, Phone: '{existing_user.phone}', Role: {existing_user.role}")
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
