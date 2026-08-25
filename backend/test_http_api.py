import urllib.request
import json
from app.core.security import create_access_token
from app.core.database import SessionLocal
from app.models.user import User
from app.models.workspace import Workspace
from sqlalchemy import select

def test_live_http():
    db = SessionLocal()
    user = db.scalar(select(User))
    ws = db.scalar(select(Workspace))

    if not user or not ws:
        print("[FAIL] No user/workspace found.")
        return

    token = create_access_token(str(user.id))
    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json"
    }

    print("=" * 65)
    print("TESTING LIVE FASTAPI SERVER OVER HTTP (PORT 8000)")
    print("=" * 65)

    # 1. CREATE PROJECT OVER HTTP
    url = f"http://127.0.0.1:8000/api/v1/workspaces/{ws.id}/projects"
    payload = json.dumps({
        "name": "Live HTTP Test Project",
        "project_url": "github.com/torvalds/linux"
    }).encode("utf-8")

    req = urllib.request.Request(url, data=payload, headers=headers, method="POST")
    with urllib.request.urlopen(req) as resp:
        body = json.loads(resp.read().decode("utf-8"))
        print(f"1. POST {url} -> Status {resp.status}")
        print(f"   Saved project_url: '{body.get('project_url')}'")
        assert body.get("project_url") == "https://github.com/torvalds/linux"
        project_id = body["id"]

    # 2. UPDATE PROJECT URL OVER HTTP
    patch_url = f"http://127.0.0.1:8000/api/v1/workspaces/{ws.id}/projects/{project_id}"
    patch_payload = json.dumps({
        "project_url": "https://my-app.vercel.app"
    }).encode("utf-8")

    patch_req = urllib.request.Request(patch_url, data=patch_payload, headers=headers, method="PATCH")
    with urllib.request.urlopen(patch_req) as resp:
        body = json.loads(resp.read().decode("utf-8"))
        print(f"2. PATCH {patch_url} -> Status {resp.status}")
        print(f"   Updated project_url: '{body.get('project_url')}'")
        assert body.get("project_url") == "https://my-app.vercel.app"

    # 3. GET PROJECT OVER HTTP
    get_req = urllib.request.Request(patch_url, headers=headers, method="GET")
    with urllib.request.urlopen(get_req) as resp:
        body = json.loads(resp.read().decode("utf-8"))
        print(f"3. GET {patch_url} -> Status {resp.status}")
        print(f"   Fetched project_url: '{body.get('project_url')}'")
        assert body.get("project_url") == "https://my-app.vercel.app"

    # 4. DELETE PROJECT OVER HTTP
    del_req = urllib.request.Request(patch_url, headers=headers, method="DELETE")
    with urllib.request.urlopen(del_req) as resp:
        print(f"4. DELETE {patch_url} -> Status {resp.status}")

    print("=" * 65)
    print("ALL REAL HTTP NETWORK TESTS PASSED SUCCESSFULLY!")
    print("=" * 65)
    db.close()

if __name__ == "__main__":
    test_live_http()
