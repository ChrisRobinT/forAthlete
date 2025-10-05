from sqlalchemy import Column, String, Integer, ForeignKey, Text, Date
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.sql import func
from sqlalchemy import DateTime
import uuid
from app.core.database import Base


class TrainingPlan(Base):
    __tablename__ = "training_plans"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey('users.id', ondelete='CASCADE'), nullable=False)

    week_start_date = Column(Date, nullable=False)  # Monday of the week
    plan_data = Column(JSONB, nullable=False)  # The full week plan

    is_active = Column(Integer, default=1)  # 1 = current plan, 0 = archived

    created_at = Column(DateTime(timezone=True), server_default=func.now())