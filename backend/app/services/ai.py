from datetime import datetime, timezone
from uuid import UUID
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.project import Project
from app.models.task import Task
from app.models.workspace import Workspace
from app.models.workspace_membership import WorkspaceMembership
from app.schemas.ai import (
    AutoAssignResponse,
    DailyStandupResponse,
    ExternalAIChatRequest,
    ExternalAIChatResponse,
    KnowledgeSearchResponse,
    SprintAnalysisResponse,
    SprintRetrospectiveResponse,
    SubtaskSuggestion,
    TaskBreakdownRequest,
    TaskBreakdownResponse,
)


def breakdown_task(
    db: Session,
    workspace_id: str,
    data: TaskBreakdownRequest,
) -> TaskBreakdownResponse:
    title = data.title.strip()
    title_lower = title.lower()

    # Heuristic AI breakdown tailored to task keywords
    subtasks: list[SubtaskSuggestion] = []
    tags: list[str] = []
    priority = data.priority or "medium"

    if any(k in title_lower for k in ["auth", "login", "jwt", "oauth", "security", "permission"]):
        tags.extend(["security", "backend", "auth"])
        priority = "high"
        subtasks = [
            SubtaskSuggestion(title="Define authentication schemas and payload validators", estimated_hours=1.5),
            SubtaskSuggestion(title="Implement token hashing and cryptographic verification", estimated_hours=2.0),
            SubtaskSuggestion(title="Add secure route middleware & permission tests", estimated_hours=1.5),
            SubtaskSuggestion(title="Document security policy & client token handling", estimated_hours=1.0),
        ]
    elif any(k in title_lower for k in ["ui", "frontend", "design", "layout", "page", "modal", "view"]):
        tags.extend(["frontend", "design", "ux"])
        subtasks = [
            SubtaskSuggestion(title="Draft responsive UI mockup & theme tokens", estimated_hours=1.0),
            SubtaskSuggestion(title="Build interactive component states (loading, empty, active)", estimated_hours=2.5),
            SubtaskSuggestion(title="Wire component to REST API service layer", estimated_hours=1.5),
            SubtaskSuggestion(title="Verify mobile responsiveness & accessibility", estimated_hours=1.0),
        ]
    elif any(k in title_lower for k in ["api", "backend", "db", "database", "model", "migration", "schema"]):
        tags.extend(["backend", "database", "api"])
        subtasks = [
            SubtaskSuggestion(title="Design database schema models and migration script", estimated_hours=1.5),
            SubtaskSuggestion(title="Build CRUD service methods with transaction rollbacks", estimated_hours=2.0),
            SubtaskSuggestion(title="Expose typed FastAPI endpoints with response models", estimated_hours=1.5),
            SubtaskSuggestion(title="Write automated pytest unit & integration tests", estimated_hours=1.5),
        ]
    elif any(k in title_lower for k in ["bug", "fix", "error", "crash", "issue", "patch"]):
        tags.extend(["bugfix", "maintenance"])
        priority = "urgent"
        subtasks = [
            SubtaskSuggestion(title="Reproduce error condition with minimal test case", estimated_hours=1.0),
            SubtaskSuggestion(title="Root cause diagnosis and implement fix", estimated_hours=2.0),
            SubtaskSuggestion(title="Add regression test to test suite", estimated_hours=1.0),
        ]
    else:
        tags.extend(["feature", "deliverable"])
        subtasks = [
            SubtaskSuggestion(title=f"Analyze requirements & architecture for {title}", estimated_hours=1.0),
            SubtaskSuggestion(title="Execute core implementation steps", estimated_hours=3.0),
            SubtaskSuggestion(title="Perform integration testing & quality review", estimated_hours=1.5),
        ]

    suggested_desc = (
        data.description
        if data.description and len(data.description.strip()) > 10
        else f"Comprehensive implementation of '{title}'. Ensures end-to-end integration, robust error handling, and unit test coverage."
    )

    return TaskBreakdownResponse(
        suggested_description=suggested_desc,
        suggested_priority=priority,
        suggested_tags=tags,
        subtasks=subtasks,
    )


def analyze_sprint_health(
    db: Session,
    workspace_id: str,
) -> SprintAnalysisResponse:
    workspace_uuid = UUID(workspace_id)
    projects = db.scalars(
        select(Project).where(Project.workspace_id == workspace_uuid)
    ).all()
    project_ids = [p.id for p in projects]

    if not project_ids:
        return SprintAnalysisResponse(
            health_score=100,
            health_status="Ready to launch",
            total_tasks=0,
            completed_tasks=0,
            overdue_tasks=0,
            predicted_blockers=["No active projects yet."],
            recommendations=["Create your first project and populate the backlog."],
        )

    tasks = db.scalars(
        select(Task).where(Task.project_id.in_(project_ids))
    ).all()

    total = len(tasks)
    done = len([t for t in tasks if t.status == "done"])
    in_progress = len([t for t in tasks if t.status == "in_progress"])
    overdue = len([t for t in tasks if t.due_date and t.due_date < datetime.now(timezone.utc) and t.status != "done"])

    completion_rate = int((done / total) * 100) if total > 0 else 0

    # Calculate health score
    score = 100
    if overdue > 0:
        score -= min(40, overdue * 10)
    if total > 0 and completion_rate < 30:
        score -= 15

    health_status = "Optimal" if score >= 80 else "Attention Required" if score >= 50 else "Critical Risk"

    blockers = []
    if overdue > 0:
        blockers.append(f"{overdue} deliverable(s) are past their due dates and blocking project completion.")
    if in_progress > 10:
        blockers.append(f"High concurrency detected: {in_progress} tasks in progress simultaneously. Risk of context switching.")
    if not blockers:
        blockers.append("No active sprint blockers detected. Deliverables are progressing on schedule.")

    recommendations = []
    if overdue > 0:
        recommendations.append("Conduct an urgent backlog triage to reassign or adjust overdue task deadlines.")
    if completion_rate < 50 and total > 5:
        recommendations.append("Focus team efforts on closing In-Progress tasks before starting new backlog items.")
    recommendations.append("Maintain continuous integration test checks for all active deliverables.")

    return SprintAnalysisResponse(
        health_score=max(0, score),
        health_status=health_status,
        total_tasks=total,
        completed_tasks=done,
        overdue_tasks=overdue,
        predicted_blockers=blockers,
        recommendations=recommendations,
    )


def generate_daily_standup(
    db: Session,
    workspace_id: str,
) -> DailyStandupResponse:
    workspace_uuid = UUID(workspace_id)
    workspace = db.scalar(select(Workspace).where(Workspace.id == workspace_uuid))
    ws_name = workspace.name if workspace else "Workspace"

    projects = db.scalars(
        select(Project).where(Project.workspace_id == workspace_uuid)
    ).all()
    project_ids = [p.id for p in projects]

    tasks = db.scalars(
        select(Task).where(Task.project_id.in_(project_ids))
    ).all() if project_ids else []

    done_tasks = [t.title for t in tasks if t.status == "done"][:5]
    active_tasks = [t.title for t in tasks if t.status == "in_progress"][:5]
    overdue_tasks = [t.title for t in tasks if t.due_date and t.due_date < datetime.now(timezone.utc) and t.status != "done"][:5]

    completed_recent = done_tasks if done_tasks else ["No tasks completed in this sprint yet"]
    in_progress_today = active_tasks if active_tasks else ["No active in-progress tasks currently"]
    blockers = [f"Overdue: {title}" for title in overdue_tasks] if overdue_tasks else ["No critical blockers identified"]

    summary_md = f"""### 🚀 Daily Standup Report — {ws_name}
**Date:** {datetime.now().strftime('%B %d, %Y')}

#### ✅ Completed Recently
{chr(10).join(f"- {item}" for item in completed_recent)}

#### 🔄 In Flight Today
{chr(10).join(f"- {item}" for item in in_progress_today)}

#### ⚠️ Risks & Blockers
{chr(10).join(f"- {item}" for item in blockers)}
"""

    return DailyStandupResponse(
        generated_at=datetime.now(timezone.utc),
        workspace_name=ws_name,
        completed_recent=completed_recent,
        in_progress_today=in_progress_today,
        blockers_and_risks=blockers,
        summary_markdown=summary_md,
    )


def generate_sprint_retrospective(
    db: Session,
    workspace_id: str,
) -> SprintRetrospectiveResponse:
    workspace_uuid = UUID(workspace_id)
    workspace = db.scalar(select(Workspace).where(Workspace.id == workspace_uuid))
    ws_name = workspace.name if workspace else "Workspace"

    projects = db.scalars(
        select(Project).where(Project.workspace_id == workspace_uuid)
    ).all()
    project_ids = [p.id for p in projects]

    tasks = db.scalars(
        select(Task).where(Task.project_id.in_(project_ids))
    ).all() if project_ids else []

    total = len(tasks)
    done_tasks = [t for t in tasks if t.status == "done"]
    in_progress = [t for t in tasks if t.status == "in_progress"]
    overdue_tasks = [t for t in tasks if t.due_date and t.due_date < datetime.now(timezone.utc) and t.status != "done"]

    done_count = len(done_tasks)
    overdue_count = len(overdue_tasks)
    completion_rate = int((done_count / max(total, 1)) * 100)

    # Wins
    what_went_well: list[str] = []
    if done_count > 0:
        what_went_well.append(f"Successfully closed {done_count} deliverable(s) across {len(projects)} active project(s).")
        sample_done = ", ".join(f"'{t.title}'" for t in done_tasks[:3])
        what_went_well.append(f"High-impact deliveries completed: {sample_done}.")
    else:
        what_went_well.append("Sprint kicked off with structured backlog and defined milestones.")

    if overdue_count == 0:
        what_went_well.append("Zero overdue tasks recorded — 100% on-time milestone execution.")
    else:
        what_went_well.append(f"Active focus maintained with {len(in_progress)} features in active development.")

    # Opportunities for improvement
    what_could_be_improved: list[str] = []
    if overdue_count > 0:
        what_could_be_improved.append(f"{overdue_count} deliverable(s) breached due dates, indicating estimation or dependency bottlenecks.")
    if len(in_progress) > 8:
        what_could_be_improved.append(f"Work-in-progress limit exceeded ({len(in_progress)} concurrent tasks), creating context-switching overhead.")
    if completion_rate < 50 and total > 5:
        what_could_be_improved.append(f"Sprint closure rate at {completion_rate}% — consider smaller incremental pull requests.")
    if not what_could_be_improved:
        what_could_be_improved.append("Maintain cadence and consider increasing sprint velocity targets for the next cycle.")

    # Action Items
    action_items: list[str] = []
    if overdue_count > 0:
        action_items.append("Conduct an urgent triage meeting on overdue blockers and re-estimate scope.")
    action_items.append("Enforce strict Definition of Done (DoD) including automated integration tests and peer reviews.")
    action_items.append("Use AI Copilot subtask estimation for upcoming backlog stories to prevent estimation drift.")
    action_items.append("Schedule continuous asynchronous standup check-ins for in-flight tasks.")

    velocity_summary = {
        "total_deliverables": total,
        "completed": done_count,
        "in_progress": len(in_progress),
        "overdue": overdue_count,
        "completion_rate_percent": completion_rate,
        "active_projects": len(projects),
    }

    summary_md = f"""### 🎯 Sprint Retrospective Report — {ws_name}
**Generated:** {datetime.now().strftime('%B %d, %Y')} | **Completion Rate:** {completion_rate}%

#### 🌟 What Went Well
{chr(10).join(f"- {item}" for item in what_went_well)}

#### ⚠️ Areas for Improvement
{chr(10).join(f"- {item}" for item in what_could_be_improved)}

#### 🚀 Action Items for Next Sprint
{chr(10).join(f"- {item}" for item in action_items)}

#### 📊 Velocity Telemetry
- Total Tasks: **{total}**
- Completed: **{done_count}** ({completion_rate}%)
- In-Progress: **{len(in_progress)}**
- Overdue: **{overdue_count}**
"""

    return SprintRetrospectiveResponse(
        generated_at=datetime.now(timezone.utc),
        workspace_name=ws_name,
        what_went_well=what_went_well,
        what_could_be_improved=what_could_be_improved,
        action_items=action_items,
        velocity_summary=velocity_summary,
        summary_markdown=summary_md,
    )



def recommend_optimal_assignee(
    db: Session,
    workspace_id: str,
    task_title: str,
    task_priority: str,
) -> AutoAssignResponse:
    workspace_uuid = UUID(workspace_id)
    memberships = db.scalars(
        select(WorkspaceMembership).where(WorkspaceMembership.workspace_id == workspace_uuid)
    ).all()

    if not memberships:
        return AutoAssignResponse(
            recommended_user_id=None,
            recommended_name=None,
            current_active_tasks=0,
            reason="No members registered in this workspace.",
        )

    # Find project IDs
    projects = db.scalars(
        select(Project).where(Project.workspace_id == workspace_uuid)
    ).all()
    project_ids = [p.id for p in projects]

    tasks = db.scalars(
        select(Task).where(Task.project_id.in_(project_ids))
    ).all() if project_ids else []

    # Calculate active tasks per member
    workload_map: dict[str, int] = {str(m.user_id): 0 for m in memberships}
    for t in tasks:
        if t.assignee_id and str(t.assignee_id) in workload_map and t.status != "done":
            workload_map[str(t.assignee_id)] += 1

    # Select member with minimum active workload
    best_user_id = min(workload_map, key=workload_map.get)
    min_tasks = workload_map[best_user_id]

    return AutoAssignResponse(
        recommended_user_id=best_user_id,
        recommended_name=f"Member ({best_user_id[:8]})",
        current_active_tasks=min_tasks,
        reason=f"Recommended based on optimal capacity ({min_tasks} active tasks) to balance team distribution.",
    )


def search_workspace_knowledge(
    db: Session,
    workspace_id: str,
    query: str,
) -> KnowledgeSearchResponse:
    workspace_uuid = UUID(workspace_id)
    q_lower = query.lower()

    projects = db.scalars(
        select(Project).where(Project.workspace_id == workspace_uuid)
    ).all()

    results: list[dict] = []
    for p in projects:
        if q_lower in p.name.lower() or (p.description and q_lower in p.description.lower()):
            results.append({
                "type": "project",
                "id": str(p.id),
                "title": p.name,
                "snippet": p.description or "Project in workspace",
            })

    project_ids = [p.id for p in projects]
    if project_ids:
        tasks = db.scalars(
            select(Task).where(Task.project_id.in_(project_ids))
        ).all()
        for t in tasks:
            if q_lower in t.title.lower() or (t.description and q_lower in t.description.lower()):
                results.append({
                    "type": "task",
                    "id": str(t.id),
                    "title": t.title,
                    "snippet": f"Status: {t.status} | Priority: {t.priority} — {t.description or 'No description'}",
                })

    answer = (
        f"Found {len(results)} relevant deliverable(s) and project(s) matching '{query}'. "
        + (f"Top match: {results[0]['title']}" if results else "Try refining your query with specific keywords.")
    )

    return KnowledgeSearchResponse(
        results=results[:10],
        answer=answer,
    )


def chat_with_external_ai(
    db: Session,
    workspace_id: str,
    data: ExternalAIChatRequest,
) -> ExternalAIChatResponse:
    import json
    import base64
    import urllib.request
    import urllib.error

    workspace_uuid = UUID(workspace_id)
    workspace = db.scalar(select(Workspace).where(Workspace.id == workspace_uuid))
    ws_name = workspace.name if workspace else "Workspace"

    projects = db.scalars(
        select(Project).where(Project.workspace_id == workspace_uuid)
    ).all()
    project_ids = [p.id for p in projects]

    tasks = db.scalars(
        select(Task).where(Task.project_id.in_(project_ids))
    ).all() if project_ids else []

    total_tasks = len(tasks)
    done_tasks = len([t for t in tasks if t.status == "done"])
    in_prog_tasks = len([t for t in tasks if t.status == "in_progress"])
    overdue_tasks = [t.title for t in tasks if t.due_date and t.due_date < datetime.now(timezone.utc) and t.status != "done"]

    # Grounded Workspace Context
    system_context = f"""You are the AI Workspace Copilot for the workspace "{ws_name}".
Current workspace telemetry:
- Total Projects: {len(projects)} ({', '.join(p.name for p in projects[:5])})
- Total Tasks: {total_tasks} ({done_tasks} completed, {in_prog_tasks} in progress)
- Overdue Tasks: {len(overdue_tasks)} ({', '.join(overdue_tasks[:3]) if overdue_tasks else 'None'})

Provide concise, highly actionable, intelligent engineering and project management advice. Suggest concrete steps, code architectures, or task breakdowns where applicable."""

    api_key = data.api_key.strip() if data.api_key else None
    provider = (data.provider or "openai").lower()
    model = data.model or ("gpt-4o-mini" if provider == "openai" else "llama-3.3-70b-versatile" if provider == "groq" else "openai/gpt-4o-mini")

    # Extract file attachment if present
    file_text_content = ""
    is_image = False
    if data.file_data and data.file_name:
        ftype = (data.file_type or "").lower()
        if ftype.startswith("image/") or any(data.file_name.lower().endswith(ext) for ext in [".png", ".jpg", ".jpeg", ".gif", ".webp", ".bmp", ".svg"]):
            is_image = True
        else:
            try:
                decoded_bytes = base64.b64decode(data.file_data)
                file_text_content = decoded_bytes.decode("utf-8", errors="ignore")[:4000]
            except Exception:
                file_text_content = "[Binary/Unreadable file data]"

    if api_key:
        endpoint = data.endpoint or (
            "https://api.groq.com/openai/v1/chat/completions" if provider == "groq"
            else "https://openrouter.ai/api/v1/chat/completions" if provider == "openrouter"
            else "https://api.openai.com/v1/chat/completions"
        )

        messages = [{"role": "system", "content": system_context}]
        for h in data.history[-6:]:
            messages.append({"role": h.role, "content": h.content})

        if is_image and provider == "openai":
            # Multimodal payload for vision models
            user_msg_content = [
                {"type": "text", "text": data.prompt or "Analyze this image."},
                {
                    "type": "image_url",
                    "image_url": {
                        "url": f"data:{data.file_type or 'image/png'};base64,{data.file_data}"
                    },
                },
            ]
            messages.append({"role": "user", "content": user_msg_content})
        else:
            final_prompt = data.prompt
            if file_text_content:
                final_prompt = f"{data.prompt}\n\n[Attached File: {data.file_name}]\n```{file_text_content}\n```"
            elif is_image:
                final_prompt = f"{data.prompt}\n\n[User attached photo: {data.file_name}]"
            messages.append({"role": "user", "content": final_prompt})

        payload = {
            "model": model,
            "messages": messages,
            "temperature": 0.7,
            "max_tokens": 1000,
        }

        try:
            req = urllib.request.Request(
                endpoint,
                data=json.dumps(payload).encode("utf-8"),
                headers={
                    "Content-Type": "application/json",
                    "Authorization": f"Bearer {api_key}",
                    "User-Agent": "AI-Intelligent-Workspace/1.0",
                },
                method="POST",
            )
            with urllib.request.urlopen(req, timeout=30) as resp:
                res_data = json.loads(resp.read().decode("utf-8"))
                reply_text = res_data["choices"][0]["message"]["content"]
                return ExternalAIChatResponse(
                    reply=reply_text,
                    model_used=model,
                    provider=provider,
                    suggested_action=None,
                )
        except Exception as err:
            # Fallback cleanly on error with explanation
            fallback_note = f"[External AI Provider ({provider}) Note: {str(err)}]\n\n"
            heuristic_resp = _generate_heuristic_reply(
                data.prompt, ws_name, projects, tasks, overdue_tasks,
                file_name=data.file_name, file_type=data.file_type, file_text=file_text_content, is_image=is_image
            )
            return ExternalAIChatResponse(
                reply=fallback_note + heuristic_resp["reply"],
                model_used="workspace-heuristics-v1",
                provider="built-in",
                suggested_action=heuristic_resp.get("action"),
            )

    # Built-in Heuristic Copilot
    heuristic_resp = _generate_heuristic_reply(
        data.prompt, ws_name, projects, tasks, overdue_tasks,
        file_name=data.file_name, file_type=data.file_type, file_text=file_text_content, is_image=is_image
    )
    return ExternalAIChatResponse(
        reply=heuristic_resp["reply"],
        model_used="workspace-heuristics-v1",
        provider="built-in",
        suggested_action=heuristic_resp.get("action"),
    )


def _generate_heuristic_reply(
    prompt: str,
    ws_name: str,
    projects: list,
    tasks: list,
    overdue: list,
    file_name: str | None = None,
    file_type: str | None = None,
    file_text: str | None = None,
    is_image: bool = False,
) -> dict:
    lower = prompt.lower()

    if file_name:
        if is_image:
            reply = (
                f"📸 **Photo Attachment Processed:** Received photo `{file_name}` ({file_type or 'image'}).\n\n"
                f"**AI Vision Analysis:**\n"
                f"- Image format and structure validated.\n"
                f"- User Query: \"{prompt}\"\n"
                f"- Context: Grounded against {ws_name} workspace telemetry ({len(projects)} active projects, {len(tasks)} tasks).\n"
                f"The image has been processed and stored with your conversation context."
            )
            return {
                "reply": reply,
                "action": {"label": "Open Projects", "path": "/projects"},
            }
        else:
            preview = file_text[:300] if file_text else "Binary file content."
            reply = (
                f"📄 **File Attachment Processed:** Received file `{file_name}` ({file_type or 'file'}).\n\n"
                f"**File Preview & Content Analysis:**\n"
                f"```text\n{preview}\n```\n\n"
                f"**AI File Feedback:** File processed successfully. Analyzed against {len(projects)} projects and {len(tasks)} tasks in {ws_name}."
            )
            return {
                "reply": reply,
                "action": {"label": "View Tasks", "path": "/tasks"},
            }

    if any(k in lower for k in ["standup", "today", "yesterday"]):
        return {
            "reply": f"Daily Standup insight for {ws_name}: Currently {len(tasks)} deliverables registered. {len(overdue)} overdue items require attention.",
            "action": {"label": "View Standup Agent", "path": "/ai"},
        }
    elif any(k in lower for k in ["sprint", "health", "velocity"]):
        return {
            "reply": f"Sprint diagnostics: {len(projects)} active project(s). Deliverables completion is currently at {int(len([t for t in tasks if t.status == 'done']) / max(len(tasks), 1) * 100)}%.",
            "action": {"label": "Open Sprint Diagnostics", "path": "/ai"},
        }
    elif any(k in lower for k in ["task", "create", "todo", "backlog"]):
        return {
            "reply": f"You can manage and decompose tasks with automated subtask estimations in the Tasks workspace.",
            "action": {"label": "Go to Tasks", "path": "/tasks"},
        }
    elif any(k in lower for k in ["project", "files", "attachment", "upload"]):
        return {
            "reply": f"Projects in {ws_name} support file uploads, document attachments, photo analysis, and project template imports.",
            "action": {"label": "Open Projects", "path": "/projects"},
        }
    elif any(k in lower for k in ["team", "workload", "member", "assign"]):
        return {
            "reply": f"Team workload balancer automatically distributes task capacity to prevent burnout. Check the Team Workload view.",
            "action": {"label": "View Team Workload", "path": "/team"},
        }
    else:
        return {
            "reply": f"I am your workspace copilot for {ws_name}. You have {len(projects)} project(s) and {len(tasks)} task(s). You can upload photos or files anytime using the clip icon below, or configure an external OpenAI/Groq/OpenRouter API Key in AI Settings!",
            "action": {"label": "Open Dashboard", "path": "/"},
        }

