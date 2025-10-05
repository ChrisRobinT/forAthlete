from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.routes.auth import get_current_user
from app.models.user import User
from app.models.user_profile import UserProfile
from app.schemas.profile import UserProfileCreate, UserProfileUpdate, UserProfileResponse

router = APIRouter(prefix="/api/profile", tags=["profile"])


@router.post("", response_model=UserProfileResponse, status_code=status.HTTP_201_CREATED)
def create_profile(
        profile_data: UserProfileCreate,
        current_user: User = Depends(get_current_user),
        db: Session = Depends(get_db)
):
    # Check if profile already exists
    existing = db.query(UserProfile).filter(UserProfile.user_id == current_user.id).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Profile already exists. Use PUT to update."
        )

    # Convert injuries to dict for JSON storage
    injuries_dict = None
    if profile_data.current_injuries:
        injuries_dict = [injury.model_dump() for injury in profile_data.current_injuries]

    profile = UserProfile(
        user_id=current_user.id,
        badminton_days=profile_data.badminton_days,
        primary_sport=profile_data.primary_sport,
        running_goal=profile_data.running_goal,
        weekly_run_volume_target=profile_data.weekly_run_volume_target,
        current_injuries=injuries_dict
    )

    db.add(profile)
    db.commit()
    db.refresh(profile)

    return profile


@router.get("", response_model=UserProfileResponse)
def get_profile(
        current_user: User = Depends(get_current_user),
        db: Session = Depends(get_db)
):
    profile = db.query(UserProfile).filter(UserProfile.user_id == current_user.id).first()
    if not profile:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Profile not found. Please complete onboarding."
        )
    return profile


@router.put("", response_model=UserProfileResponse)
def update_profile(
        profile_data: UserProfileUpdate,
        current_user: User = Depends(get_current_user),
        db: Session = Depends(get_db)
):
    profile = db.query(UserProfile).filter(UserProfile.user_id == current_user.id).first()
    if not profile:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Profile not found. Create one first."
        )

    # Update only provided fields
    update_data = profile_data.model_dump(exclude_unset=True)

    # Handle injuries conversion
    if 'current_injuries' in update_data and update_data['current_injuries']:
        update_data['current_injuries'] = [injury.model_dump() for injury in profile_data.current_injuries]

    for key, value in update_data.items():
        setattr(profile, key, value)

    db.commit()
    db.refresh(profile)

    return profile