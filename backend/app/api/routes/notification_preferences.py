
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.api.dependencies import get_current_user_id
from app.core.database import get_db

from app.schemas.notification_preference import (
    NotificationPreferenceResponse,
    NotificationPreferenceUpdate,
)

from app.services.notification_preference import (
    get_or_create_preferences,
    update_preferences,
)


router = APIRouter(
    prefix="/api/v1/notification-preferences",
    tags=["Notification Preferences"],
)


# ============================================================
# GET NOTIFICATION PREFERENCES
# ============================================================

@router.get(
    "",
    response_model=NotificationPreferenceResponse,
)
def get_notification_preferences(
    db: Session = Depends(get_db),

    current_user_id: str = Depends(
        get_current_user_id
    ),
):
    preferences = get_or_create_preferences(
        db,
        current_user_id,
    )

    return NotificationPreferenceResponse(
        task_assigned=preferences.task_assigned,
        status_changed=preferences.status_changed,
        task_created=preferences.task_created,
        task_updated=preferences.task_updated,
        mention=preferences.mention,
        comment_added=preferences.comment_added,
    )


# ============================================================
# UPDATE NOTIFICATION PREFERENCES
# ============================================================

@router.patch(
    "",
    response_model=NotificationPreferenceResponse,
)
def update_notification_preferences(
    data: NotificationPreferenceUpdate,

    db: Session = Depends(get_db),

    current_user_id: str = Depends(
        get_current_user_id
    ),
):
    preferences = update_preferences(
        db,
        current_user_id,
        data,
    )

    return NotificationPreferenceResponse(
        task_assigned=preferences.task_assigned,
        status_changed=preferences.status_changed,
        task_created=preferences.task_created,
        task_updated=preferences.task_updated,
        mention=preferences.mention,
        comment_added=preferences.comment_added,
    )