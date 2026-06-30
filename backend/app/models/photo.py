from sqlalchemy import String, Integer, DateTime, Text, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship
from datetime import datetime
from .base import Base


class PatientPhoto(Base):
    __tablename__ = "patient_photos"

    id: Mapped[int] = mapped_column(primary_key=True)
    patient_id: Mapped[int] = mapped_column(Integer, ForeignKey("patient_profiles.id", ondelete="CASCADE"), index=True)
    title: Mapped[str] = mapped_column(String(255))
    file_url: Mapped[str] = mapped_column(String(500))
    category: Mapped[str] = mapped_column(String(50))  # xray, treatment, other
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    uploaded_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    uploaded_by: Mapped[int | None] = mapped_column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    
    patient = relationship("PatientProfile", foreign_keys=[patient_id])
    uploader = relationship("User", foreign_keys=[uploaded_by])
