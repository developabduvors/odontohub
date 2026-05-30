from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session, joinedload

from app.core.database import get_db
from app.core.security import require_role
from app.models.user import User, UserRole
from app.models.patient import PatientProfile
from app.models.dentist import DentistProfile

router = APIRouter(prefix="/admin", tags=["Admin"])


@router.get("/users")
def list_users(
    db: Session = Depends(get_db),
    role: str | None = Query(None, description="Filter by role: patient | dentist | admin"),
    limit: int = Query(100, ge=1, le=500),
    offset: int = Query(0, ge=0),
    _admin: User = Depends(require_role(UserRole.ADMIN)),
):
    """List all users with basic info. Admin only."""
    q = db.query(User).options(
        joinedload(User.patient_profile),
        joinedload(User.dentist_profile),
    )
    if role:
        try:
            q = q.filter(User.role == UserRole(role))
        except ValueError:
            return {"items": [], "total": 0}

    total = q.count()
    users = q.order_by(User.id.desc()).offset(offset).limit(limit).all()

    items = []
    for u in users:
        full_name = None
        verification_status = None
        if u.role == UserRole.PATIENT and u.patient_profile:
            full_name = u.patient_profile.full_name
        elif u.role == UserRole.DENTIST and u.dentist_profile:
            full_name = u.dentist_profile.full_name
            verification_status = u.dentist_profile.verification_status.value if u.dentist_profile.verification_status else None

        items.append({
            "id": u.id,
            "phone": u.phone,
            "email": u.email,
            "role": u.role.value,
            "full_name": full_name,
            "is_active": u.is_active,
            "verification_status": verification_status,
        })

    return {"items": items, "total": total, "limit": limit, "offset": offset}
