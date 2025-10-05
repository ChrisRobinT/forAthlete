from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from datetime import date, timedelta
from typing import Optional

from app.core.database import get_db
from app.routes.auth import get_current_user
from app.models.user import User
from app.models.user_profile import UserProfile
from app.models.daily_checkin import DailyCheckin
from app.services.ai_coach import get_daily_recommendation, generate_weekly_training_plan
from app.models.training_plan import TrainingPlan
from pydantic import BaseModel



router = APIRouter(prefix="/api/coach", tags=["coach"])


class RecommendationResponse(BaseModel):
    recommendation: str


class TrainingPlanRequest(BaseModel):
    start_date: Optional[str] = None


class TrainingPlanResponse(BaseModel):
    plan: dict
    generated_at: str


@router.get("/daily-recommendation", response_model=RecommendationResponse)
def get_daily_recommendation_endpoint(
        current_user: User = Depends(get_current_user),
        db: Session = Depends(get_db)
):
    today = date.today()
    checkin = db.query(DailyCheckin).filter(
        DailyCheckin.user_id == current_user.id,
        DailyCheckin.date == today
    ).first()

    if not checkin:
        raise HTTPException(
            status_code=404,
            detail="No check-in found for today. Complete your check-in first."
        )

    checkin_data = {
        'sleep_hours': checkin.sleep_hours,
        'sleep_quality': checkin.sleep_quality,
        'hrv': checkin.hrv,
        'rhr': checkin.rhr,
        'energy_level': checkin.energy_level,
        'soreness_level': checkin.soreness_level,
        'notes': checkin.notes
    }

    recommendation = get_daily_recommendation(
        user_name=current_user.name,
        checkin_data=checkin_data
    )

    return {"recommendation": recommendation}

@router.get("/training-plan/current", response_model=TrainingPlanResponse)
def get_current_training_plan(
        current_user: User = Depends(get_current_user),
        db: Session = Depends(get_db)
):
    """Get the current active training plan"""
    plan = db.query(TrainingPlan).filter(
        TrainingPlan.user_id == current_user.id,
        TrainingPlan.is_active == 1
    ).order_by(TrainingPlan.created_at.desc()).first()

    if not plan:
        raise HTTPException(
            status_code=404,
            detail="No active training plan found. Generate one first."
        )

    return {
        "plan": plan.plan_data,
        "generated_at": plan.created_at.isoformat()
    }


@router.post("/training-plan", response_model=TrainingPlanResponse)
def generate_training_plan_endpoint(
        request: TrainingPlanRequest = None,
        current_user: User = Depends(get_current_user),
        db: Session = Depends(get_db)
):
    profile = db.query(UserProfile).filter(
        UserProfile.user_id == current_user.id
    ).first()

    if not profile:
        raise HTTPException(
            status_code=404,
            detail="Profile not found. Complete onboarding first."
        )

    # Prepare profile data with all fields
    profile_data = {
        'badminton_sessions': profile.badminton_sessions or [],
        'primary_sport': profile.primary_sport,
        'running_goal': profile.running_goal,
        'target_race': profile.target_race,
        'weekly_run_volume_target': profile.weekly_run_volume_target or 180,
        'running_experience': profile.running_experience or {},
        'preferred_run_days': profile.preferred_run_days or [],
        'avoid_run_days': profile.avoid_run_days or [],
        'current_injuries': profile.current_injuries or [],
        'sleep_average': profile.sleep_average,
        'other_commitments': profile.other_commitments
    }

    start_date = None
    if request and request.start_date:
        try:
            start_date = date.fromisoformat(request.start_date)
        except ValueError:
            raise HTTPException(
                status_code=400,
                detail="Invalid date format. Use ISO format (YYYY-MM-DD)"
            )

    try:
        plan = generate_weekly_training_plan(profile_data, start_date)

        # Archive old plans
        db.query(TrainingPlan).filter(
            TrainingPlan.user_id == current_user.id,
            TrainingPlan.is_active == 1
        ).update({"is_active": 0})

        # Determine week start date
        if start_date:
            week_start = start_date
        else:
            today = date.today()
            days_until_monday = (7 - today.weekday()) % 7
            week_start = today + timedelta(days=days_until_monday if days_until_monday > 0 else 7)

        # Save new plan
        new_plan = TrainingPlan(
            user_id=current_user.id,
            week_start_date=week_start,
            plan_data=plan,
            is_active=1
        )
        db.add(new_plan)
        db.commit()
        db.refresh(new_plan)

        return {
            "plan": plan,
            "generated_at": new_plan.created_at.isoformat()
        }
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to generate training plan: {str(e)}"
        )