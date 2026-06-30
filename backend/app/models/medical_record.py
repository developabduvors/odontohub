from sqlalchemy import ForeignKey, Text, DateTime
from sqlalchemy.orm import Mapped, mapped_column
from datetime import datetime

from app.db.base import Base


class MedicalRecord(Base):
    __tablename__ = "medical_records"

    id: Mapped[int] = mapped_column(primary_key=True)

    patient_id: Mapped[int] = mapped_column(
        ForeignKey("patient_profiles.id", ondelete="CASCADE"),
        index=True,
        nullable=False
    )

    dentist_id: Mapped[int] = mapped_column(
        ForeignKey("dentist_profiles.id", ondelete="CASCADE"),
        index=True,
        nullable=False
    )

    appointment_id: Mapped[int] = mapped_column(
        ForeignKey("appointments.id", ondelete="CASCADE"),
        nullable=False
    )

    diagnosis: Mapped[str] = mapped_column(Text, nullable=False)
    treatment: Mapped[str] = mapped_column(Text, nullable=True)
    notes: Mapped[str] = mapped_column(Text, nullable=True)

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=datetime.utcnow
    )
