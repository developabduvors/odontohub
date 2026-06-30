from sqlalchemy import Column, Integer, Text, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from datetime import datetime
from app.models.base import Base

class Complaint(Base):
    __tablename__ = "complaints"

    id = Column(Integer, primary_key=True, index=True)
    dentist_id = Column(Integer, ForeignKey("dentist_profiles.id", ondelete="CASCADE"), nullable=False)
    patient_id = Column(Integer, ForeignKey("patient_profiles.id", ondelete="CASCADE"), nullable=True)
    reason = Column(Text, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    # You could add relationships if needed
    # dentist = relationship("DentistProfile")
    # patient = relationship("PatientProfile")
