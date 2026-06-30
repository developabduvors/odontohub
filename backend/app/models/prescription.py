from sqlalchemy import String, Integer, DateTime, Text, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship
from datetime import datetime
from .base import Base


class Prescription(Base):
    __tablename__ = "prescriptions"

    id: Mapped[int] = mapped_column(primary_key=True)
    patient_id: Mapped[int] = mapped_column(Integer, ForeignKey("patient_profiles.id", ondelete="CASCADE"), index=True)
    medication_name: Mapped[str] = mapped_column("medication_name", String(255))
    dosage: Mapped[str | None] = mapped_column(String(100), nullable=True)
    frequency: Mapped[str | None] = mapped_column(String(100), nullable=True)
    duration: Mapped[str | None] = mapped_column(String(100), nullable=True)
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    prescribed_by: Mapped[int | None] = mapped_column("prescribed_by", Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    prescribed_at: Mapped[datetime] = mapped_column("prescribed_at", DateTime, default=datetime.utcnow)
    
    patient = relationship("PatientProfile", back_populates="prescriptions")
    doctor = relationship("User", foreign_keys=[prescribed_by])
