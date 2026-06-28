from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List
from app.core.database import get_db
from app.core.security import require_role
from app.models.user import User, UserRole
from app.models.dentist import DentistProfile

router = APIRouter(prefix="/dentists", tags=["Dentists"])

@router.get("/")
def get_all_dentists(
    db: Session = Depends(get_db),
    search: str = None,
    gender: str = None,
    region: str = None,
    district: str = None,
    specialty: str = None,
):
    """Get all approved dentists (public endpoint)"""
    from sqlalchemy.orm import joinedload
    from sqlalchemy import or_, func
    
    query = db.query(DentistProfile).options(
        joinedload(DentistProfile.user)
    ).filter(
        DentistProfile.verification_status == "approved"
    )

    if search:
        search_lower = f"%{search.lower()}%"
        query = query.filter(
            or_(
                func.lower(DentistProfile.full_name).like(search_lower),
                func.lower(DentistProfile.specialization).like(search_lower),
                func.lower(DentistProfile.clinic).like(search_lower),
                func.lower(DentistProfile.address).like(search_lower),
            )
        )

    if specialty:
        # Smart mapping for specialties
        spec_map = {
            'therapist': ['терапевт', 'terapevt', 'therapist'],
            'surgeon': ['хирург', 'xirurg', 'surgeon'],
            'orthopedist': ['ортопед', 'ortoped', 'orthopedist', 'ortopedik'],
            'orthodontist': ['ортодонт', 'ortodont', 'orthodontist'],
            'periodontist': ['пародонтолог', 'parodontolog', 'periodontist'],
            'pediatric': ['детский', 'bolalar', 'pediatric'],
            'hygienist': ['гигиенист', 'gigiyenist', 'hygienist'],
            'aesthetic': ['эстетик', 'estetik', 'aesthetic'],
            'general': ['общая стоматология', 'umumiy', 'general']
        }
        
        keywords = spec_map.get(specialty.lower(), [specialty.lower()])
        conditions = [func.lower(DentistProfile.specialization).like(f"%{kw}%") for kw in keywords]
        query = query.filter(or_(*conditions))

    if gender:
        query = query.filter(DentistProfile.gender == gender)

    if region and region != 'all':
        region_map = {
            'toshkent_shahar': ['toshkent', 'ташкент', 'tashkent'],
            'toshkent_vil': ['toshkent viloyat', 'ташкентская область'],
            'samarqand': ['samarqand', 'самарканд'],
            'fargona': ["farg'ona", 'фергана', 'fergana'],
            'andijon': ['andijon', 'андижан'],
            'namangan': ['namangan', 'наманган'],
            'buxoro': ['buxoro', 'бухара', 'bukhara'],
            'qashqadaryo': ['qashqadaryo', 'кашкадарья', 'qarshi', 'qарши'],
            'surhondaryo': ['surxondaryo', 'сурхандарья', 'termiz'],
            'jizzax': ['jizzax', 'джизак'],
            'sirdaryo': ['sirdaryo', 'сырдарья', 'guliston'],
            'xorazm': ['xorazm', 'хорезм', 'urganch'],
            'qoraqalpog': ["qoraqalpog'iston", 'каракалпакстан', 'nukus'],
            'navoiy': ['navoiy', 'навои'],
        }
        keywords = region_map.get(region, [region])
        conditions = []
        for kw in keywords:
            conditions.append(func.lower(DentistProfile.address).like(f"%%{kw.lower()}%%"))
            conditions.append(func.lower(DentistProfile.clinic).like(f"%%{kw.lower()}%%"))
        query = query.filter(or_(*conditions))

    if district and district != 'all':
        district_map = {
            'yunusabad': ['yunusobod', 'yunusabad', 'юнусабад'],
            'chilonzor': ['chilonzor', 'чиланзар', 'chilandzar'],
            'mirabad': ['mirobod', 'mirabad', 'мирабад'],
            'sergeli': ['sergeli', 'сергели'],
            'shayxontohur': ['shayxontohur', 'шайхантахур'],
            'uchtepa': ['uchtepa', 'учтепа'],
            'yakkasaroy': ['yakkasaroy', 'яккасарай'],
            'olmazor': ['olmazor', 'олмазор'],
            'bektemir': ['bektemir', 'бектемир'],
            'yangihayot': ['yangihayot', 'янгихаёт'],
            'angren': ['angren', 'ангрен'],
            'bekabad': ['bekobod', 'bekabad', 'bekobod'],
            'chirchiq': ['chirchiq', 'чирчик'],
            'olmaliq': ['olmaliq', 'алмалык'],
            'nurafshon': ['nurafshon', 'нурафшон'],
        }
        keywords = district_map.get(district, [district])
        conditions = []
        for kw in keywords:
            conditions.append(func.lower(DentistProfile.address).like(f"%%{kw.lower()}%%"))
            conditions.append(func.lower(DentistProfile.clinic).like(f"%%{kw.lower()}%%"))
        query = query.filter(or_(*conditions))

    dentists = query.all()
    
    result = []
    for dentist in dentists:
        result.append({
            "id": dentist.id,
            "user_id": dentist.user_id,
            "full_name": dentist.full_name,
            "specialization": dentist.specialization,
            "education": dentist.education,
            "phone": dentist.user.phone if dentist.user else None,
            "email": dentist.user.email if dentist.user else None,
            "address": dentist.address,
            "clinic": dentist.clinic,
            "birth_date": dentist.birth_date.isoformat() if dentist.birth_date else None,
            "schedule": dentist.schedule,
            "work_hours": dentist.work_hours,
            "telegram": dentist.telegram,
            "instagram": dentist.instagram,
            "whatsapp": dentist.whatsapp,
            "latitude": dentist.latitude,
            "longitude": dentist.longitude,
            "rating": dentist.rating,
            "review_count": dentist.review_count,
            "gender": dentist.gender,
            "experience_years": getattr(dentist, 'experience_years', None),
            "works_photos": getattr(dentist, 'works_photos', None),
            "verification_status": dentist.verification_status.value if hasattr(dentist.verification_status, 'value') else dentist.verification_status
        })
    
    return result

@router.get("/specialization-counts")
def get_specialization_counts(db: Session = Depends(get_db)):
    """Get counts of approved dentists for each specialization"""
    from sqlalchemy import func, or_
    
    spec_map = {
        'therapist': ['терапевт', 'terapevt', 'therapist'],
        'surgeon': ['хирург', 'xirurg', 'surgeon'],
        'orthopedist': ['ортопед', 'ortoped', 'orthopedist', 'ortopedik'],
        'orthodontist': ['ортодонт', 'ortodont', 'orthodontist'],
        'periodontist': ['пародонтолог', 'parodontolog', 'periodontist'],
        'pediatric': ['детский', 'bolalar', 'pediatric'],
        'hygienist': ['гигиенист', 'gigiyenist', 'hygienist'],
        'aesthetic': ['эстетик', 'estetik', 'aesthetic'],
        'general': ['общая стоматология', 'umumiy', 'general']
    }
    
    # We'll count by keywords in specialization field for each category
    result = {}
    
    for spec_id, keywords in spec_map.items():
        conditions = [func.lower(DentistProfile.specialization).like(f"%{kw}%") for kw in keywords]
        count = db.query(func.count(DentistProfile.id)).filter(
            DentistProfile.verification_status == "approved",
            or_(*conditions)
        ).scalar() or 0
        result[spec_id] = count
        
    return result

@router.get("/me")
def dentist_me(
    user: User = Depends(require_role(UserRole.DENTIST)),
    db: Session = Depends(get_db)
):
    if not user.dentist_profile:
        # Не создаем автоматически профиль с мок данными
        from fastapi import HTTPException
        raise HTTPException(
            status_code=404, 
            detail="Dentist profile not found. Please complete your registration."
        )

    profile = user.dentist_profile
    
    return {
        "id": profile.id,
        "user_id": profile.user_id,
        "full_name": profile.full_name,
        "pinfl": profile.pinfl,
        "diploma_number": profile.diploma_number,
        "diploma_photo_url": profile.diploma_photo_url,
        "verification_status": profile.verification_status.value if hasattr(profile.verification_status, 'value') else profile.verification_status,
        "specialization": profile.specialization,
        "education": profile.education,
        "gender": profile.gender,  # default avatar/jins ko'rsatish uchun
        "phone": user.phone,  # Берем из user, а не из profile
        "email": user.email,  # Добавляем email
        "address": profile.address,
        "clinic": profile.clinic,
        "birth_date": profile.birth_date.isoformat() if profile.birth_date else None,
        "age": profile.age,
        "experience_years": profile.experience_years,
        "schedule": profile.schedule,
        "work_hours": profile.work_hours,
        "telegram": profile.telegram,
        "instagram": profile.instagram,
        "whatsapp": profile.whatsapp,
        "latitude": profile.latitude,
        "longitude": profile.longitude,
        "works_photos": profile.works_photos,
        "rating": profile.rating,  # Добавляем рейтинг
        "review_count": profile.review_count  # Добавляем количество отзывов
    }


@router.get("/me/stats")
def get_dentist_stats(
    user: User = Depends(require_role(UserRole.DENTIST)),
    db: Session = Depends(get_db)
):
    """Get dentist statistics"""
    from app.models.appointment import Appointment
    from app.models.patient import PatientProfile
    from sqlalchemy import func, distinct
    from datetime import datetime, timedelta
    
    # Получаем ID врача
    dentist_id = user.dentist_profile.id if user.dentist_profile else None
    
    if not dentist_id:
        return {
            "total_patients": 0,
            "total_appointments": 0,
            "completed_appointments": 0,
            "pending_appointments": 0,
            "appointments_today": 0,
            "appointments_this_month": 0,
            "new_patients_this_week": 0
        }
    
    # Unique patients for this dentist
    total_patients = db.query(func.count(distinct(Appointment.patient_id))).filter(
        Appointment.dentist_id == dentist_id
    ).scalar() or 0
    
    # Считаем все записи
    total_appointments = db.query(func.count(Appointment.id)).filter(
        Appointment.dentist_id == dentist_id
    ).scalar() or 0
    
    # Считаем завершенные записи
    completed_appointments = db.query(func.count(Appointment.id)).filter(
        Appointment.dentist_id == dentist_id,
        Appointment.status == "completed"
    ).scalar() or 0
    
    # Считаем ожидающие записи
    pending_appointments = db.query(func.count(Appointment.id)).filter(
        Appointment.dentist_id == dentist_id,
        Appointment.status.in_(["pending", "confirmed"])
    ).scalar() or 0
    
    # Дополнительная статистика для дашборда
    today = datetime.now().date()
    week_ago = datetime.now() - timedelta(days=7)
    month_start = datetime.now().replace(day=1)
    
    # Приёмы сегодня
    appointments_today = db.query(func.count(Appointment.id)).filter(
        Appointment.dentist_id == dentist_id,
        func.date(Appointment.start_time) == today
    ).scalar() or 0
    
    # Приёмы за месяц
    appointments_this_month = db.query(func.count(Appointment.id)).filter(
        Appointment.dentist_id == dentist_id,
        Appointment.start_time >= month_start
    ).scalar() or 0
    
    # New patients this week for this dentist
    new_patients_this_week = db.query(func.count(distinct(Appointment.patient_id))).filter(
        Appointment.dentist_id == dentist_id,
        Appointment.start_time >= week_ago
    ).scalar() or 0
    
    # Reviews
    from app.models.review import Review
    avg_rating = db.query(func.avg(Review.rating)).filter(Review.dentist_id == dentist_id).scalar()
    total_reviews = db.query(func.count(Review.id)).filter(Review.dentist_id == dentist_id).scalar() or 0
    
    return {
        "total_patients": total_patients,
        "total_appointments": total_appointments,
        "completed_appointments": completed_appointments,
        "pending_appointments": pending_appointments,
        "appointments_today": appointments_today,
        "appointments_this_month": appointments_this_month,
        "new_patients_this_week": new_patients_this_week,
        "average_rating": round(float(avg_rating), 1) if avg_rating else 0,
        "total_reviews": total_reviews,
    }


@router.put("/me")
def update_dentist_profile(
    profile_data: dict,
    user: User = Depends(require_role(UserRole.DENTIST)),
    db: Session = Depends(get_db)
):
    """Update dentist profile - doctors fill their own data"""
    if not user.dentist_profile:
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail="Profile not found")
    
    profile = user.dentist_profile
    
    # Список разрешенных полей для обновления
    allowed_fields = [
        'full_name', 'specialization', 'education', 'clinic', 'address', 'age',
        'birth_date', 'experience_years', 'schedule', 'work_hours', 'telegram',
        'instagram', 'whatsapp', 'latitude', 'longitude', 'works_photos',
        'pinfl', 'diploma_number', 'gender'
    ]
    
    # Обновляем только разрешенные поля
    updated_fields = []
    for key, value in profile_data.items():
        if key in allowed_fields and hasattr(profile, key):
            setattr(profile, key, value)
            updated_fields.append(key)
    
    # Если заполнены основные поля, можно рассмотреть для одобрения
    required_fields = ['specialization', 'clinic', 'pinfl', 'diploma_number']
    has_required = all(getattr(profile, field) for field in required_fields)
    
    if has_required and profile.verification_status.value == 'pending':
        # Можно добавить логику автоматического одобрения или уведомления админа
        pass
    
    db.commit()
    db.refresh(profile)
    
    return {
        "id": profile.id,
        "full_name": profile.full_name,
        "verification_status": profile.verification_status.value,
        "updated_fields": updated_fields,
        "message": "Profile updated successfully",
        "ready_for_approval": has_required
    }

@router.get("/pending")
def get_pending_dentists(
    db: Session = Depends(get_db),
    _admin: User = Depends(require_role(UserRole.ADMIN)),
):
    """Get all pending dentists for admin approval"""
    from sqlalchemy.orm import joinedload
    
    dentists = db.query(DentistProfile).options(
        joinedload(DentistProfile.user)
    ).filter(
        DentistProfile.verification_status == "pending"
    ).all()
    
    result = []
    for dentist in dentists:
        # Проверяем, заполнены ли основные поля
        required_fields = ['specialization', 'clinic', 'pinfl', 'diploma_number']
        has_required = all(getattr(dentist, field) for field in required_fields)
        
        result.append({
            "id": dentist.id,
            "user_id": dentist.user_id,
            "full_name": dentist.full_name,
            "phone": dentist.user.phone if dentist.user else None,
            "email": dentist.user.email if dentist.user else None,
            "specialization": dentist.specialization,
            "clinic": dentist.clinic,
            "address": dentist.address,
            "birth_date": dentist.birth_date.isoformat() if dentist.birth_date else None,
            "pinfl": dentist.pinfl,
            "diploma_number": dentist.diploma_number,
            "diploma_photo_url": dentist.diploma_photo_url,
            "age": dentist.age,
            "experience_years": dentist.experience_years,
            "created_at": dentist.created_at.isoformat() if dentist.created_at else None,
            "ready_for_approval": has_required,
            "verification_status": dentist.verification_status.value
        })
    
    return result

@router.get("/{dentist_id}/approve")
def approve_dentist(
    dentist_id: int,
    db: Session = Depends(get_db),
    _admin: User = Depends(require_role(UserRole.ADMIN)),
):
    """Approve a pending dentist (admin only)"""
    from app.models.dentist import VerificationStatus
    
    dentist = db.query(DentistProfile).filter(DentistProfile.id == dentist_id).first()
    
    if not dentist:
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail="Dentist not found")
    
    dentist.verification_status = VerificationStatus.APPROVED
    db.commit()
    
    return {
        "id": dentist.id,
        "full_name": dentist.full_name,
        "verification_status": "approved",
        "message": "Dentist approved successfully"
    }

@router.get("/{dentist_id}/reject")
def reject_dentist(
    dentist_id: int,
    db: Session = Depends(get_db),
    _admin: User = Depends(require_role(UserRole.ADMIN)),
):
    """Reject a pending dentist (admin only)"""
    from app.models.dentist import VerificationStatus

    dentist = db.query(DentistProfile).filter(DentistProfile.id == dentist_id).first()

    if not dentist:
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail="Dentist not found")

    dentist.verification_status = VerificationStatus.REJECTED
    db.commit()

    return {
        "id": dentist.id,
        "full_name": dentist.full_name,
        "verification_status": "rejected",
        "message": "Dentist rejected"
    }


@router.put("/{dentist_id}/status")
def update_dentist_status(
    dentist_id: int,
    body: dict,
    db: Session = Depends(get_db),
    _admin: User = Depends(require_role(UserRole.ADMIN)),
):
    """Update dentist verification status (admin only). Body: {verification_status: pending|approved|rejected}"""
    from app.models.dentist import VerificationStatus
    from fastapi import HTTPException

    dentist = db.query(DentistProfile).filter(DentistProfile.id == dentist_id).first()
    if not dentist:
        raise HTTPException(status_code=404, detail="Dentist not found")

    new_status = body.get("verification_status")
    try:
        dentist.verification_status = VerificationStatus(new_status)
    except ValueError:
        raise HTTPException(status_code=400, detail=f"Invalid status: {new_status}")

    db.commit()
    return {
        "id": dentist.id,
        "full_name": dentist.full_name,
        "verification_status": dentist.verification_status.value,
        "message": f"Status updated to {dentist.verification_status.value}"
    }

from fastapi import UploadFile, File

@router.post("/me/diploma")
async def upload_diploma(
    file: UploadFile = File(...),
    user: User = Depends(require_role(UserRole.DENTIST)),
    db: Session = Depends(get_db)
):
    """Upload dentist diploma"""
    if not user.dentist_profile:
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail="Profile not found")
    
    import uuid
    import os
    
    upload_dir = "uploads/diplomas"
    if not os.path.exists(upload_dir):
        os.makedirs(upload_dir, exist_ok=True)
    
    file_extension = os.path.splitext(file.filename)[1] if file.filename else ".jpg"
    file_name = f"{uuid.uuid4()}{file_extension}"
    file_path = os.path.join(upload_dir, file_name)

    with open(file_path, "wb") as buffer:
        content = await file.read()
        buffer.write(content)

    from app.models.dentist import VerificationStatus
    # Use forward slashes for URL (important on Windows)
    url_path = f"/uploads/diplomas/{file_name}"
    user.dentist_profile.diploma_photo_url = url_path
    user.dentist_profile.verification_status = VerificationStatus.PENDING # Reset status to pending on new upload
    db.commit()
    db.refresh(user.dentist_profile)
    
    return {
        "url": user.dentist_profile.diploma_photo_url,
        "message": "Diploma uploaded successfully and is pending review",
        "verification_status": "pending"
    }
