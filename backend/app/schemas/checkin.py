from pydantic import BaseModel, Field
from datetime import date, datetime
from typing import Optional, List
import uuid


class DailyCheckinCreate(BaseModel):
    date: date
    hrv: Optional[int] = None
    rhr: Optional[int] = None
    sleep_hours: Optional[int] = Field(None, ge=0, le=24)
    sleep_quality: Optional[int] = Field(None, ge=1, le=5)
    soreness_level: Optional[int] = Field(None, ge=1, le=5)
    soreness_areas: Optional[List[str]] = None
    energy_level: Optional[int] = Field(None, ge=1, le=5)
    notes: Optional[str] = None


class DailyCheckinResponse(BaseModel):
    id: uuid.UUID
    user_id: uuid.UUID
    date: date
    hrv: Optional[int]
    rhr: Optional[int]
    sleep_hours: Optional[float]
    sleep_quality: Optional[int]
    soreness_level: Optional[int]
    soreness_areas: Optional[List[str]]
    energy_level: Optional[int]
    notes: Optional[str]
    created_at: datetime

    class Config:
        from_attributes = True