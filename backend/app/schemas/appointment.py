from pydantic import BaseModel
from datetime import datetime
from typing import List
from app.models.appointment import AppointmentStatus

class AppointmentBase(BaseModel):
    dentist_id: int
    start_time: datetime
    end_time: datetime
    service: str | None = None

class AppointmentCreate(AppointmentBase):
    patient_id: int | None = None
    notes: str | None = None
    visit_type: str | None = "primary"
    price: float | None = None

class AppointmentUpdate(BaseModel):
    start_time: datetime | None = None
    end_time: datetime | None = None
    actual_start_time: datetime | None = None
    status: AppointmentStatus | None = None
    cancel_reason: str | None = None
    service: str | None = None
    notes: str | None = None
    visit_type: str | None = None
    diagnosis: str | None = None
    treatment_notes: str | None = None
    price: float | None = None

class AppointmentSchema(AppointmentBase):
    id: int
    patient_id: int
    dentist_name: str | None = None
    patient_name: str | None = None
    actual_start_time: datetime | None = None
    status: AppointmentStatus
    cancel_reason: str | None = None
    notes: str | None = None
    visit_type: str | None = "primary"
    diagnosis: str | None = None
    treatment_notes: str | None = None
    price: float | None = None

    class Config:
        from_attributes = True


# ── Medcard schemas ──────────────────────────────────────────────────────────

class MedcardAllergySchema(BaseModel):
    id: int
    allergen_name: str
    reaction_type: str | None = None
    severity: str | None = None
    notes: str | None = None
    documented_at: datetime | None = None

    class Config:
        from_attributes = True


class MedcardPrescriptionSchema(BaseModel):
    id: int
    medication_name: str
    dosage: str | None = None
    frequency: str | None = None
    duration: str | None = None
    notes: str | None = None
    prescribed_at: datetime | None = None

    class Config:
        from_attributes = True


class MedcardAppointmentSchema(BaseModel):
    id: int
    start_time: datetime
    end_time: datetime
    service: str | None = None
    status: AppointmentStatus
    visit_type: str | None = "primary"
    notes: str | None = None
    diagnosis: str | None = None
    treatment_notes: str | None = None
    dentist_name: str | None = None

    class Config:
        from_attributes = True


class MedcardPatientSchema(BaseModel):
    id: int
    full_name: str
    birth_date: datetime | None = None
    gender: str | None = None
    address: str | None = None
    phone: str | None = None

    class Config:
        from_attributes = True


class MedcardResponse(BaseModel):
    patient: MedcardPatientSchema
    allergies: List[MedcardAllergySchema]
    prescriptions: List[MedcardPrescriptionSchema]
    appointments: List[MedcardAppointmentSchema]
