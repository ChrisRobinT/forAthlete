from sqlalchemy import Column, String, Integer, ForeignKey, Text
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.sql import func
from sqlalchemy import DateTime
import uuid
from app.core.database import Base


class UserProfile(Base):
    __tablename__ = "user_profiles"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey('users.id', ondelete='CASCADE'), nullable=False, unique=True)

    # Training schedule
    badminton_days = Column(JSONB, nullable=True)  # ["monday", "wednesday"] or ["monday", "friday"]

    # Goals and preferences
    primary_sport = Column(String(50), nullable=True)  # "badminton", "running", "both"
    running_goal = Column(Text, nullable=True)  # "5K improvement", "marathon training", etc.
    weekly_run_volume_target = Column(Integer, nullable=True)  # minutes per week

    # Injury tracking
    current_injuries = Column(JSONB, nullable=True)  # [{"area": "calf", "severity": "minor", "notes": "..."}]
    injury_history = Column(JSONB, nullable=True)

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())