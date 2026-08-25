from uuid import UUID
from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile, status
from fastapi.responses import FileResponse, JSONResponse, Response
from sqlalchemy.orm import Session

from app.api.dependencies import get_current_user_id
from app.api.permission import require_workspace_role
from app.core.database import get_db
from app.models.workspace_membership import WorkspaceMembership
from app.schemas.attachment import AttachmentListResponse, AttachmentResponse, ProjectImportResponse
from app.services.attachment import (
    delete_attachment_file,
    export_project_json,
    export_project_zip,
    get_attachment_file,
    import_project_package,
    list_project_attachments,
    save_attachment,
)

router = APIRouter(
    prefix="/api/v1/workspaces",
    tags=["Attachments & Project Uploads"],
)


@router.post(
    "/{workspace_id}/projects/{project_id}/attachments",
    response_model=AttachmentResponse,
    status_code=status.HTTP_201_CREATED,
)
def upload_attachment(
    workspace_id: UUID,
    project_id: UUID,
    file: UploadFile = File(...),
    task_id: str | None = Form(default=None),
    db: Session = Depends(get_db),
    current_user_id: str = Depends(get_current_user_id),
    membership: WorkspaceMembership = Depends(
        require_workspace_role("owner", "admin", "member")
    ),
):
    try:
        att = save_attachment(
            db=db,
            workspace_id=str(workspace_id),
            project_id=str(project_id),
            file=file,
            user_id=current_user_id,
            task_id=task_id,
        )
        return AttachmentResponse(
            id=str(att.id),
            workspace_id=str(att.workspace_id),
            project_id=str(att.project_id),
            task_id=str(att.task_id) if att.task_id else None,
            filename=att.filename,
            file_size=att.file_size,
            content_type=att.content_type,
            uploaded_by=str(att.uploaded_by),
            created_at=att.created_at,
        )
    except Exception as error:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(error),
        ) from error


@router.get(
    "/{workspace_id}/projects/{project_id}/attachments",
    response_model=AttachmentListResponse,
)
def get_attachments(
    workspace_id: UUID,
    project_id: UUID,
    task_id: str | None = None,
    db: Session = Depends(get_db),
    current_user_id: str = Depends(get_current_user_id),
    membership: WorkspaceMembership = Depends(
        require_workspace_role("owner", "admin", "member")
    ),
):
    attachments = list_project_attachments(
        db=db,
        workspace_id=str(workspace_id),
        project_id=str(project_id),
        task_id=task_id,
    )
    return AttachmentListResponse(
        items=[
            AttachmentResponse(
                id=str(att.id),
                workspace_id=str(att.workspace_id),
                project_id=str(att.project_id),
                task_id=str(att.task_id) if att.task_id else None,
                filename=att.filename,
                file_size=att.file_size,
                content_type=att.content_type,
                uploaded_by=str(att.uploaded_by),
                created_at=att.created_at,
            )
            for att in attachments
        ],
        total=len(attachments),
    )


@router.get(
    "/{workspace_id}/attachments/{attachment_id}/download",
)
def download_attachment(
    workspace_id: UUID,
    attachment_id: UUID,
    db: Session = Depends(get_db),
    current_user_id: str = Depends(get_current_user_id),
    membership: WorkspaceMembership = Depends(
        require_workspace_role("owner", "admin", "member")
    ),
):
    result = get_attachment_file(
        db=db,
        workspace_id=str(workspace_id),
        attachment_id=str(attachment_id),
    )
    if not result:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Attachment not found or missing from disk",
        )

    attachment, file_path = result
    return FileResponse(
        path=str(file_path),
        filename=attachment.filename,
        media_type=attachment.content_type,
    )


@router.delete(
    "/{workspace_id}/attachments/{attachment_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
def delete_attachment(
    workspace_id: UUID,
    attachment_id: UUID,
    db: Session = Depends(get_db),
    current_user_id: str = Depends(get_current_user_id),
    membership: WorkspaceMembership = Depends(
        require_workspace_role("owner", "admin", "member")
    ),
):
    success = delete_attachment_file(
        db=db,
        workspace_id=str(workspace_id),
        attachment_id=str(attachment_id),
    )
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Attachment not found",
        )
    return None


@router.post(
    "/{workspace_id}/projects/upload-project",
    response_model=ProjectImportResponse,
    status_code=status.HTTP_201_CREATED,
)
def upload_project_package(
    workspace_id: UUID,
    file: UploadFile = File(...),
    project_name: str | None = Form(default=None),
    project_url: str | None = Form(default=None),
    db: Session = Depends(get_db),
    current_user_id: str = Depends(get_current_user_id),
    membership: WorkspaceMembership = Depends(
        require_workspace_role("owner", "admin", "member")
    ),
):
    try:
        res = import_project_package(
            db=db,
            workspace_id=str(workspace_id),
            user_id=current_user_id,
            file=file,
            project_name=project_name,
            project_url=project_url,
        )
        return ProjectImportResponse(**res)
    except Exception as error:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(error),
        ) from error


@router.get(
    "/{workspace_id}/projects/{project_id}/export-json",
    status_code=status.HTTP_200_OK,
)
def export_project_as_json(
    workspace_id: UUID,
    project_id: UUID,
    db: Session = Depends(get_db),
    current_user_id: str = Depends(get_current_user_id),
    membership: WorkspaceMembership = Depends(
        require_workspace_role("owner", "admin", "member")
    ),
):
    try:
        data = export_project_json(
            db=db,
            workspace_id=str(workspace_id),
            project_id=str(project_id),
        )
        import json as _json
        filename = data["name"].replace(" ", "_")[:50] + "_export.json"
        return Response(
            content=_json.dumps(data, indent=2),
            media_type="application/json",
            headers={"Content-Disposition": f'attachment; filename="{filename}"'},
        )
    except ValueError as error:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(error)) from error
    except Exception as error:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(error)) from error


@router.get(
    "/{workspace_id}/projects/{project_id}/export-zip",
    status_code=status.HTTP_200_OK,
)
def export_project_as_zip(
    workspace_id: UUID,
    project_id: UUID,
    db: Session = Depends(get_db),
    current_user_id: str = Depends(get_current_user_id),
    membership: WorkspaceMembership = Depends(
        require_workspace_role("owner", "admin", "member")
    ),
):
    try:
        zip_bytes, zip_filename = export_project_zip(
            db=db,
            workspace_id=str(workspace_id),
            project_id=str(project_id),
        )
        return Response(
            content=zip_bytes,
            media_type="application/zip",
            headers={"Content-Disposition": f'attachment; filename="{zip_filename}"'},
        )
    except ValueError as error:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(error)) from error
    except Exception as error:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(error)) from error
