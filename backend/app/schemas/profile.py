from pydantic import BaseModel
from typing import Optional, List, Dict
from datetime import datetime
import uuid


class InjuryItem(BaseModel):
    area: str
    severity: str  # "minor", "moderate", "severe"
    notes: Optional[str] = None


class BadmintonSession(BaseModel):
    day: str  # "monday", "tuesday", etc.
    duration_minutes: int
    intensity: str  # "light", "moderate", "hard", "competition"
    type: str  # "training", "competition", "social"
    notes: Optional[str] = None


class RunningExperience(BaseModel):
    years_running: Optional[int] = None
    current_weekly_volume: Optional[int] = None  # current minutes per week
    longest_run: Optional[int] = None  # minutes
    recent_race_times: Optional[Dict[str, str]] = None  # {"5K": "23:45", "10K": "50:30"}
    training_phase: Optional[str] = None  # "base", "build", "peak", "recovery"


class UserProfileCreate(BaseModel):
    # Badminton schedule with details
    badminton_sessions: List[BadmintonSession]

    # Sport priorities
    primary_sport: str  # "badminton", "running", "both"

    # Running details
    running_goal: Optional[str] = None  # "improve 800m to sub-2min", "build aerobic base"
    target_race: Optional[str] = None  # "800m in 6 weeks", "5K in 3 months"
    weekly_run_volume_target: Optional[int] = None  # target minutes per week
    running_experience: Optional[RunningExperience] = None

    # Training preferences
    preferred_run_days: Optional[List[str]] = None  # ["tuesday", "thursday", "saturday"]
    avoid_run_days: Optional[List[str]] = None  # Days to definitely avoid running
    morning_person: Optional[bool] = None  # Affects workout timing suggestions

    # Recovery and constraints
    current_injuries: Optional[List[InjuryItem]] = None
    sleep_average: Optional[float] = None  # Average sleep hours
    other_commitments: Optional[str] = None  # "Work travel Wednesdays", "Family time weekends"


class UserProfileUpdate(BaseModel):
    badminton_sessions: Optional[List[BadmintonSession]] = None
    primary_sport: Optional[str] = None
    running_goal: Optional[str] = None
    target_race: Optional[str] = None
    weekly_run_volume_target: Optional[int] = None
    running_experience: Optional[RunningExperience] = None
    preferred_run_days: Optional[List[str]] = None
    avoid_run_days: Optional[List[str]] = None
    morning_person: Optional[bool] = None
    current_injuries: Optional[List[InjuryItem]] = None
    sleep_average: Optional[float] = None
    other_commitments: Optional[str] = None


class UserProfileResponse(BaseModel):
    id: uuid.UUID
    user_id: uuid.UUID
    badminton_sessions: Optional[List[Dict]]
    primary_sport: Optional[str]
    running_goal: Optional[str]
    target_race: Optional[str]
    weekly_run_volume_target: Optional[int]
    running_experience: Optional[Dict]
    preferred_run_days: Optional[List[str]]
    avoid_run_days: Optional[List[str]]
    morning_person: Optional[bool]
    current_injuries: Optional[List[Dict]]
    sleep_average: Optional[float]
    other_commitments: Optional[str]
    created_at: datetime

    class Config:
        from_attributes = True