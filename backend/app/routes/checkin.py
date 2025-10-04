from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from datetime import date
from typing import List

from app.core.database import get_db
from app.routes.auth import get_current_user
from app.models.user import User
from app.models.daily_checkin import DailyCheckin
from app.schemas.checkin import DailyCheckinCreate, DailyCheckinResponse

router = APIRouter(prefix="/api/checkins", tags=["check-ins"])


@router.post("", response_model=DailyCheckinResponse, status_code=status.HTTP_201_CREATED)
def create_checkin(
        checkin_data: DailyCheckinCreate,
        current_user: User = Depends(get_current_user),
        db: Session = Depends(get_db)
):
    # Check if check-in already exists for this date
    existing = db.query(DailyCheckin).filter(
        DailyCheckin.user_id == current_user.id,
        DailyCheckin.date == checkin_data.date
    ).first()

    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Check-in already exists for this date"
        )

    # Create new check-in
    checkin = DailyCheckin(
        user_id=current_user.id,
        **checkin_data.model_dump()
    )
    db.add(checkin)
    db.commit()
    db.refresh(checkin)

    return checkin


@router.get("/today", response_model=DailyCheckinResponse)
def get_today_checkin(
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
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No check-in found for today"
        )

    return checkin


@router.get("/history", response_model=List[DailyCheckinResponse])
def get_checkin_history(
        limit: int = 30,
        current_user: User = Depends(get_current_user),
        db: Session = Depends(get_db)
):
    checkins = db.query(DailyCheckin).filter(
        DailyCheckin.user_id == current_user.id
    ).order_by(DailyCheckin.date.desc()).limit(limit).all()

    return checkins