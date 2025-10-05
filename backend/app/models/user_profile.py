from sqlalchemy import Column, String, Integer, Float, Boolean, ForeignKey, Text
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.sql import func
from sqlalchemy import DateTime
import uuid
from app.core.database import Base


class UserProfile(Base):
    __tablename__ = "user_profiles"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey('users.id', ondelete='CASCADE'), nullable=False, unique=True)

    # Badminton schedule with full details
    badminton_sessions = Column(JSONB, nullable=True)  # [{"day": "monday", "duration_minutes": 120, "intensity": "hard", "type": "training"}]

    # Sport priorities
    primary_sport = Column(String(50), nullable=True)  # "badminton", "running", "both"

    # Running goals and details
    running_goal = Column(Text, nullable=True)  # "improve 800m to sub-2min"
    target_race = Column(String(200), nullable=True)  # "800m in 6 weeks"
    weekly_run_volume_target = Column(Integer, nullable=True)  # target minutes per week
    running_experience = Column(JSONB, nullable=True)  # {"years_running": 3, "current_weekly_volume": 120, ...}

    # Training preferences
    preferred_run_days = Column(JSONB, nullable=True)  # ["tuesday", "thursday", "saturday"]
    avoid_run_days = Column(JSONB, nullable=True)  # ["wednesday"] - hard no for running
    morning_person = Column(Boolean, nullable=True)

    # Recovery and constraints
    current_injuries = Column(JSONB, nullable=True)  # [{"area": "calf", "severity": "minor", "notes": "..."}]
    injury_history = Column(JSONB, nullable=True)
    sleep_average = Column(Float, nullable=True)  # Average sleep hours
    other_commitments = Column(Text, nullable=True)  # Free text for constraints

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())