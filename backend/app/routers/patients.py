from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from datetime import datetime
from app.core.database import get_db
from app.core.security import require_role, hash_password, get_current_user
from app.schemas.patient import PatientCreate, PatientUpdate, PatientSchema
from app.schemas.appointment import MedcardResponse, MedcardPatientSchema, MedcardAllergySchema, MedcardPrescriptionSchema, MedcardAppointmentSchema
from app.models.patient import PatientProfile
from app.models.user import User, UserRole
from app.models.appointment import Appointment, AppointmentStatus
from app.models.allergy import Allergy
from app.models.prescription import Prescription


router = APIRouter(prefix="/patients", tags=["Patients"])


def build_medcard_response(patient_id: int, db: Session) -> MedcardResponse:
    profile = db.query(PatientProfile).filter(PatientProfile.id == patient_id).first()
    if not profile:
        raise HTTPException(status_code=404, detail="Patient not found")

    allergies = db.query(Allergy).filter(Allergy.patient_id == patient_id).all()
    prescriptions = db.query(Prescription).filter(Prescription.patient_id == patient_id).order_by(Prescription.prescribed_at.desc()).all()
    appointments = db.query(Appointment).filter(Appointment.patient_id == patient_id).order_by(Appointment.start_time.asc()).all()

    from app.models.dentist import DentistProfile

    dentist_names: dict[int, str | None] = {}
    appt_schemas = []

    for appt in appointments:
        if appt.dentist_id not in dentist_names:
            dentist = db.query(DentistProfile).filter(DentistProfile.id == appt.dentist_id).first()
            dentist_names[appt.dentist_id] = dentist.full_name if dentist else None
        appt_schemas.append(MedcardAppointmentSchema(
            id=appt.id,
            start_time=appt.start_time,
            end_time=appt.end_time,
            service=appt.service,
            status=appt.status,
            visit_type=appt.visit_type,
            notes=appt.notes,
            diagnosis=appt.diagnosis,
            treatment_notes=appt.treatment_notes,
            dentist_name=dentist_names[appt.dentist_id],
        ))

    return MedcardResponse(
        patient=MedcardPatientSchema(
            id=profile.id,
            full_name=profile.full_name,
            birth_date=profile.birth_date,
            gender=profile.gender,
            address=profile.address,
            phone=profile.user.phone if profile.user else None,
        ),
        allergies=[MedcardAllergySchema.model_validate(a) for a in allergies],
        prescriptions=[MedcardPrescriptionSchema.model_validate(p) for p in prescriptions],
        appointments=appt_schemas,
    )

def calculate_patient_status(patient_id: int, db: Session) -> str:
    """
    Calculate patient status based on appointments:
    - НОВЫЙ: no appointments
    - ЛЕЧИТСЯ: has active appointment right now
    - ЗАПИСАН: has past or future appointments, but no active appointment
    """
    now = datetime.now()
    
    # Check if patient has any appointments
    has_appointments = db.query(Appointment).filter(
        Appointment.patient_id == patient_id,
        Appointment.status != AppointmentStatus.CANCELLED
    ).first() is not None
    
    if not has_appointments:
        return "НОВЫЙ"
    
    # Check if patient has active appointment right now
    active_appointment = db.query(Appointment).filter(
        Appointment.patient_id == patient_id,
        Appointment.start_time <= now,
        Appointment.end_time >= now,
        Appointment.status.in_([AppointmentStatus.CONFIRMED, AppointmentStatus.PENDING])
    ).first()
    
    if active_appointment:
        return "ЛЕЧИТСЯ"
    
    return "ЗАПИСАН"

@router.get("/", response_model=List[PatientSchema])
def list_patients(
    db: Session = Depends(get_db),
    user: User = Depends(require_role(UserRole.DENTIST))
):
    from sqlalchemy import or_

    dentist_profile = user.dentist_profile
    if not dentist_profile:
        return []

    # Patient IDs who have appointments with this dentist (except cancelled)
    appt_patient_ids = [
        pid for (pid,) in db.query(Appointment.patient_id).filter(
            Appointment.dentist_id == dentist_profile.id,
            Appointment.status != AppointmentStatus.CANCELLED
        ).distinct().all()
    ]

    # Show patients manually added (source IS NOT NULL) OR booked with this dentist
    patients = db.query(PatientProfile).filter(
        or_(
            PatientProfile.source.isnot(None),
            PatientProfile.id.in_(appt_patient_ids) if appt_patient_ids else False
        )
    ).all()

    result = []
    for p in patients:
        schema = PatientSchema.model_validate(p)
        schema.phone = p.user.phone if p.user else None
        schema.status = calculate_patient_status(p.id, db)
        result.append(schema)
    
    # Sort by status: НОВЫЙ -> ЛЕЧИТСЯ -> ЗАПИСАН
    status_order = {"НОВЫЙ": 0, "ЛЕЧИТСЯ": 1, "ЗАПИСАН": 2}
    result.sort(key=lambda x: status_order.get(x.status, 3))
    
    return result

@router.post("/", response_model=PatientSchema)
def create_patient(
    data: PatientCreate,
    db: Session = Depends(get_db),
    user: User = Depends(require_role(UserRole.DENTIST))
):
    try:
        # Check if user already exists
        existing_user = db.query(User).filter(User.phone == data.phone).first()
        if existing_user:
            profile = db.query(PatientProfile).filter(PatientProfile.user_id == existing_user.id).first()
            if profile:
                # Update source if it's currently None so the patient becomes visible to dentists
                if not profile.source and data.source:
                    profile.source = data.source
                    db.commit()
                    db.refresh(profile)

                schema = PatientSchema.model_validate(profile)
                schema.phone = existing_user.phone
                schema.status = calculate_patient_status(profile.id, db)
                return schema
            
            # If user exists but no profile, create profile
            profile = PatientProfile(
                user_id=existing_user.id, 
                full_name=data.full_name,
                birth_date=data.birth_date,
                gender=data.gender,
                address=data.address,
                source=data.source
            )
            db.add(profile)
            db.commit()
            db.refresh(profile)
            schema = PatientSchema.model_validate(profile)
            schema.phone = existing_user.phone
            schema.status = calculate_patient_status(profile.id, db)
            return schema

        # Create new user and profile
        # Use simple string for password hash debugging if needed, but hash_password should work
        hashed = hash_password(data.phone)
        
        new_user = User(
            phone=data.phone,
            password=hashed,
            role=UserRole.PATIENT
        )
        db.add(new_user)
        db.commit()
        db.refresh(new_user)

        profile = PatientProfile(
            user_id=new_user.id, 
            full_name=data.full_name,
            birth_date=data.birth_date,
            gender=data.gender,
            address=data.address,
            source=data.source
        )
        db.add(profile)
        db.commit()
        db.refresh(profile)

        schema = PatientSchema.model_validate(profile)
        schema.phone = new_user.phone
        schema.status = calculate_patient_status(profile.id, db)
        return schema
    except Exception as e:
        import traceback
        error_msg = f"Error creating patient: {str(e)}\n{traceback.format_exc()}"
        print(error_msg) # Print to backend console
        raise HTTPException(status_code=500, detail=error_msg)

@router.get("/me", response_model=PatientSchema)
def patient_me(
    db: Session = Depends(get_db),
    user: User = Depends(require_role(UserRole.PATIENT))
):
    if not user.patient_profile:
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail="Patient profile not found")
    schema = PatientSchema.model_validate(user.patient_profile)
    schema.phone = user.phone
    schema.status = calculate_patient_status(user.patient_profile.id, db)
    return schema


@router.get("/me/medcard", response_model=MedcardResponse)
def patient_medcard_me(
    db: Session = Depends(get_db),
    user: User = Depends(require_role(UserRole.PATIENT))
):
    if not user.patient_profile:
        raise HTTPException(status_code=404, detail="Patient profile not found")

    return build_medcard_response(user.patient_profile.id, db)

from fastapi import HTTPException

@router.get("/{patient_id}", response_model=PatientSchema)
def get_patient(
    patient_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user)
):
    # Patients can only access their own profile
    if user.role == UserRole.PATIENT:
        if not user.patient_profile or user.patient_profile.id != patient_id:
            raise HTTPException(status_code=403, detail="Not authorized to view this patient")

    profile = db.query(PatientProfile).filter(PatientProfile.id == patient_id).first()
    if not profile:
        raise HTTPException(status_code=404, detail="Patient not found")
    schema = PatientSchema.model_validate(profile)
    schema.phone = profile.user.phone if profile.user else None
    schema.status = calculate_patient_status(profile.id, db)
    return schema

@router.patch("/{patient_id}", response_model=PatientSchema)
def update_patient(
    patient_id: int,
    data: PatientUpdate,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user)
):
    profile = db.query(PatientProfile).filter(PatientProfile.id == patient_id).first()
    if not profile:
        raise HTTPException(status_code=404, detail="Patient not found")

    is_dentist = user.role == UserRole.DENTIST
    is_own_patient_profile = (
        user.role == UserRole.PATIENT
        and user.patient_profile
        and user.patient_profile.id == patient_id
    )

    if not (is_dentist or is_own_patient_profile):
        raise HTTPException(status_code=403, detail="Not authorized to update this patient")
    
    for key, value in data.dict(exclude_unset=True).items():
        setattr(profile, key, value)
    
    db.commit()
    db.refresh(profile)
    schema = PatientSchema.model_validate(profile)
    schema.phone = profile.user.phone if profile.user else None
    schema.status = calculate_patient_status(profile.id, db)
    return schema

@router.get("/{patient_id}/medcard", response_model=MedcardResponse)
def get_patient_medcard(
    patient_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(require_role(UserRole.DENTIST))
):
    return build_medcard_response(patient_id, db)


@router.delete("/{patient_id}")
def delete_patient(
    patient_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(require_role(UserRole.DENTIST))
):
    profile = db.query(PatientProfile).filter(PatientProfile.id == patient_id).first()
    if not profile:
        raise HTTPException(status_code=404, detail="Patient not found")
    
    # Optional: Delete associated user if they are JUST a patient
    associated_user = profile.user
    db.delete(profile)
    if associated_user and associated_user.role == UserRole.PATIENT:
        db.delete(associated_user)
        
    db.commit()
    return {"message": "Patient deleted successfully"}
