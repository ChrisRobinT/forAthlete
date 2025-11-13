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

    # Get today's check-in
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

    # Get today's planned workout from training plan
    planned_workout = None
    try:
        plan = db.query(TrainingPlan).filter(
            TrainingPlan.user_id == current_user.id,
            TrainingPlan.is_active == 1
        ).order_by(TrainingPlan.created_at.desc()).first()

        if plan:
            day_names = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
            today_name = day_names[today.weekday()]
            today_workout = plan.plan_data.get(today_name)

            if today_workout:
                planned_workout = f"{today_workout.get('type', 'workout').upper()}: {today_workout.get('workout', 'N/A')} ({today_workout.get('duration_minutes', 0)}min)"
    except Exception as e:
        print(f"Could not fetch planned workout: {e}")
        planned_workout = None

    recommendation = get_daily_recommendation(
        user_name=current_user.name,
        checkin_data=checkin_data,
        planned_workout=planned_workout
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

@router.post("/training-plan/regenerate-day")
async def regenerate_day_endpoint(
            day_request: dict,
            current_user: User = Depends(get_current_user),
            db: Session = Depends(get_db)
    ):
        """Regenerate a single day's workout"""
        day = day_request.get("day")
        date_str = day_request.get("date")

        if not day or not date_str:
            raise HTTPException(status_code=400, detail="Day and date are required")

        # Normalize day name
        day = day.lower()
        valid_days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
        if day not in valid_days:
            raise HTTPException(status_code=400, detail="Invalid day name")

        # Get user profile
        profile = db.query(UserProfile).filter(UserProfile.user_id == current_user.id).first()
        if not profile:
            raise HTTPException(status_code=404, detail="User profile not found")

        # Get current training plan
        current_plan = db.query(TrainingPlan).filter(
            TrainingPlan.user_id == current_user.id,
            TrainingPlan.is_active == 1
        ).order_by(TrainingPlan.created_at.desc()).first()

        if not current_plan:
            raise HTTPException(status_code=404, detail="No active training plan found")

        # Prepare profile data
        profile_data = {
            'badminton_sessions': profile.badminton_sessions or [],
            'primary_sport': profile.primary_sport,
            'running_goal': profile.running_goal,
            'target_race': profile.target_race,
            'weekly_run_volume_target': profile.weekly_run_volume_target or 180,
            'running_experience': profile.running_experience or {},
            'current_injuries': profile.current_injuries or []
        }

        try:
            # Generate new workout for this day
            from app.services.ai_coach import generate_single_day_workout

            new_workout = generate_single_day_workout(
                user_profile=profile_data,
                day=day,
                date_str=date_str,
                existing_plan=current_plan.plan_data
            )

            # Update the training plan
            plan_data = current_plan.plan_data
            plan_data[day] = new_workout
            current_plan.plan_data = plan_data

            # Mark as modified
            from sqlalchemy.orm.attributes import flag_modified
            flag_modified(current_plan, "plan_data")

            db.commit()
            db.refresh(current_plan)

            return {
                "workout": new_workout,
                "message": f"{day.capitalize()} workout regenerated successfully"
            }
        except Exception as e:
            raise HTTPException(
                status_code=500,
                detail=f"Failed to regenerate workout: {str(e)}"
            )

@router.post("/training-plan/adjust-today")
async def adjust_today_workout(
            request: dict,
            current_user: User = Depends(get_current_user),
            db: Session = Depends(get_db)
    ):
        """Adjust today's workout based on recovery metrics"""

        current_workout = request.get("current_workout")
        checkin_data = request.get("checkin_data")
        recommendation = request.get("recommendation")

        if not current_workout or not checkin_data:
            raise HTTPException(
                status_code=400,
                detail="Current workout and check-in data are required"
            )

        # Get current training plan
        current_plan = db.query(TrainingPlan).filter(
            TrainingPlan.user_id == current_user.id,
            TrainingPlan.is_active == 1
        ).order_by(TrainingPlan.created_at.desc()).first()

        if not current_plan:
            raise HTTPException(status_code=404, detail="No active training plan found")

        try:
            from app.services.ai_coach import adjust_todays_workout

            # Generate adjusted workout
            adjusted_workout = adjust_todays_workout(
                current_workout=current_workout,
                checkin_data=checkin_data,
                recommendation=recommendation
            )

            # Update today's workout in the training plan
            today = date.today()
            day_names = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
            today_name = day_names[today.weekday()]

            plan_data = current_plan.plan_data
            plan_data[today_name] = adjusted_workout
            current_plan.plan_data = plan_data

            # CRITICAL: Mark the JSON column as modified so SQLAlchemy knows to save it
            from sqlalchemy.orm.attributes import flag_modified
            flag_modified(current_plan, "plan_data")

            db.commit()
            db.refresh(current_plan)

            return {
                "adjusted_workout": adjusted_workout,
                "message": "Workout adjusted based on your recovery metrics"
            }

        except Exception as e:
            raise HTTPException(
                status_code=500,
                detail=f"Failed to adjust workout: {str(e)}"
            )