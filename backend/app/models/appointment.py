from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy import ForeignKey, DateTime, UniqueConstraint
from sqlalchemy import Enum as PgEnum
import enum
from datetime import datetime

from .base import Base


class AppointmentStatus(str, enum.Enum):
    PENDING = "pending"
    CONFIRMED = "confirmed"
    IN_PROGRESS = "in_progress"
    MOVED = "moved"
    CANCELLED = "cancelled"
    COMPLETED = "completed"


class Appointment(Base):
    __tablename__ = "appointments"

    id: Mapped[int] = mapped_column(primary_key=True)

    dentist_id: Mapped[int] = mapped_column(
        ForeignKey("dentist_profiles.id", ondelete="CASCADE"),
        index=True
    )

    patient_id: Mapped[int] = mapped_column(
        ForeignKey("patient_profiles.id", ondelete="CASCADE"),
        index=True
    )

    start_time: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        index=True,
        nullable=False
    )

    end_time: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False
    )

    actual_start_time: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True),
        nullable=True
    )

    status: Mapped[AppointmentStatus] = mapped_column(
        PgEnum(
            AppointmentStatus,
            name="appointment_status",
            values_callable=lambda x: [e.value for e in x],
            create_type=False
        ),
        default=AppointmentStatus.PENDING,
        nullable=False
    )

    moved_from: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True),
        nullable=True
    )

    cancel_reason: Mapped[str | None] = mapped_column(nullable=True)
    service: Mapped[str | None] = mapped_column(nullable=True)
    notes: Mapped[str | None] = mapped_column(nullable=True)
    visit_type: Mapped[str] = mapped_column(
        default="primary",
        server_default="primary"
    )
    diagnosis: Mapped[str | None] = mapped_column(nullable=True)
    treatment_notes: Mapped[str | None] = mapped_column(nullable=True)
    price: Mapped[float | None] = mapped_column(nullable=True)

    __table_args__ = (
        UniqueConstraint(
            "dentist_id",
            "start_time",
            name="uq_dentist_start_time"
        ),
    )
