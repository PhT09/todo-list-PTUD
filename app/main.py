from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .core.config import settings
from .routers import todos

app = FastAPI(
    title=settings.APP_NAME,
    version=settings.API_VERSION,
    debug=settings.DEBUG
)

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include Routers with Prefix /api/v1
# Endpoint todos: /api/v1/todos
app.include_router(todos.router, prefix=f"/api/{settings.API_VERSION}", tags=["todos"])

@app.get("/health")
def health_check():
    return {"status": "ok", "version": settings.API_VERSION}

@app.get("/")
def root():
    return {"message": "Welcome to Todo API. Documentation at /docs"}
