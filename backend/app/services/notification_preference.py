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
    user_id: str | UUID,
):
    user_uuid = UUID(str(user_id)) if not isinstance(user_id, UUID) else user_id

    preferences = db.scalar(
        select(NotificationPreference).where(
            NotificationPreference.user_id == user_uuid
        )
    )

    # --------------------------------------------------------
    # CREATE DEFAULT PREFERENCES
    # --------------------------------------------------------

    if not preferences:
        try:
            preferences = NotificationPreference(
                user_id=user_uuid,
                task_assigned=True,
                status_changed=True,
                task_created=True,
                task_updated=True,
                mention=True,
                comment_added=True,
            )
            db.add(preferences)
            db.commit()
            db.refresh(preferences)
        except Exception:
            db.rollback()
            preferences = db.scalar(
                select(NotificationPreference).where(
                    NotificationPreference.user_id == user_uuid
                )
            )

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
    # TASK ASSIGNED
    # --------------------------------------------------------

    if (
        "task_assigned"
        in data.model_fields_set
        and data.task_assigned is not None
    ):
        preferences.task_assigned = (
            data.task_assigned
        )

    # --------------------------------------------------------
    # STATUS CHANGED
    # --------------------------------------------------------

    if (
        "status_changed"
        in data.model_fields_set
        and data.status_changed is not None
    ):
        preferences.status_changed = (
            data.status_changed
        )

    # --------------------------------------------------------
    # TASK CREATED
    # --------------------------------------------------------

    if (
        "task_created"
        in data.model_fields_set
        and data.task_created is not None
    ):
        preferences.task_created = (
            data.task_created
        )

    # --------------------------------------------------------
    # TASK UPDATED
    # --------------------------------------------------------

    if (
        "task_updated"
        in data.model_fields_set
        and data.task_updated is not None
    ):
        preferences.task_updated = (
            data.task_updated
        )

    # --------------------------------------------------------
    # MENTION
    # --------------------------------------------------------

    if (
        "mention"
        in data.model_fields_set
        and data.mention is not None
    ):
        preferences.mention = (
            data.mention
        )

    # --------------------------------------------------------
    # COMMENT ADDED
    # --------------------------------------------------------

    if (
        "comment_added"
        in data.model_fields_set
        and data.comment_added is not None
    ):
        preferences.comment_added = (
            data.comment_added
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

        "comment_added": (
            preferences.comment_added
        ),
    }

    # --------------------------------------------------------
    # UNKNOWN TYPES
    # --------------------------------------------------------

    # Unknown notification types remain enabled
    # so existing functionality does not break.
    return preference_map.get(
        notification_type,
        True,
    )