from sqlalchemy import ForeignKey, Text, DateTime
from sqlalchemy.orm import Mapped, mapped_column
from datetime import datetime

from app.models.base import Base


class Message(Base):
    __tablename__ = "messages"

    id: Mapped[int] = mapped_column(primary_key=True)

    appointment_id: Mapped[int] = mapped_column(
        ForeignKey("appointments.id", ondelete="CASCADE"),
        index=True,
        nullable=False
    )

    sender_id: Mapped[int] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False
    )

    text: Mapped[str] = mapped_column(Text, nullable=False, default="")
    image_data: Mapped[str | None] = mapped_column(Text, nullable=True)  # base64

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=datetime.utcnow
    )
