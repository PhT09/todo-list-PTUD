
import sys
import os
from datetime import datetime, timezone, timedelta

# Add the parent directory to sys.path to import app modules
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy.orm import Session
from app.core.database import SessionLocal, engine
from app.models.user import User
from app.models.todo import Todo
from app.models.tag import Tag
from app.core.security import get_password_hash

def utc_now():
    return datetime.now(timezone.utc).replace(tzinfo=None)

def seed_data():
    db: Session = SessionLocal()
    try:
        email = "gv_review@example.com"
        password = "ReviewPassword123"
        
        # 1. Cleanup existing review user
        existing_user = db.query(User).filter(User.email == email).first()
        if existing_user:
            print(f"Cleaning up existing user: {email}")
            db.query(Tag).filter(Tag.owner_id == existing_user.id).delete()
            db.query(Todo).filter(Todo.owner_id == existing_user.id).delete()
            db.delete(existing_user)
            db.commit()

        # 2. Create User
        print(f"Creating user: {email}")
        hashed_password = get_password_hash(password)
        user = User(email=email, hashed_password=hashed_password, is_active=True)
        db.add(user)
        db.commit()
        db.refresh(user)

        # 3. Create Tags
        tags_data = [
            {"name": "Priority", "color": "#ef4444"},  # Red
            {"name": "Important", "color": "#f97316"}, # Orange
            {"name": "Work", "color": "#3b82f6"},      # Blue
            {"name": "Personal", "color": "#22c55e"},  # Green
        ]
        
        tags = {}
        for t_data in tags_data:
            tag = Tag(name=t_data["name"], color=t_data["color"], owner_id=user.id)
            db.add(tag)
            db.commit()
            db.refresh(tag)
            tags[t_data["name"]] = tag
            
        print("Created tags: Priority, Important, Work, Personal")

        # 4. Create Todos
        todos = []
        now = utc_now()
        yesterday = now - timedelta(days=1)
        tomorrow = now + timedelta(days=1)
        next_week = now + timedelta(days=7)

        # -- Overdue Tasks (3) --
        todos.append(Todo(
            title="Update Project Documentation (Overdue)",
            description="Complete the documentation for the previous sprint. This is critically late.",
            owner_id=user.id,
            due_date=yesterday,
            is_done=False,
            tags=[tags["Priority"], tags["Work"]]
        ))
        todos.append(Todo(
            title="Submit Expense Report",
            description="Expenses for business trip last week.",
            owner_id=user.id,
            due_date=yesterday,
            is_done=False,
            tags=[tags["Work"]]
        ))
        todos.append(Todo(
            title="Call Client - Emergency",
            description="Client server is down.",
            owner_id=user.id,
            due_date=yesterday - timedelta(hours=5),
            is_done=False,
            tags=[tags["Priority"], tags["Important"]]
        ))

        # -- Today Tasks (3) --
        todos.append(Todo(
            title="Team Meeting at 2 PM",
            description="Discuss the roadmap for Q3.",
            owner_id=user.id,
            due_date=now + timedelta(hours=4), # Later today
            is_done=False,
            tags=[tags["Work"]]
        ))
        todos.append(Todo(
            title="Buy Groceries",
            description="Milk, eggs, bread.",
            owner_id=user.id,
            due_date=now + timedelta(hours=6),
            is_done=False,
            tags=[tags["Personal"]]
        ))
        todos.append(Todo(
            title="Review Pull Requests",
            description="Check the new feature branch.",
            owner_id=user.id,
            due_date=now + timedelta(hours=2),
            is_done=False,
            tags=[tags["Work"], tags["Important"]]
        ))

        # -- Active Tasks (Future) (5) --
        todos.append(Todo(
            title="Plan Weekend Trip",
            description="Look for hotels and flights.",
            owner_id=user.id,
            due_date=next_week,
            is_done=False,
            tags=[tags["Personal"]]
        ))
        todos.append(Todo(
            title="Prepare Presentation Slides",
            description="For the conference next month.",
            owner_id=user.id,
            due_date=tomorrow,
            is_done=False,
            tags=[tags["Work"]]
        ))
        todos.append(Todo(
            title="Read 'Clean Code'",
            description="Finish chapter 5.",
            owner_id=user.id,
            due_date=next_week,
            is_done=False,
            tags=[tags["Personal"]]
        ))
        todos.append(Todo(
            title="Backup Database",
            description="Routine maintenance.",
            owner_id=user.id,
            due_date=next_week,
            is_done=False,
            tags=[tags["Work"], tags["Priority"]]
        ))
        todos.append(Todo(
            title="Update Resume",
            description="Add recent project experience.",
            owner_id=user.id,
            due_date=tomorrow + timedelta(days=2),
            is_done=False,
            tags=[tags["Personal"]]
        ))

        # -- Completed Tasks (5) --
        todos.append(Todo(
            title="Setup Environment",
            description="Install Python, Node, VS Code.",
            owner_id=user.id,
            is_done=True,
            tags=[tags["Work"]]
        ))
        todos.append(Todo(
            title="Initial Migration",
            description="Run alembic init.",
            owner_id=user.id,
            is_done=True,
            tags=[tags["Work"]]
        ))
        todos.append(Todo(
            title="Buy Coffee",
            description="Espresso roast.",
            owner_id=user.id,
            is_done=True,
            tags=[tags["Personal"]]
        ))
        todos.append(Todo(
            title="Email Manager",
            description="Regarding PTO request.",
            owner_id=user.id,
            is_done=True,
            tags=[tags["Work"]]
        ))
        todos.append(Todo(
            title="Clean Desk",
            description="Organize cables.",
            owner_id=user.id,
            is_done=True,
            tags=[tags["Personal"]]
        ))

        # -- Soft Deleted Tasks (4) --
        deleted_todos = [
            Todo(
                title="Deprecated Feature X",
                description="We decided not to ship this.",
                owner_id=user.id,
                deleted_at=yesterday,
                is_done=False
            ),
             Todo(
                title="Mistake Task",
                description="Created by accident.",
                owner_id=user.id,
                deleted_at=now,
                is_done=False
            ),
             Todo(
                title="Old Idea",
                description="Not relevant anymore.",
                owner_id=user.id,
                deleted_at=yesterday - timedelta(days=2),
                is_done=True
            ),
             Todo(
                title="Duplicate Task",
                description="Duplicate of #10.",
                owner_id=user.id,
                deleted_at=now,
                is_done=False
            )
        ]

        # Add all to session
        print("Adding tasks...")
        for todo in todos:
            db.add(todo)
        
        for d_todo in deleted_todos:
            db.add(d_todo)
            
        db.commit()
        print(f"Successfully seeded data for {email}")
        print(f"- Active/Future: 5")
        print(f"- Overdue: 3")
        print(f"- Today: 3")
        print(f"- Completed: 5")
        print(f"- Trash: 4")
        print(f"Total visible items (for pagination check): {5+3+3+5} = 16 items")

    except Exception as e:
        print(f"Error seeding data: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    seed_data()
