from pydantic import BaseModel
from datetime import date
from typing import Optional
import uuid


class WorkoutCompletionCreate(BaseModel):
    date: date
    workout_type: str
    completed: bool = True
    notes: Optional[str] = None


class WorkoutCompletionResponse(BaseModel):
    id: uuid.UUID
    user_id: uuid.UUID
    date: date
    workout_type: str
    completed: bool
    notes: Optional[str]

    class Config:
        from_attributes = True