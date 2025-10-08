from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from datetime import date, timedelta

from app.core.database import get_db
from app.routes.auth import get_current_user
from app.models.user import User
from app.models.workout_completion import WorkoutCompletion
from app.schemas.workout_completion import WorkoutCompletionCreate, WorkoutCompletionResponse
from typing import List

router = APIRouter(prefix="/api/workouts", tags=["workouts"])


@router.post("/complete", response_model=WorkoutCompletionResponse)
def mark_workout_complete(
        completion: WorkoutCompletionCreate,
        current_user: User = Depends(get_current_user),
        db: Session = Depends(get_db)
):
    # Check if already exists
    existing = db.query(WorkoutCompletion).filter(
        WorkoutCompletion.user_id == current_user.id,
        WorkoutCompletion.date == completion.date
    ).first()

    if existing:
        # Update existing
        existing.workout_type = completion.workout_type
        existing.completed = completion.completed
        existing.notes = completion.notes
        db.commit()
        db.refresh(existing)
        return existing

    # Create new
    new_completion = WorkoutCompletion(
        user_id=current_user.id,
        date=completion.date,
        workout_type=completion.workout_type,
        completed=completion.completed,
        notes=completion.notes
    )
    db.add(new_completion)
    db.commit()
    db.refresh(new_completion)
    return new_completion


@router.get("/week", response_model=List[WorkoutCompletionResponse])
def get_week_completions(
        week_start: date,
        current_user: User = Depends(get_current_user),
        db: Session = Depends(get_db)
):
    week_end = week_start + timedelta(days=6)

    completions = db.query(WorkoutCompletion).filter(
        WorkoutCompletion.user_id == current_user.id,
        WorkoutCompletion.date >= week_start,
        WorkoutCompletion.date <= week_end
    ).all()

    return completions


@router.delete("/{completion_date}")
def delete_completion(
        completion_date: date,
        current_user: User = Depends(get_current_user),
        db: Session = Depends(get_db)
):
    completion = db.query(WorkoutCompletion).filter(
        WorkoutCompletion.user_id == current_user.id,
        WorkoutCompletion.date == completion_date
    ).first()

    if not completion:
        raise HTTPException(status_code=404, detail="Completion not found")

    db.delete(completion)
    db.commit()
    return {"message": "Completion deleted"}