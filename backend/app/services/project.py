import re

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.project import Project
from app.schemas.project import ProjectCreate, ProjectUpdate


def normalize_url(url: str | None) -> str | None:
    if not url:
        return None
    url = url.strip()
    if not url:
        return None
    
    # Handle git+ prefixes
    if url.startswith("git+"):
        url = url[4:]
    
    # Handle ssh git@ URLs: git@github.com:user/repo.git -> https://github.com/user/repo
    if url.startswith("git@"):
        url = re.sub(r"^git@([^:]+):", r"https://\1/", url)
    elif url.startswith("ssh://git@"):
        url = re.sub(r"^ssh://git@([^/]+)/", r"https://\1/", url)
    elif url.startswith("git://"):
        url = re.sub(r"^git://", "https://", url)
    
    # Remove trailing .git
    if url.endswith(".git"):
        url = url[:-4]
    
    if not (url.startswith("http://") or url.startswith("https://")):
        return f"https://{url}"
    return url


def create_slug(name: str) -> str:
    slug = name.lower().strip()
    slug = re.sub(r"[^a-z0-9]+", "-", slug)
    slug = slug.strip("-")

    return slug


def create_project(
    db: Session,
    workspace_id: str,
    user_id: str,
    data: ProjectCreate,
) -> Project:

    slug = create_slug(data.name)

    project = Project(
        workspace_id=workspace_id,
        name=data.name,
        slug=slug,
        description=data.description,
        project_url=normalize_url(data.project_url),
        github_url=normalize_url(data.github_url),
        created_by=user_id,
    )

    db.add(project)
    db.commit()
    db.refresh(project)

    return project


def get_projects(
    db: Session,
    workspace_id: str,
):
    return db.scalars(
        select(Project)
        .where(Project.workspace_id == workspace_id)
        .order_by(Project.created_at.desc())
    ).all()


def get_project(
    db: Session,
    workspace_id: str,
    project_id: str,
):
    return db.scalar(
        select(Project).where(
            Project.id == project_id,
            Project.workspace_id == workspace_id,
        )
    )


def update_project(
    db: Session,
    project: Project,
    data: ProjectUpdate,
):

    if data.name is not None:
        project.name = data.name
        project.slug = create_slug(data.name)

    if "description" in data.model_fields_set:
        project.description = data.description

    if "project_url" in data.model_fields_set:
        project.project_url = normalize_url(data.project_url)

    if "github_url" in data.model_fields_set:
        project.github_url = normalize_url(data.github_url)

    db.commit()
    db.refresh(project)

    return project


def delete_project(
    db: Session,
    project: Project,
):

    db.delete(project)
    db.commit()