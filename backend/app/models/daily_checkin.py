from sqlalchemy import Column, String, DateTime, Integer, Date, ForeignKey, CheckConstraint
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.sql import func
import uuid
from app.core.database import Base


class DailyCheckin(Base):
    __tablename__ = "daily_checkins"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey('users.id', ondelete='CASCADE'), nullable=False)
    date = Column(Date, nullable=False)

    # Recovery metrics
    hrv = Column(Integer, nullable=True)  # Heart rate variability
    rhr = Column(Integer, nullable=True)  # Resting heart rate
    sleep_hours = Column(Integer, nullable=True)
    sleep_quality = Column(Integer, CheckConstraint('sleep_quality >= 1 AND sleep_quality <= 5'), nullable=True)

    # Soreness and energy
    soreness_level = Column(Integer, CheckConstraint('soreness_level >= 1 AND soreness_level <= 5'), nullable=True)
    soreness_areas = Column(JSONB, nullable=True)  # e.g., ["quads", "calves"]
    energy_level = Column(Integer, CheckConstraint('energy_level >= 1 AND energy_level <= 5'), nullable=True)

    notes = Column(String, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    __table_args__ = (
        # One check-in per user per day
        CheckConstraint('date IS NOT NULL', name='date_not_null'),
    )