from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from app.core.database import get_db
from app.core.security import get_current_user, require_role
from app.models.user import User, UserRole
from app.models.appointment import Appointment, AppointmentStatus
from app.schemas.appointment import AppointmentCreate, AppointmentUpdate, AppointmentSchema
from app.services.notification_service import NotificationService

router = APIRouter(prefix="/appointments", tags=["Appointments"])

@router.post("/", response_model=AppointmentSchema)
def create_appointment(
    appointment: AppointmentCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    try:
        # Determine patient_id
        patient_id = None
        if current_user.role == UserRole.PATIENT:
            if not current_user.patient_profile:
                raise HTTPException(status_code=400, detail="Patient profile not found")
            patient_id = current_user.patient_profile.id
        elif current_user.role == UserRole.DENTIST:
            if appointment.patient_id:
                patient_id = appointment.patient_id
            else:
                raise HTTPException(status_code=400, detail="patient_id is required")
        
        if not patient_id:
            raise HTTPException(status_code=400, detail="Could not determine patient_id")

        # Check if dentist exists
        from app.models.dentist import DentistProfile
        dentist = db.query(DentistProfile).filter(DentistProfile.id == appointment.dentist_id).first()
        if not dentist:
            raise HTTPException(status_code=404, detail="Dentist not found")

        db_appointment = Appointment(
            dentist_id=appointment.dentist_id,
            patient_id=patient_id,
            start_time=appointment.start_time,
            end_time=appointment.end_time,
            status=AppointmentStatus.PENDING,
            service=appointment.service,
            notes=appointment.notes,
            visit_type=appointment.visit_type or "primary",
            price=appointment.price
        )
        db.add(db_appointment)
        db.commit()
        db.refresh(db_appointment)

        # Notification yuborish - doktorga
        try:
            from app.models.notification import Notification, NotificationType
            from app.models.patient import PatientProfile
            import json

            patient = db.query(PatientProfile).filter(PatientProfile.id == patient_id).first()
            patient_name = patient.full_name if patient else "Bemor"

            # Doktor user_id ni top
            dentist_user_id = dentist.user_id

            notif = Notification(
                user_id=dentist_user_id,
                type=NotificationType.APPOINTMENT_CONFIRMED,
                title="Yangi qabul yozildi",
                message=f"{patient_name} sizga {appointment.service or 'qabul'} uchun yozildi.",
                data=json.dumps({
                    "appointment_id": db_appointment.id,
                    "patient_name": patient_name,
                    "service": appointment.service,
                })
            )
            db.add(notif)
            db.commit()
        except Exception as notif_err:
            print(f"Notification error (non-critical): {notif_err}")

        return db_appointment
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        err = str(e)
        if "uq_dentist_start_time" in err or "UniqueViolation" in err:
            raise HTTPException(status_code=409, detail="Bu vaqtda shifokor band. Boshqa vaqt tanlang.")
        import traceback
        print(f"Error creating appointment: {err}\n{traceback.format_exc()}")
        raise HTTPException(status_code=500, detail=err)

@router.get("/me", response_model=List[AppointmentSchema])
def get_my_appointments(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = db.query(Appointment)
    if current_user.role == UserRole.PATIENT:
        if not current_user.patient_profile:
            return []
        query = query.filter(Appointment.patient_id == current_user.patient_profile.id)
    else:
        if not current_user.dentist_profile:
            return []
        query = query.filter(Appointment.dentist_id == current_user.dentist_profile.id)
    
    appointments = query.all()
    
    # Populate names for the schema
    for app in appointments:
        from app.models.dentist import DentistProfile
        from app.models.patient import PatientProfile
        
        dentist = db.query(DentistProfile).filter(DentistProfile.id == app.dentist_id).first()
        app.dentist_name = dentist.full_name if dentist else "Unknown Dentist"
        
        patient = db.query(PatientProfile).filter(PatientProfile.id == app.patient_id).first()
        app.patient_name = patient.full_name if patient else "Unknown Patient"
        
    return appointments

@router.get("/patient/{patient_id}", response_model=List[AppointmentSchema])
def get_patient_appointments(
    patient_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.DENTIST))
):
    appointments = db.query(Appointment).filter(Appointment.patient_id == patient_id).all()
    
    # Populate names for the schema
    for app in appointments:
        from app.models.dentist import DentistProfile
        from app.models.patient import PatientProfile
        
        dentist = db.query(DentistProfile).filter(DentistProfile.id == app.dentist_id).first()
        app.dentist_name = dentist.full_name if dentist else "Unknown Dentist"
        
        patient = db.query(PatientProfile).filter(PatientProfile.id == app.patient_id).first()
        app.patient_name = patient.full_name if patient else "Unknown Patient"
        
    return appointments

@router.patch("/{appointment_id}", response_model=AppointmentSchema)
def update_appointment(
    appointment_id: int,
    appointment_update: AppointmentUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    db_appointment = db.query(Appointment).filter(Appointment.id == appointment_id).first()
    if not db_appointment:
        raise HTTPException(status_code=404, detail="Appointment not found")
    
    # Permission check
    if current_user.role == UserRole.PATIENT:
        if db_appointment.patient_id != current_user.patient_profile.id:
            raise HTTPException(status_code=403, detail="Not authorized to update this appointment")
    else:
        if db_appointment.dentist_id != current_user.dentist_profile.id:
            raise HTTPException(status_code=403, detail="Not authorized to update this appointment")
            
    update_data = appointment_update.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_appointment, key, value)
        
    # Status change notification
    if "status" in update_data and update_data["status"] == AppointmentStatus.COMPLETED:
        try:
            from app.models.notification import Notification, NotificationType
            from app.models.patient import PatientProfile
            import json

            patient = db.query(PatientProfile).filter(PatientProfile.id == db_appointment.patient_id).first()
            if patient:
                notif = Notification(
                    user_id=patient.user_id,
                    type=NotificationType.APPOINTMENT_COMPLETED,
                    title="Приём завершён",
                    message="Ваш приём успешно завершён. Пожалуйста, оцените качество обслуживания.",
                    data=json.dumps({
                        "appointment_id": db_appointment.id,
                        "dentist_id": db_appointment.dentist_id,
                        "show_review": True
                    })
                )
                db.add(notif)
        except Exception as e:
            print(f"Notification error: {e}")

    db.commit()
    db.refresh(db_appointment)
    return db_appointment

@router.get("/{appointment_id}", response_model=AppointmentSchema)
def get_appointment(
    appointment_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    db_appointment = db.query(Appointment).filter(Appointment.id == appointment_id).first()
    if not db_appointment:
        raise HTTPException(status_code=404, detail="Appointment not found")

    from app.models.dentist import DentistProfile
    from app.models.patient import PatientProfile

    dentist = db.query(DentistProfile).filter(DentistProfile.id == db_appointment.dentist_id).first()
    db_appointment.dentist_name = dentist.full_name if dentist else "Unknown Dentist"

    patient = db.query(PatientProfile).filter(PatientProfile.id == db_appointment.patient_id).first()
    db_appointment.patient_name = patient.full_name if patient else "Unknown Patient"

    return db_appointment
