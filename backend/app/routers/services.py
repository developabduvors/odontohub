from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import or_
from sqlalchemy.orm import Session
from typing import List

from app.core.database import get_db
from app.core.security import require_role
from app.models.user import User, UserRole
from app.models.service import Service
from app.schemas.service import ServiceCreate, ServiceUpdate, Service as ServiceSchema

router = APIRouter(prefix="/services", tags=["Services"])

@router.get("/", response_model=List[ServiceSchema])
def read_services(
    skip: int = 0,
    limit: int = 100,
    search: str = None,
    dentist_id: int = None,
    db: Session = Depends(get_db)
):
    query = db.query(Service)
    if search:
        query = query.filter(Service.name.ilike(f"%{search}%"))
    if dentist_id:
        # Show this dentist's own services PLUS the shared global catalogue
        # (services with no dentist assigned, dentist_id IS NULL).
        query = query.filter(
            or_(Service.dentist_id == dentist_id, Service.dentist_id.is_(None))
        )
    services = query.offset(skip).limit(limit).all()
    return services

@router.post("/", response_model=ServiceSchema)
def create_service(
    service: ServiceCreate, 
    user: User = Depends(require_role(UserRole.DENTIST)),
    db: Session = Depends(get_db)
):
    print(f"[SERVICE] Creating service for user {user.id}")
    print(f"[SERVICE] User dentist_profile: {user.dentist_profile}")
    
    # Use the authenticated dentist's profile ID
    dentist_profile_id = user.dentist_profile.id if user.dentist_profile else None
    print(f"[SERVICE] Dentist profile ID: {dentist_profile_id}")
    
    if not dentist_profile_id:
        # Try to get dentist profile manually
        from app.models.dentist import DentistProfile
        profile = db.query(DentistProfile).filter(DentistProfile.user_id == user.id).first()
        if profile:
            dentist_profile_id = profile.id
            print(f"[SERVICE] Found profile manually: {dentist_profile_id}")
        else:
            print(f"[SERVICE] No dentist profile found for user {user.id}")
            raise HTTPException(status_code=400, detail="Dentist profile not found")
    
    new_service = Service(
        name=service.name, 
        price=service.price, 
        currency=service.currency if hasattr(service, 'currency') else "UZS",
        dentist_id=dentist_profile_id
    )
    print(f"[SERVICE] Creating service with dentist_id: {new_service.dentist_id}")
    
    db.add(new_service)
    db.commit()
    db.refresh(new_service)
    
    print(f"[SERVICE] Service created with ID: {new_service.id}, dentist_id: {new_service.dentist_id}")
    return new_service

@router.patch("/{service_id}", response_model=ServiceSchema)
def update_service(
    service_id: int, 
    service: ServiceUpdate, 
    user: User = Depends(require_role(UserRole.DENTIST)),
    db: Session = Depends(get_db)
):
    db_service = db.query(Service).filter(Service.id == service_id).first()
    if not db_service:
        raise HTTPException(status_code=404, detail="Service not found")
    
    # Check if the service belongs to the authenticated dentist
    if db_service.dentist_id != user.dentist_profile.id:
        raise HTTPException(status_code=403, detail="You can only update your own services")
    
    update_data = service.dict(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_service, key, value)
    
    db.commit()
    db.refresh(db_service)
    return db_service

@router.delete("/{service_id}", response_model=ServiceSchema)
def delete_service(
    service_id: int, 
    user: User = Depends(require_role(UserRole.DENTIST)),
    db: Session = Depends(get_db)
):
    db_service = db.query(Service).filter(Service.id == service_id).first()
    if not db_service:
        raise HTTPException(status_code=404, detail="Service not found")
    
    # Check if the service belongs to the authenticated dentist
    if db_service.dentist_id != user.dentist_profile.id:
        raise HTTPException(status_code=403, detail="You can only delete your own services")
    
    db.delete(db_service)
    db.commit()
    return db_service
