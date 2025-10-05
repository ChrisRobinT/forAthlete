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

    # Convert sessions to dict for JSON storage
    sessions_dict = None
    if profile_data.badminton_sessions:
        sessions_dict = [session.model_dump() for session in profile_data.badminton_sessions]

    # Convert injuries to dict for JSON storage
    injuries_dict = None
    if profile_data.current_injuries:
        injuries_dict = [injury.model_dump() for injury in profile_data.current_injuries]

    # Convert running experience
    running_exp_dict = None
    if profile_data.running_experience:
        running_exp_dict = profile_data.running_experience.model_dump()

    profile = UserProfile(
        user_id=current_user.id,
        badminton_sessions=sessions_dict,
        primary_sport=profile_data.primary_sport,
        running_goal=profile_data.running_goal,
        target_race=profile_data.target_race,
        weekly_run_volume_target=profile_data.weekly_run_volume_target,
        running_experience=running_exp_dict,
        preferred_run_days=profile_data.preferred_run_days,
        avoid_run_days=profile_data.avoid_run_days,
        morning_person=profile_data.morning_person,
        current_injuries=injuries_dict,
        sleep_average=profile_data.sleep_average,
        other_commitments=profile_data.other_commitments
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