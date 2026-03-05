# Todo App (Trần Nguyễn Toàn Phát)

A modern, full-stack Todo application built with **FastAPI** (Backend) and **React** (Frontend). This project demonstrates a layered architecture, secure authentication, advanced task management features, and a polished user interface.

![Tech Stack](https://img.shields.io/badge/Tech-FastAPI%20%7C%20React%20%7C%20SQLite-blue)
![Status](https://img.shields.io/badge/Status-Complete-green)

---

## Key Features

This application implements all 7 levels of the project requirements:

*   **User Authentication:** Secure Registration & Login flow using JWT (JSON Web Tokens) and bcrypt password hashing. Users can only access their own data.
*   **Task Management (CRUD):** Create, Read, Update, and Delete todos seamlessly.
*   **Smart Filtering & Sorting:**
    *   Filter by Status (Active, Completed), Date (Today, Overdue).
    *   Sort by Creation Date (Newest/Oldest).
*   **Tag System:** Organize tasks with color-coded tags (Priority, Work, Personal, etc.).
*   **Deadlines:** Set due dates and visualize overdue items.
*   **Soft Delete & Trash Bin:** Deleted tasks go to a "Trash Bin" first. They can be **Restored** or **Permanently Deleted**.
*   **Pagination:** Efficiently handles large lists with server-side pagination.
*   **ResponsiveUI:** Beautiful, glassmorphism-inspired design using vanilla CSS.

---

## Architecture

The project follows a **Layered Architecture** to ensure separation of concerns and maintainability:

### Backend (`app/`)
*   **Routers (`routers/`):** Handle HTTP requests and define API endpoints.
*   **Services (`services/`):** Contain business logic (e.g., authentication, task processing).
*   **Repositories (`repositories/`):** Abstraction layer for direct database interactions using SQLAlchemy.
*   **Models (`models/`):** Database schema definitions.
*   **Schemas (`schemas/`):** Pydantic models for request/response validation.

### Frontend (`frontend/`)
*   **Components:** Reusable UI blocks (TodoList, TodoItem, TrashManager, etc.).
*   **Context:** Global state management (AuthContext).
*   **API:** Centralized API client using `axios`.

---

## Installation & Setup

Follow these steps to run the application locally.

### Prerequisites
*   **Python 3.9+**
*   **Node.js 16+**

### 1. Backend Setup

```bash
# Clone the repository
git clone -b main https://github.com/PhT09/todo-list-PTUD.git todo-app
cd todo-app

# Create a virtual environment
python -m venv venv

# Activate virtual environment
# Windows:
venv\Scripts\activate
# Mac/Linux:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Initialize Database (Migrations)
python -m alembic upgrade head

# (Optional) Seed Example Data
python seed_data.py

# Start the Server
uvicorn app.main:app --reload

# (Optional) Start the Server with Docker
docker compose up --build
```
*Backend runs at: `http://localhost:8000`*

### 2. Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Start the Dev Server
npm run dev
```
*Frontend runs at: `http://localhost:5173` (or similar)*

---

## Reviewer Guide (Example Account)

To quickly test all features without manual setup, use the seeded "Reviewer" account:

| Role | Email | Password |
| :--- | :--- | :--- |
| **Reviewer** | `gv_review@example.com` | `ReviewPassword123` |

**What to verify:**
1.  **Login:** Use the credentials above.
2.  **Dashboard:** Notice tasks with different tags and statuses. (develop)
3.  **Filters:** Try clicking "Trễ hạn" (Overdue) or "Hôm nay" (Today).
4.  **Pagination:** Scroll down to see pagination controls (if tasks > 5).
5.  **Trash Bin:** Click "Thùng Rác" in the user bar to view, restore, or delete soft-deleted items.
6.  **Search:** Use the search bar to find specific tasks.

---


## Security Note
This project uses **OAuth2 with Password Flow** and **JWT** access tokens. All sensitive data (passwords) is hashed using `bcrypt` before storage. Middleware ensures that `deleted_at` filters are applied automatically to prevent data leaks.

---
