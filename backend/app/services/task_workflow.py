VALID_TRANSITIONS = {
    "todo": {
        "in_progress",
        "cancelled",
    },
    "in_progress": {
        "in_review",
        "todo",
        "cancelled",
    },
    "in_review": {
        "in_progress",
        "done",
        "cancelled",
    },
    "done": {
        "in_progress",
    },
    "cancelled": {
        "todo",
    },
}


def validate_status_transition(
    current_status: str,
    new_status: str,
):
    if current_status == new_status:
        return

    allowed = VALID_TRANSITIONS.get(
        current_status,
        set(),
    )

    if new_status not in allowed:
        raise ValueError(
            f"Cannot change task status "
            f"from '{current_status}' "
            f"to '{new_status}'"
        )