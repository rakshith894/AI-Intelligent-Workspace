
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.notification_preference import (
    NotificationPreference,
)
from app.schemas.notification_preference import (
    NotificationPreferenceUpdate,
)


# ============================================================
# GET OR CREATE USER PREFERENCES
# ============================================================

def get_or_create_preferences(
    db: Session,
    user_id: str,
):
    user_uuid = UUID(user_id)

    preferences = db.scalar(
        select(NotificationPreference).where(
            NotificationPreference.user_id
            == user_uuid
        )
    )

    # --------------------------------------------------------
    # CREATE DEFAULT PREFERENCES
    # --------------------------------------------------------

    if not preferences:

        preferences = NotificationPreference(
            user_id=user_uuid,
            task_assigned=True,
            status_changed=True,
            task_created=True,
            task_updated=True,
            mention=True,
        )

        db.add(preferences)
        db.commit()
        db.refresh(preferences)

    return preferences


# ============================================================
# UPDATE USER PREFERENCES
# ============================================================

def update_preferences(
    db: Session,
    user_id: str,
    data: NotificationPreferenceUpdate,
):
    preferences = get_or_create_preferences(
        db,
        user_id,
    )

    # --------------------------------------------------------
    # UPDATE ONLY PROVIDED FIELDS
    # --------------------------------------------------------

    if (
        "task_assigned"
        in data.model_fields_set
        and data.task_assigned is not None
    ):
        preferences.task_assigned = (
            data.task_assigned
        )

    if (
        "status_changed"
        in data.model_fields_set
        and data.status_changed is not None
    ):
        preferences.status_changed = (
            data.status_changed
        )

    if (
        "task_created"
        in data.model_fields_set
        and data.task_created is not None
    ):
        preferences.task_created = (
            data.task_created
        )

    if (
        "task_updated"
        in data.model_fields_set
        and data.task_updated is not None
    ):
        preferences.task_updated = (
            data.task_updated
        )

    if (
        "mention"
        in data.model_fields_set
        and data.mention is not None
    ):
        preferences.mention = (
            data.mention
        )

    # --------------------------------------------------------
    # SAVE
    # --------------------------------------------------------

    db.commit()
    db.refresh(preferences)

    return preferences


# ============================================================
# CHECK WHETHER A NOTIFICATION TYPE IS ENABLED
# ============================================================

def is_notification_enabled(
    db: Session,
    user_id: str,
    notification_type: str,
) -> bool:
    preferences = get_or_create_preferences(
        db,
        user_id,
    )

    preference_map = {
        "task_assigned": (
            preferences.task_assigned
        ),
        "status_changed": (
            preferences.status_changed
        ),
        "task_created": (
            preferences.task_created
        ),
        "task_updated": (
            preferences.task_updated
        ),
        "mention": (
            preferences.mention
        ),
    }

    # Unknown notification types are allowed
    # by default so existing notification
    # functionality doesn't unexpectedly break.
    return preference_map.get(
        notification_type,
        True,
    )
