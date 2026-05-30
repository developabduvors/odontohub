from sqlalchemy import String, Boolean, Enum
from sqlalchemy.orm import Mapped, mapped_column, relationship
import enum
from .base import Base




class UserRole(enum.Enum):
    PATIENT = "patient"
    DENTIST = "dentist"
    ADMIN = "admin"


class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(primary_key=True)
    phone: Mapped[str] = mapped_column(String, unique=True, index=True)
    backup_phone: Mapped[str | None] = mapped_column(String, nullable=True)
    email: Mapped[str | None] = mapped_column(String, nullable=True)
    password: Mapped[str | None] = mapped_column(String, nullable=True)  # Nullable for passwordless auth
    telegram_id: Mapped[str | None] = mapped_column(String, unique=True, nullable=True, index=True)
    language: Mapped[str] = mapped_column(String, default='uz', nullable=False)  # Language preference for multilingual support
    role: Mapped[UserRole] = mapped_column(Enum(UserRole, values_callable=lambda x: [e.value for e in x], create_type=False))
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)

    patient_profile = relationship("PatientProfile", back_populates="user", uselist=False)
    dentist_profile = relationship("DentistProfile", back_populates="user", uselist=False)
    notifications = relationship("Notification", back_populates="user")
