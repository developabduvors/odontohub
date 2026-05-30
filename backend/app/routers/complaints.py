from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import Optional
from app.core.database import get_db
from app.core.security import require_role
from app.models.user import User, UserRole
from app.models.complaint import Complaint
from app.models.dentist import DentistProfile
from pydantic import BaseModel
from fastapi.security import OAuth2PasswordBearer

router = APIRouter(prefix="/complaints", tags=["Complaints"])

oauth2_optional = OAuth2PasswordBearer(tokenUrl="/auth/login", auto_error=False)

class ComplaintCreate(BaseModel):
    dentist_id: int
    reason: str

async def get_optional_user(
    token: Optional[str] = Depends(oauth2_optional),
    db: Session = Depends(get_db)
) -> Optional[User]:
    if not token:
        return None
    try:
        from jose import jwt
        from app.core.config import settings
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        user_id = payload.get("sub")
        if not user_id:
            return None
        return db.query(User).filter(User.id == int(user_id)).first()
    except Exception:
        return None

@router.post("/")
def create_complaint(
    data: ComplaintCreate,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_optional_user)
):
    if not data.reason or len(data.reason.strip()) == 0:
        raise HTTPException(status_code=400, detail="Reason must be provided")

    if data.dentist_id <= 0:
        raise HTTPException(status_code=400, detail="Invalid dentist_id")

    # Get patient_id safely (nullable)
    patient_id = None
    if current_user and hasattr(current_user, 'patient_profile') and current_user.patient_profile:
        patient_id = current_user.patient_profile.id

    # Create complaint
    complaint = Complaint(
        dentist_id=data.dentist_id,
        patient_id=patient_id,
        reason=data.reason.strip()
    )
    db.add(complaint)

    # Decrease dentist rating by 0.5, minimum 0
    dentist = db.query(DentistProfile).filter(DentistProfile.id == data.dentist_id).first()
    if not dentist:
        db.rollback()
        raise HTTPException(status_code=404, detail="Dentist not found")

    current_rating = dentist.rating if dentist.rating is not None else 5.0
    dentist.rating = round(max(0.0, current_rating - 0.5), 1)

    try:
        db.commit()
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")

    return {
        "message": "Complaint submitted successfully",
        "dentist_new_rating": dentist.rating
    }

@router.get("/")
def get_complaints(
    db: Session = Depends(get_db),
    _admin: User = Depends(require_role(UserRole.ADMIN)),
):
    """Admin endpoint to see all complaints"""
    complaints = db.query(Complaint).order_by(Complaint.created_at.desc()).all()
    return complaints
