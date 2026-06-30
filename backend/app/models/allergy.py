from sqlalchemy import String, Integer, DateTime, Text, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship
from datetime import datetime
from .base import Base


class Allergy(Base):
    __tablename__ = "allergies"

    id: Mapped[int] = mapped_column(primary_key=True)
    patient_id: Mapped[int] = mapped_column(Integer, ForeignKey("patient_profiles.id", ondelete="CASCADE"), index=True)
    allergen_name: Mapped[str] = mapped_column("allergen_name", String(255))
    reaction_type: Mapped[str | None] = mapped_column("reaction_type", String(255), nullable=True)
    severity: Mapped[str | None] = mapped_column(String(20), nullable=True)
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    documented_by: Mapped[int | None] = mapped_column("documented_by", Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    documented_at: Mapped[datetime] = mapped_column("documented_at", DateTime, default=datetime.utcnow)
    
    patient = relationship("PatientProfile", back_populates="allergies")
    doctor = relationship("User", foreign_keys=[documented_by])
