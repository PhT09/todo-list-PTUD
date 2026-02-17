from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker

# Persistent SQLite database at ./todo_app.db
SQLALCHEMY_DATABASE_URL = "sqlite:///./todo_app.db"

# Engine setup
engine = create_engine(
    SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False}
)

# Session factory
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Base model for ORM
Base = declarative_base()

# Dependency to provide a database session
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
