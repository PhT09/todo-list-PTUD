from fastapi import FastAPI
from app.routers import todos, auth
from app.core.database import Base, engine
from fastapi.middleware.cors import CORSMiddleware

# Create DB Tables (dev only, migrations preferred)
# Base.metadata.create_all(bind=engine)

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router, prefix="/api/v1")
app.include_router(todos.router, prefix="/api/v1")

@app.get("/")
def read_root():
    return {"message": "Welcome to To-Do API"}
