"""
Analytics Repository - Data access layer for productivity analytics.
Queries completed tasks within date ranges for charting and reporting.
"""

from typing import List, Optional
from datetime import datetime
from sqlalchemy.orm import Session
from sqlalchemy import and_, func
from fastapi import Depends

from ..models.todo import Todo
from ..core.database import get_db


class AnalyticsRepository:
    def __init__(self, db: Session):
        self.db = db

    def get_completed_tasks_in_range(
        self,
        owner_id: int,
        start_date: datetime,
        end_date: datetime,
    ) -> List[Todo]:
        """
        Get all completed tasks for an owner where completed_at
        falls within [start_date, end_date].
        """
        return self.db.query(Todo).filter(
            Todo.owner_id == owner_id,
            Todo.is_done == True,
            Todo.completed_at != None,
            Todo.completed_at >= start_date,
            Todo.completed_at <= end_date,
        ).order_by(Todo.completed_at).all()

    def get_total_completed_count(
        self,
        owner_id: int,
        start_date: datetime,
        end_date: datetime,
    ) -> int:
        """Count of completed tasks in the date range."""
        return self.db.query(func.count(Todo.id)).filter(
            Todo.owner_id == owner_id,
            Todo.is_done == True,
            Todo.completed_at != None,
            Todo.completed_at >= start_date,
            Todo.completed_at <= end_date,
        ).scalar() or 0

    def get_average_score(
        self,
        owner_id: int,
        start_date: datetime,
        end_date: datetime,
    ) -> float:
        """Average productivity score for completed tasks in the range."""
        result = self.db.query(func.avg(Todo.productivity_score)).filter(
            Todo.owner_id == owner_id,
            Todo.is_done == True,
            Todo.completed_at != None,
            Todo.productivity_score != None,
            Todo.completed_at >= start_date,
            Todo.completed_at <= end_date,
        ).scalar()
        return round(result, 2) if result else 0.0


# Dependency Injection Helper
def get_analytics_repo(db: Session = Depends(get_db)) -> AnalyticsRepository:
    return AnalyticsRepository(db)
