import uvicorn
from app.main import app

# This entry point redirects to the actual FastAPI app in app/main.py
# Run with: uvicorn main:app --reload

if __name__ == "__main__":
    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=True)
