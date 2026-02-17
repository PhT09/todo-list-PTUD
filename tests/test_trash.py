from fastapi.testclient import TestClient
from sqlalchemy.orm import Session
from app.models.todo import Todo

def test_soft_delete_flow(client: TestClient, db: Session):
    # 1. Register and Login
    client.post("/api/v1/auth/register", json={"email": "trash@test.com", "password": "pass"})
    login_res = client.post("/api/v1/auth/login", data={"username": "trash@test.com", "password": "pass"})
    token = login_res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # 2. Create Todo
    res = client.post("/api/v1/todos", json={"title": "To be deleted"}, headers=headers)
    todo_id = res.json()["id"]

    # 3. Soft Delete
    del_res = client.delete(f"/api/v1/todos/{todo_id}", headers=headers)
    assert del_res.status_code == 200

    # 4. Verify gone from main list
    list_res = client.get("/api/v1/todos", headers=headers)
    items = list_res.json()["items"]
    assert not any(t["id"] == todo_id for t in items)

    # 5. Verify in Trash
    trash_res = client.get("/api/v1/todos/trash", headers=headers)
    trash_items = trash_res.json()
    assert any(t["id"] == todo_id for t in trash_items)
    deleted_item = next(t for t in trash_items if t["id"] == todo_id)
    assert deleted_item["deleted_at"] is not None

    # 6. Restore
    restore_res = client.post(f"/api/v1/todos/{todo_id}/restore", headers=headers)
    assert restore_res.status_code == 200

    # 7. Verify back in main list
    list_res_2 = client.get("/api/v1/todos", headers=headers)
    items_2 = list_res_2.json()["items"]
    assert any(t["id"] == todo_id for t in items_2)

    # 8. Verify gone from Trash
    trash_res_2 = client.get("/api/v1/todos/trash", headers=headers)
    assert not any(t["id"] == todo_id for t in trash_res_2.json())

def test_permanent_delete(client: TestClient):
    # Setup
    client.post("/api/v1/auth/register", json={"email": "perm@test.com", "password": "pass"})
    login_res = client.post("/api/v1/auth/login", data={"username": "perm@test.com", "password": "pass"})
    headers = {"Authorization": f"Bearer {login_res.json()['access_token']}"}
    
    res = client.post("/api/v1/todos", json={"title": "Perm Delete"}, headers=headers)
    todo_id = res.json()["id"]

    # Soft delete first
    client.delete(f"/api/v1/todos/{todo_id}", headers=headers)

    # Permanent delete
    perm_res = client.delete(f"/api/v1/todos/{todo_id}/permanent", headers=headers)
    assert perm_res.status_code == 200

    # Verify completely gone
    trash_res = client.get("/api/v1/todos/trash", headers=headers)
    assert not any(t["id"] == todo_id for t in trash_res.json())
