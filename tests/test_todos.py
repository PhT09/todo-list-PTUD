from fastapi.testclient import TestClient
from datetime import datetime, timedelta, timezone

def test_create_todo_success(client: TestClient):
    # Setup - Create user and login
    client.post("/api/v1/auth/register", json={"email": "todo@test.com", "password": "pass"})
    login_res = client.post("/api/v1/auth/login", data={"username": "todo@test.com", "password": "pass"})
    token = login_res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # Test
    response = client.post(
        "/api/v1/todos",
        json={"title": "Test Todo", "description": "Desc"},
        headers=headers
    )
    assert response.status_code == 201
    data = response.json()
    assert data["title"] == "Test Todo"
    assert data["owner_id"] is not None

def test_create_todo_validation_fail(client: TestClient):
    # Setup - Create user and login
    client.post("/api/v1/auth/register", json={"email": "fail@test.com", "password": "pass"})
    login_res = client.post("/api/v1/auth/login", data={"username": "fail@test.com", "password": "pass"})
    token = login_res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # Helper function to test POST
    def post_todo(payload):
        return client.post("/api/v1/todos", json=payload, headers=headers)

    # Test Empty Title (min_length=3 in schema)
    response = post_todo({"title": ""})
    assert response.status_code == 422

    # Test Short Title
    response = post_todo({"title": "Hi"})
    assert response.status_code == 422

def test_create_todo_past_deadline(client: TestClient):
    # Setup - Create user and login
    client.post("/api/v1/auth/register", json={"email": "deadline@test.com", "password": "pass"})
    login_res = client.post("/api/v1/auth/login", data={"username": "deadline@test.com", "password": "pass"})
    token = login_res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # Past Date
    past_date = (datetime.now(timezone.utc) - timedelta(days=1)).isoformat()
    response = client.post(
        "/api/v1/todos",
        json={"title": "Past Due", "due_date": past_date},
        headers=headers
    )
    assert response.status_code == 400
    assert "Deadline phải sau thời điểm hiện tại" in response.json()["detail"]

def test_get_todos_ownership(client: TestClient):
    # Setup - User A
    client.post("/api/v1/auth/register", json={"email": "userA@test.com", "password": "pass"})
    tokenA = client.post("/api/v1/auth/login", data={"username": "userA@test.com", "password": "pass"}).json()["access_token"]
    headersA = {"Authorization": f"Bearer {tokenA}"}
    client.post("/api/v1/todos", json={"title": "User A Todo"}, headers=headersA)

    # Setup - User B
    client.post("/api/v1/auth/register", json={"email": "userB@test.com", "password": "pass"})
    tokenB = client.post("/api/v1/auth/login", data={"username": "userB@test.com", "password": "pass"}).json()["access_token"]
    headersB = {"Authorization": f"Bearer {tokenB}"}
    
    # Test User B cannot see User A's todo
    response = client.get("/api/v1/todos", headers=headersB)
    assert response.status_code == 200
    items = response.json()["items"]
    assert len(items) == 0  # Should be empty for User B

    # Test User A can see their todo
    response = client.get("/api/v1/todos", headers=headersA)
    assert len(response.json()["items"]) == 1

def test_404_not_found(client: TestClient):
    # Setup
    client.post("/api/v1/auth/register", json={"email": "404@test.com", "password": "pass"})
    token = client.post("/api/v1/auth/login", data={"username": "404@test.com", "password": "pass"}).json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # Test Invalid ID
    response = client.get("/api/v1/todos/99999", headers=headers)
    assert response.status_code == 404
