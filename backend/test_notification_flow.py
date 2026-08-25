import urllib.request
import json
from uuid import uuid4
from app.core.security import create_access_token
from app.core.database import SessionLocal
from app.models.user import User
from app.models.workspace import Workspace
from app.models.project import Project
from sqlalchemy import select

def test_notifications():
    db = SessionLocal()
    user = db.scalar(select(User))
    ws = db.scalar(select(Workspace))
    project = db.scalar(select(Project).where(Project.workspace_id == ws.id))

    if not user or not ws:
        print("[FAIL] Missing user or workspace.")
        return

    # If no project exists, create one for the test
    if not project:
        from app.schemas.project import ProjectCreate
        from app.services.project import create_project
        project = create_project(db, str(ws.id), str(user.id), ProjectCreate(name="Notification Test Project"))

    token = create_access_token(str(user.id))
    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json"
    }

    print("=" * 65)
    print("LIVE NOTIFICATION END-TO-END VERIFICATION TEST")
    print("=" * 65)
    print(f"Testing User: {user.email} (ID: {user.id})")
    print(f"Testing Workspace: {ws.name} (ID: {ws.id})")
    print(f"Testing Project: {project.name} (ID: {project.id})")
    print("-" * 65)

    # 1. Check initial unread count
    req = urllib.request.Request("http://127.0.0.1:8000/api/v1/notifications/unread-count", headers=headers)
    with urllib.request.urlopen(req) as resp:
        body = json.loads(resp.read().decode("utf-8"))
        initial_unread = body.get("count", 0)
        print(f"STEP 1: Initial unread notifications count: {initial_unread}")

    # 2. Create a task assigned to current user -> triggers task_assigned notification
    create_task_url = f"http://127.0.0.1:8000/api/v1/workspaces/{ws.id}/projects/{project.id}/tasks"
    task_payload = json.dumps({
        "title": "Live Notification Test Task",
        "description": "Testing notification triggers",
        "assignee_id": str(user.id),
        "status": "todo",
        "priority": "high"
    }).encode("utf-8")

    req_task = urllib.request.Request(create_task_url, data=task_payload, headers=headers, method="POST")
    with urllib.request.urlopen(req_task) as resp:
        task_body = json.loads(resp.read().decode("utf-8"))
        task_id = task_body["id"]
        print(f"STEP 2: Created assigned task -> Task ID: {task_id}")

    # 3. Change task status -> triggers status_changed notification
    patch_task_url = f"http://127.0.0.1:8000/api/v1/workspaces/{ws.id}/projects/{project.id}/tasks/{task_id}"
    status_payload = json.dumps({
        "status": "in_progress"
    }).encode("utf-8")
    req_status = urllib.request.Request(patch_task_url, data=status_payload, headers=headers, method="PATCH")
    with urllib.request.urlopen(req_status) as resp:
        print("STEP 3: Updated task status to 'in_progress' (triggers status_changed notification)")

    # 4. Fetch notifications list via HTTP GET
    list_url = "http://127.0.0.1:8000/api/v1/notifications?filter=all&page=1&page_size=10"
    req_list = urllib.request.Request(list_url, headers=headers)
    with urllib.request.urlopen(req_list) as resp:
        list_body = json.loads(resp.read().decode("utf-8"))
        items = list_body.get("items", [])
        total = list_body.get("total", 0)
        unread_count = list_body.get("unread_count", 0)
        print(f"STEP 4: Fetched notification list -> Total: {total}, Unread: {unread_count}")
        print("   Recent notifications received:")
        for idx, item in enumerate(items[:3], 1):
            print(f"   [{idx}] ID: {item['id']} | Type: {item['type']} | Title: '{item['title']}' | Message: '{item['message']}' | Is Read: {item['is_read']}")

        assert len(items) > 0, "No notifications found!"
        first_notif = items[0]
        notif_id = first_notif["id"]

    # 5. Mark single notification as read
    read_url = f"http://127.0.0.1:8000/api/v1/notifications/{notif_id}/read"
    req_read = urllib.request.Request(read_url, data=b"{}", headers=headers, method="PATCH")
    with urllib.request.urlopen(req_read) as resp:
        read_body = json.loads(resp.read().decode("utf-8"))
        print(f"STEP 5: Marked notification {notif_id} as read -> is_read: {read_body.get('is_read')}")
        assert read_body.get("is_read") is True

    # 6. Mark all notifications as read
    read_all_url = "http://127.0.0.1:8000/api/v1/notifications/read-all"
    req_read_all = urllib.request.Request(read_all_url, data=b"{}", headers=headers, method="PATCH")
    with urllib.request.urlopen(req_read_all) as resp:
        read_all_body = json.loads(resp.read().decode("utf-8"))
        print(f"STEP 6: Marked all as read -> updated_count: {read_all_body.get('updated_count')}")

    # 7. Check final unread count is 0
    with urllib.request.urlopen(req) as resp:
        body = json.loads(resp.read().decode("utf-8"))
        final_unread = body.get("count", 0)
        print(f"STEP 7: Final unread count: {final_unread}")
        assert final_unread == 0

    # 8. Clean up created task
    del_task_url = f"http://127.0.0.1:8000/api/v1/workspaces/{ws.id}/projects/{project.id}/tasks/{task_id}"
    del_req = urllib.request.Request(del_task_url, headers=headers, method="DELETE")
    with urllib.request.urlopen(del_req) as resp:
        print(f"STEP 8: Cleaned up test task {task_id}")

    print("=" * 65)
    print("ALL NOTIFICATION RECEIVE & MANAGEMENT TESTS PASSED 100%!")
    print("=" * 65)
    db.close()

if __name__ == "__main__":
    test_notifications()
