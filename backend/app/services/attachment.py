import os
import shutil
import uuid
import zipfile
import json
from pathlib import Path
from uuid import UUID

from fastapi import UploadFile
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.attachment import Attachment
from app.models.project import Project
from app.models.task import Task
from app.services.project import normalize_url
from app.utils.slug import create_slug

UPLOAD_DIR = Path(__file__).resolve().parents[2] / "uploads"
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)


def save_attachment(
    db: Session,
    workspace_id: str,
    project_id: str,
    file: UploadFile,
    user_id: str,
    task_id: str | None = None,
) -> Attachment:
    ws_uuid = UUID(workspace_id)
    proj_uuid = UUID(project_id)
    task_uuid = UUID(task_id) if task_id else None
    user_uuid = UUID(user_id)

    original_filename = file.filename or "uploaded_file"
    file_ext = Path(original_filename).suffix
    unique_name = f"{uuid.uuid4().hex}{file_ext}"

    target_path = UPLOAD_DIR / unique_name
    with open(target_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    file_size = target_path.stat().st_size
    content_type = file.content_type or "application/octet-stream"

    attachment = Attachment(
        workspace_id=ws_uuid,
        project_id=proj_uuid,
        task_id=task_uuid,
        filename=original_filename,
        stored_filename=unique_name,
        file_size=file_size,
        content_type=content_type,
        uploaded_by=user_uuid,
    )

    db.add(attachment)
    db.commit()
    db.refresh(attachment)

    return attachment


def list_project_attachments(
    db: Session,
    workspace_id: str,
    project_id: str,
    task_id: str | None = None,
) -> list[Attachment]:
    ws_uuid = UUID(workspace_id)
    proj_uuid = UUID(project_id)

    stmt = select(Attachment).where(
        Attachment.workspace_id == ws_uuid,
        Attachment.project_id == proj_uuid,
    )

    if task_id:
        stmt = stmt.where(Attachment.task_id == UUID(task_id))

    stmt = stmt.order_by(Attachment.created_at.desc())
    return db.scalars(stmt).all()


def get_attachment_file(
    db: Session,
    workspace_id: str,
    attachment_id: str,
) -> tuple[Attachment, Path] | None:
    ws_uuid = UUID(workspace_id)
    att_uuid = UUID(attachment_id)

    attachment = db.scalar(
        select(Attachment).where(
            Attachment.id == att_uuid,
            Attachment.workspace_id == ws_uuid,
        )
    )

    if not attachment:
        return None

    file_path = UPLOAD_DIR / attachment.stored_filename
    if not file_path.exists():
        return None

    return attachment, file_path


def delete_attachment_file(
    db: Session,
    workspace_id: str,
    attachment_id: str,
) -> bool:
    ws_uuid = UUID(workspace_id)
    att_uuid = UUID(attachment_id)

    attachment = db.scalar(
        select(Attachment).where(
            Attachment.id == att_uuid,
            Attachment.workspace_id == ws_uuid,
        )
    )

    if not attachment:
        return False

    file_path = UPLOAD_DIR / attachment.stored_filename
    if file_path.exists():
        try:
            file_path.unlink()
        except Exception:
            pass

    db.delete(attachment)
    db.commit()
    return True


def import_project_package(
    db: Session,
    workspace_id: str,
    user_id: str,
    file: UploadFile,
    project_name: str | None = None,
    project_url: str | None = None,
) -> dict:
    """
    Import project from either a JSON project template or a ZIP containing project files & tasks.json
    """
    ws_uuid = UUID(workspace_id)
    user_uuid = UUID(user_id)
    filename = file.filename or ""

    name = project_name or Path(filename).stem.replace("_", " ").title()
    base_slug = create_slug(name)
    slug = base_slug
    counter = 2
    while db.scalar(select(Project).where(Project.workspace_id == ws_uuid, Project.slug == slug)):
        slug = f"{base_slug}-{counter}"
        counter += 1

    project = Project(
        workspace_id=ws_uuid,
        name=name,
        slug=slug,
        description=f"Imported project from package '{filename}'",
        project_url=normalize_url(project_url),
        created_by=user_uuid,
    )
    db.add(project)
    db.flush()

    tasks_count = 0
    files_count = 0

    if filename.endswith(".json"):
        file.file.seek(0)
        content = file.file.read().decode("utf-8")
        try:
            data = json.loads(content)
            if "name" in data and not project_name:
                project.name = data["name"]
            if "description" in data:
                project.description = data["description"]
            if ("project_url" in data or "url" in data) and not project_url:
                project.project_url = normalize_url(data.get("project_url") or data.get("url"))

            tasks_data = data.get("tasks", [])
            for t in tasks_data:
                task = Task(
                    workspace_id=ws_uuid,
                    project_id=project.id,
                    title=t.get("title", "Untitled Task"),
                    description=t.get("description", ""),
                    status=t.get("status", "todo"),
                    priority=t.get("priority", "medium"),
                    created_by=user_uuid,
                )
                db.add(task)
                tasks_count += 1
        except Exception:
            pass

    elif filename.endswith(".zip"):
        temp_zip = UPLOAD_DIR / f"temp_{uuid.uuid4().hex}.zip"
        with open(temp_zip, "wb") as buf:
            shutil.copyfileobj(file.file, buf)

        try:
            with zipfile.ZipFile(temp_zip, 'r') as zf:
                for member in zf.infolist():
                    if member.is_dir() or member.filename.startswith("__MACOSX"):
                        continue
                    
                    base_member_name = Path(member.filename).name
                    if base_member_name == "tasks.json" or base_member_name == "project.json":
                        try:
                            raw = zf.read(member).decode("utf-8")
                            pdata = json.loads(raw)
                            if "description" in pdata and not project.description:
                                project.description = pdata["description"]
                            if ("project_url" in pdata or "url" in pdata) and not project_url:
                                project.project_url = normalize_url(pdata.get("project_url") or pdata.get("url"))
                            for t in pdata.get("tasks", []):
                                task = Task(
                                    workspace_id=ws_uuid,
                                    project_id=project.id,
                                    title=t.get("title", "Untitled Deliverable"),
                                    description=t.get("description", ""),
                                    status=t.get("status", "todo"),
                                    priority=t.get("priority", "medium"),
                                    created_by=user_uuid,
                                )
                                db.add(task)
                                tasks_count += 1
                        except Exception:
                            pass
                    elif base_member_name == "package.json":
                        try:
                            raw = zf.read(member).decode("utf-8")
                            pkg_data = json.loads(raw)
                            if not project.description and "description" in pkg_data:
                                project.description = pkg_data["description"]
                            if not project.project_url:
                                repo = pkg_data.get("repository")
                                if isinstance(repo, str):
                                    project.project_url = normalize_url(repo.replace("git+", "").replace(".git", ""))
                                elif isinstance(repo, dict) and "url" in repo:
                                    project.project_url = normalize_url(str(repo["url"]).replace("git+", "").replace(".git", ""))
                                elif "homepage" in pkg_data:
                                    project.project_url = normalize_url(pkg_data["homepage"])
                        except Exception:
                            pass

                    # Store file as project attachment (unless macOS meta)
                    if not (base_member_name == "tasks.json" or base_member_name == "project.json"):
                        unique_name = f"{uuid.uuid4().hex}_{base_member_name}"
                        extracted_path = UPLOAD_DIR / unique_name
                        with zf.open(member) as source, open(extracted_path, "wb") as target:
                            shutil.copyfileobj(source, target)
                        
                        att = Attachment(
                            workspace_id=ws_uuid,
                            project_id=project.id,
                            filename=base_member_name,
                            stored_filename=unique_name,
                            file_size=extracted_path.stat().st_size,
                            content_type="application/octet-stream",
                            uploaded_by=user_uuid,
                        )
                        db.add(att)
                        files_count += 1
        finally:
            if temp_zip.exists():
                temp_zip.unlink()

    db.commit()
    db.refresh(project)

    return {
        "project_id": str(project.id),
        "name": project.name,
        "project_url": project.project_url,
        "imported_tasks_count": tasks_count,
        "imported_files_count": files_count,
        "message": f"Successfully imported project '{project.name}' with {tasks_count} task(s) and {files_count} file(s).",
    }


def export_project_json(
    db: Session,
    workspace_id: str,
    project_id: str,
) -> dict:
    """
    Export a project and its tasks as a JSON-serialisable dict.
    """
    ws_uuid = UUID(workspace_id)
    proj_uuid = UUID(project_id)

    project = db.scalar(
        select(Project).where(Project.id == proj_uuid, Project.workspace_id == ws_uuid)
    )
    if not project:
        raise ValueError("Project not found")

    tasks = db.scalars(
        select(Task).where(Task.project_id == proj_uuid)
    ).all()

    return {
        "name": project.name,
        "description": project.description or "",
        "slug": project.slug,
        "project_url": project.project_url,
        "exported_at": project.created_at.isoformat() if project.created_at else None,
        "tasks": [
            {
                "title": t.title,
                "description": t.description or "",
                "status": t.status,
                "priority": t.priority,
                "due_date": t.due_date.isoformat() if t.due_date else None,
            }
            for t in tasks
        ],
    }


def export_project_zip(
    db: Session,
    workspace_id: str,
    project_id: str,
) -> tuple[bytes, str]:
    """
    Export a project as a ZIP archive containing project.json + all attachment files.
    Returns (zip_bytes, zip_filename).
    """
    import io

    ws_uuid = UUID(workspace_id)
    proj_uuid = UUID(project_id)

    project_data = export_project_json(db, workspace_id, project_id)
    safe_name = project_data["name"].replace(" ", "_").replace("/", "_")[:50]
    zip_filename = f"{safe_name}_export.zip"

    attachments = db.scalars(
        select(Attachment).where(
            Attachment.project_id == proj_uuid,
            Attachment.workspace_id == ws_uuid,
        )
    ).all()

    buffer = io.BytesIO()
    with zipfile.ZipFile(buffer, "w", zipfile.ZIP_DEFLATED) as zf:
        # Write project.json
        zf.writestr("project.json", json.dumps(project_data, indent=2))

        # Write attachment files
        for att in attachments:
            file_path = UPLOAD_DIR / att.stored_filename
            if file_path.exists():
                zf.write(file_path, arcname=f"files/{att.filename}")

    return buffer.getvalue(), zip_filename

