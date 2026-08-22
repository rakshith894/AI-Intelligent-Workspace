import re

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.project import Project
from app.schemas.project import ProjectCreate, ProjectUpdate


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

    if data.description is not None:
        project.description = data.description

    db.commit()
    db.refresh(project)

    return project


def delete_project(
    db: Session,
    project: Project,
):

    db.delete(project)
    db.commit()