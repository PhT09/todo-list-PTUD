from fastapi import FastAPI

app = FastAPI()

@app.get("/")
def read_root():
    return {"message": "Chào mừng bạn đến với Todo App API!"}

@app.get("/health")
def health_check():
    return {"status": "ok"}
