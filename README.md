# 📝 To-Do List Application (Level 7)

A fully-featured To-Do List application built with **FastAPI** (Backend) and **React** (Frontend). This project demonstrates a production-ready architecture with JWT authentication, data ownership, advanced task management (tags, deadlines), automated testing, and containerization.

## 🚀 Key Features

* **Secure Authentication**: User registration and login with JWT access tokens.
* **Data Ownership**: Users can only access and manage their own tasks and tags.
* **Task Management**: Create, read, update, delete (CRUD) tasks.
* **Advanced Features**:
  * **Deadlines & Overdue Tracking**: Set due dates; automatically flag overdue tasks.
  * **Tagging System**: Organize tasks with custom colorful tags.
  * **Smart Filters**: View "Today's Tasks" and "Overdue Tasks" quickly.
* **Robust Backend**: Built on FastAPI with SQLAlchemy ORM and Pydantic validation.
* **Modern Frontend**: React with Vite, Axios, and responsive CSS.
* **Quality Assurance**: Automated integration tests with `pytest`.
* **Deployment Ready**: Dockerized with `docker-compose`.

## 🛠️ Technology Stack

* **Backend**: Python 3.12, FastAPI, SQLAlchemy, SQLite, Alembic, Pytest.
* **Frontend**: React 18, Vite, Javascript (ES6+), CSS3.
* **Containerization**: Docker, Docker Compose.

## 📦 Prerequisites

* **Python 3.10+** (if running locally without Docker)
* **Node.js 18+** (for frontend)
* **Docker & Docker Compose** (optional but recommended)

## ⚡ Installation & Setup

### Option 1: Running with Docker (Recommended for Backend)

1. **Clone the repository:**

    ```bash
    git clone https://github.com/your-username/todo-app.git
    cd todo-app
    ```

2. **Start the Backend:**

    ```bash
    docker-compose up --build
    ```

    The API will be available at `http://localhost:8000`.
    Documentation: `http://localhost:8000/docs`.

3. **Start the Frontend (Local for now):**
    Open a new terminal:

    ```bash
    cd frontend
    npm install
    npm run dev
    ```

    Access the UI at `http://localhost:5173`.

### Option 2: Running Locally (Manual)

#### Backend Setup

1. **Create virtual environment:**

    ```bash
    python -m venv venv
    source venv/bin/activate  # Linux/Mac
    .\venv\Scripts\activate   # Windows
    ```

2. **Install dependencies:**

    ```bash
    pip install -r requirements.txt
    ```

3. **Run Migrations:**

    ```bash
    alembic upgrade head
    ```

4. **Start Server:**

    ```bash
    uvicorn app.main:app --reload
    ```

#### Frontend Setup

1. **Navigate to frontend directory:**

    ```bash
    cd frontend
    ```

2. **Install & Run:**

    ```bash
    npm install
    npm run dev
    ```

## 🧪 Automated Testing

Run the integration test suite using `pytest`:

```bash
# Make sure your virtual environment is activated
pytest
```

* Verifies Authentication flows (Register/Login).
* Validates Data Integrity and Ownership.
* Checks Validation Logic (e.g., past due dates).

## 📚 API Documentation

Once the backend is running, visit:

* **Swagger UI**: `http://localhost:8000/docs`
* **ReDoc**: `http://localhost:8000/redoc`

## 📂 Project Structure

```
todo-app/
├── alembic/              # Database migrations
├── app/
│   ├── api/              # API dependencies
│   ├── core/             # Config & Database setup
│   ├── models/           # SQLAlchemy Data Models
│   ├── repositories/     # Data Access Layer
│   ├── routers/          # API Endpoints
│   ├── schemas/          # Pydantic Schemas
│   ├── services/         # Business Logic Layer
│   └── main.py           # App Entrypoint
├── tests/                # Automated Tests
├── frontend/             # React Application
├── Dockerfile            # Docker configuration
├── docker-compose.yml    # Docker Compose setup
├── requirements.txt      # Python dependencies
└── README.md             # Project Documentation
```
