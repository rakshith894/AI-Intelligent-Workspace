import uuid
from sqlalchemy import select, text
from app.core.database import SessionLocal
from app.models.user import User
from app.models.workspace import Workspace
from app.models.project import Project
from app.schemas.project import ProjectCreate, ProjectUpdate
from app.services.project import create_project, update_project, get_project, get_projects

def run_test():
    db = SessionLocal()
    print("=" * 65)
    print("RUNNING LIVE DATABASE PERSISTENCE TEST FOR PROJECT URLS")
    print("=" * 65)

    user = db.scalar(select(User))
    ws = db.scalar(select(Workspace))

    if not user or not ws:
        print("[FAIL] No user or workspace found in database.")
        return

    print(f"Using Workspace: '{ws.name}' (ID: {ws.id})")
    print(f"Using User: '{user.email}' (ID: {user.id})")
    print("-" * 65)

    # 1. CREATE PROJECT WITH RAW URL
    print("STEP 1: Creating project with raw URL: 'github.com/torvalds/linux.git'...")
    create_data = ProjectCreate(
        name="Linux Kernel Mirror",
        description="Automated test project for URL saving verification",
        project_url="github.com/torvalds/linux.git"
    )
    created_proj = create_project(db, str(ws.id), str(user.id), create_data)
    test_proj_id = created_proj.id
    print(f"  -> Created Project ID: {test_proj_id}")
    print(f"  -> Returned Project URL in memory: {created_proj.project_url}")

    # 2. VERIFY PERSISTENCE DIRECTLY FROM RAW SQL IN DATABASE
    print("-" * 65)
    print("STEP 2: Querying raw PostgreSQL database table directly via SQL...")
    row = db.execute(
        text("SELECT id, name, project_url, created_at, updated_at FROM projects WHERE id = :pid"),
        {"pid": test_proj_id}
    ).fetchone()

    print(f"  -> Raw DB Record: id={row[0]}, name='{row[1]}', project_url='{row[2]}'")
    assert row is not None, "Project record was not found in database!"
    assert row[2] == "https://github.com/torvalds/linux", f"Unexpected URL in DB: {row[2]}"
    print(f"  -> [PASSED] URL correctly persisted in PostgreSQL as: {row[2]}")

    # 3. UPDATE PROJECT URL
    print("-" * 65)
    print("STEP 3: Updating project URL to: 'https://my-live-app.vercel.app'...")
    update_data = ProjectUpdate(
        project_url="https://my-live-app.vercel.app"
    )
    updated_proj = update_project(db, created_proj, update_data)

    # 4. VERIFY UPDATE PERSISTENCE DIRECTLY IN DATABASE
    print("-" * 65)
    print("STEP 4: Querying raw PostgreSQL database after update...")
    row_updated = db.execute(
        text("SELECT id, name, project_url, updated_at FROM projects WHERE id = :pid"),
        {"pid": test_proj_id}
    ).fetchone()

    print(f"  -> Raw DB Record: project_url='{row_updated[2]}'")
    assert row_updated[2] == "https://my-live-app.vercel.app", f"Unexpected URL in DB after update: {row_updated[2]}"
    print(f"  -> [PASSED] Updated URL correctly persisted in PostgreSQL as: {row_updated[2]}")

    # 5. VERIFY FETCH VIA get_project() SERVICE
    print("-" * 65)
    print("STEP 5: Verifying retrieval via get_project() service...")
    fetched = get_project(db, str(ws.id), str(test_proj_id))
    assert fetched is not None
    assert fetched.project_url == "https://my-live-app.vercel.app"
    print(f"  -> [PASSED] get_project() correctly retrieved URL: {fetched.project_url}")

    # 6. VERIFY CLEARING URL WITH NONE
    print("-" * 65)
    print("STEP 6: Clearing project URL with null/None...")
    clear_data = ProjectUpdate(project_url=None)
    cleared_proj = update_project(db, created_proj, clear_data)
    row_cleared = db.execute(
        text("SELECT id, name, project_url FROM projects WHERE id = :pid"),
        {"pid": test_proj_id}
    ).fetchone()
    assert row_cleared[2] is None, f"Expected None in DB, got: {row_cleared[2]}"
    print(f"  -> [PASSED] Cleared URL verified in DB as: {row_cleared[2]}")

    # 7. CLEANUP
    print("-" * 65)
    print("STEP 7: Cleaning up test project record...")
    db.execute(text("DELETE FROM projects WHERE id = :pid"), {"pid": test_proj_id})
    db.commit()
    print("  -> [PASSED] Test record cleaned up.")

    print("=" * 65)
    print("ALL URL PERSISTENCE & RETRIEVAL TESTS PASSED 100%!")
    print("=" * 65)
    db.close()

if __name__ == "__main__":
    run_test()
