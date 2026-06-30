from sqlalchemy import Column, Integer, Float, Text, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from datetime import datetime
from app.models.base import Base

class Review(Base):
    __tablename__ = "reviews"

    id = Column(Integer, primary_key=True, index=True)
    dentist_id = Column(Integer, ForeignKey("dentist_profiles.id", ondelete="CASCADE"), nullable=False)
    patient_id = Column(Integer, ForeignKey("patient_profiles.id", ondelete="CASCADE"), nullable=False)
    appointment_id = Column(Integer, ForeignKey("appointments.id", ondelete="SET NULL"), nullable=True)
    rating = Column(Float, nullable=False)
    comment = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
