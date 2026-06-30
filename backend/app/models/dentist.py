import enum
from sqlalchemy import String, ForeignKey, Enum, func, Float
from sqlalchemy.orm import Mapped, mapped_column, relationship
from datetime import datetime
from app.core.database import Base


class VerificationStatus(str, enum.Enum):
    PENDING = "pending"
    APPROVED = "approved"
    REJECTED = "rejected"


class DentistProfile(Base):
    __tablename__ = "dentist_profiles"

    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), unique=True)

    full_name: Mapped[str]
    pinfl: Mapped[str | None] = mapped_column(String, nullable=True)
    diploma_number: Mapped[str | None] = mapped_column(String, nullable=True)
    diploma_photo_url: Mapped[str | None] = mapped_column(String, nullable=True)
    verification_status: Mapped[VerificationStatus] = mapped_column(
        Enum(VerificationStatus, values_callable=lambda x: [e.value for e in x], create_type=False),
        default=VerificationStatus.PENDING
    )
    
    # Profile fields from EditDoctorProfile
    specialization: Mapped[str | None] = mapped_column(String, nullable=True)
    education: Mapped[str | None] = mapped_column(String, nullable=True)  # doctor enters own education
    phone: Mapped[str | None] = mapped_column(String, nullable=True)
    address: Mapped[str | None] = mapped_column(String, nullable=True)
    clinic: Mapped[str | None] = mapped_column(String, nullable=True)
    birth_date: Mapped[datetime | None] = mapped_column(nullable=True)
    age: Mapped[int | None] = mapped_column(nullable=True)
    experience_years: Mapped[int | None] = mapped_column(nullable=True)
    schedule: Mapped[str | None] = mapped_column(String, nullable=True)
    work_hours: Mapped[str | None] = mapped_column(String, nullable=True)  # Format: "08:00-16:00"
    telegram: Mapped[str | None] = mapped_column(String, nullable=True)
    instagram: Mapped[str | None] = mapped_column(String, nullable=True)
    whatsapp: Mapped[str | None] = mapped_column(String, nullable=True)
    latitude: Mapped[float | None] = mapped_column(Float, nullable=True)
    longitude: Mapped[float | None] = mapped_column(Float, nullable=True)
    works_photos: Mapped[str | None] = mapped_column(String, nullable=True)
    gender: Mapped[str | None] = mapped_column(String, nullable=True)  # "male" | "female"
    rating: Mapped[float | None] = mapped_column(nullable=True)
    review_count: Mapped[int] = mapped_column(default=0)  # JSON string of photo URLs
    created_at: Mapped[datetime] = mapped_column(server_default=func.now())
    updated_at: Mapped[datetime | None] = mapped_column(nullable=True, onupdate=func.now())

    user = relationship("User", back_populates="dentist_profile")

