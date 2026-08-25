import json
import urllib.request
from datetime import datetime, timezone
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.user import User


def connect_github_account(
    db: Session,
    user_id: str,
    github_username: str,
    access_token: str | None = None,
) -> User:
    user_uuid = UUID(user_id) if not isinstance(user_id, UUID) else user_id
    user = db.scalar(select(User).where(User.id == user_uuid))

    if not user:
        raise ValueError("User not found")

    clean_username = github_username.strip().lstrip("@")

    # Optionally verify username exists via GitHub API
    try:
        req = urllib.request.Request(
            f"https://api.github.com/users/{clean_username}",
            headers={"User-Agent": "AI-Intelligent-Workspace"},
        )
        with urllib.request.urlopen(req) as resp:
            data = json.loads(resp.read().decode())
            if "avatar_url" in data and data["avatar_url"]:
                user.avatar_url = data["avatar_url"]
    except Exception as exc:
        print(f"[GITHUB SERVICE] Could not fetch GitHub profile info for {clean_username}: {exc}")

    user.github_username = clean_username
    if access_token:
        user.github_access_token = access_token
    user.github_connected_at = datetime.now(timezone.utc)

    db.commit()
    db.refresh(user)

    return user


def disconnect_github_account(
    db: Session,
    user_id: str,
) -> User:
    user_uuid = UUID(user_id) if not isinstance(user_id, UUID) else user_id
    user = db.scalar(select(User).where(User.id == user_uuid))

    if not user:
        raise ValueError("User not found")

    user.github_username = None
    user.github_access_token = None
    user.github_connected_at = None

    db.commit()
    db.refresh(user)

    return user


def get_github_status(
    db: Session,
    user_id: str,
) -> dict:
    user_uuid = UUID(user_id) if not isinstance(user_id, UUID) else user_id
    user = db.scalar(select(User).where(User.id == user_uuid))

    if not user or not user.github_username:
        return {
            "is_connected": False,
            "github_username": None,
            "connected_at": None,
            "profile_url": None,
            "avatar_url": None,
        }

    return {
        "is_connected": True,
        "github_username": user.github_username,
        "connected_at": user.github_connected_at,
        "profile_url": f"https://github.com/{user.github_username}",
        "avatar_url": f"https://github.com/{user.github_username}.png",
    }


def fetch_github_repos(github_username: str) -> list:
    """
    Fetch user's public repositories from GitHub API.
    """
    try:
        url = f"https://api.github.com/users/{github_username}/repos?sort=updated&per_page=10"
        req = urllib.request.Request(
            url,
            headers={"User-Agent": "AI-Intelligent-Workspace"},
        )
        with urllib.request.urlopen(req) as resp:
            repos = json.loads(resp.read().decode())
            return [
                {
                    "name": r.get("name"),
                    "full_name": r.get("full_name"),
                    "html_url": r.get("html_url"),
                    "description": r.get("description"),
                    "stargazers_count": r.get("stargazers_count"),
                    "language": r.get("language"),
                    "updated_at": r.get("updated_at"),
                }
                for r in repos
            ]
    except Exception as exc:
        print(f"[GITHUB SERVICE ERROR] Failed to fetch repos for {github_username}: {exc}")
        return []
