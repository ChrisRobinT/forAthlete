from pydantic import BaseModel
from typing import Optional, List, Dict
from datetime import datetime
import uuid


class InjuryItem(BaseModel):
    area: str
    severity: str  # "minor", "moderate", "severe"
    notes: Optional[str] = None


class UserProfileCreate(BaseModel):
    badminton_days: List[str]  # ["monday", "wednesday"]
    primary_sport: str  # "badminton", "running", "both"
    running_goal: Optional[str] = None
    weekly_run_volume_target: Optional[int] = None
    current_injuries: Optional[List[InjuryItem]] = None


class UserProfileUpdate(BaseModel):
    badminton_days: Optional[List[str]] = None
    primary_sport: Optional[str] = None
    running_goal: Optional[str] = None
    weekly_run_volume_target: Optional[int] = None
    current_injuries: Optional[List[InjuryItem]] = None


class UserProfileResponse(BaseModel):
    id: uuid.UUID
    user_id: uuid.UUID
    badminton_days: Optional[List[str]]
    primary_sport: Optional[str]
    running_goal: Optional[str]
    weekly_run_volume_target: Optional[int]
    current_injuries: Optional[List[Dict]]
    created_at: datetime

    class Config:
        from_attributes = True