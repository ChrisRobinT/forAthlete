from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from datetime import date

from app.core.database import get_db
from app.routes.auth import get_current_user
from app.models.user import User
from app.models.daily_checkin import DailyCheckin
from app.services.ai_coach import get_daily_recommendation
from pydantic import BaseModel

router = APIRouter(prefix="/api/coach", tags=["coach"])


class RecommendationResponse(BaseModel):
    recommendation: str


@router.get("/daily-recommendation", response_model=RecommendationResponse)
def get_daily_recommendation_endpoint(
        current_user: User = Depends(get_current_user),
        db: Session = Depends(get_db)
):
    # Get today's check-in
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

    # Convert check-in to dict
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