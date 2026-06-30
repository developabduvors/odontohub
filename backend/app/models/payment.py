from sqlalchemy import String, Integer, DateTime, Text, ForeignKey, Float
from sqlalchemy.orm import Mapped, mapped_column, relationship
from datetime import datetime
from .base import Base


class Payment(Base):
    __tablename__ = "payments"

    id: Mapped[int] = mapped_column(primary_key=True)
    patient_id: Mapped[int] = mapped_column(Integer, ForeignKey("patient_profiles.id", ondelete="CASCADE"), index=True)
    appointment_id: Mapped[int | None] = mapped_column(Integer, ForeignKey("appointments.id", ondelete="SET NULL"), nullable=True)
    amount: Mapped[float] = mapped_column(Float, nullable=False)
    paid_amount: Mapped[float] = mapped_column(Float, default=0.0)
    service_name: Mapped[str] = mapped_column(String(255))
    payment_date: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    status: Mapped[str] = mapped_column(String(50), default="unpaid")  # paid, unpaid, partial
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    recorded_by: Mapped[int | None] = mapped_column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    
    patient = relationship("PatientProfile", foreign_keys=[patient_id])
    doctor = relationship("User", foreign_keys=[recorded_by])
