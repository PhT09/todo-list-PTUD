"""
Analytics Repository - Data access layer for productivity analytics.
Queries tasks within date ranges for charting and reporting.
"""

from typing import List, Optional
from datetime import date
from sqlalchemy.orm import Session
from sqlalchemy import and_, func, or_
from fastapi import Depends

from ..models.todo import Todo
from ..core.database import get_db


class AnalyticsRepository:
    def __init__(self, db: Session):
        self.db = db

    def get_completed_tasks_in_range(
        self,
        owner_id: int,
        start_date: date,
        end_date: date,
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
            Todo.deleted_at == None,
        ).order_by(Todo.completed_at).all()

    def get_all_tasks_in_range(
        self,
        owner_id: int,
        start_date: date,
        end_date: date,
    ) -> List[Todo]:
        """
        Get ALL tasks (done or not) whose created_at OR completed_at
        falls within [start_date, end_date], excluding soft-deleted.
        Needed for workload trend and cumulative backlog.
        """
        return self.db.query(Todo).filter(
            Todo.owner_id == owner_id,
            Todo.deleted_at == None,
            or_(
                and_(Todo.created_at >= start_date, Todo.created_at <= end_date),
                and_(Todo.completed_at != None, Todo.completed_at >= start_date, Todo.completed_at <= end_date),
            )
        ).order_by(Todo.created_at).all()

    def get_total_completed_count(
        self,
        owner_id: int,
        start_date: date,
        end_date: date,
    ) -> int:
        """Count of completed tasks in the date range."""
        return self.db.query(func.count(Todo.id)).filter(
            Todo.owner_id == owner_id,
            Todo.is_done == True,
            Todo.completed_at != None,
            Todo.completed_at >= start_date,
            Todo.completed_at <= end_date,
            Todo.deleted_at == None,
        ).scalar() or 0

    def get_average_score(
        self,
        owner_id: int,
        start_date: date,
        end_date: date,
    ) -> float:
        """Average productivity score for completed tasks in the range."""
        result = self.db.query(func.avg(Todo.productivity_score)).filter(
            Todo.owner_id == owner_id,
            Todo.is_done == True,
            Todo.completed_at != None,
            Todo.productivity_score != None,
            Todo.completed_at >= start_date,
            Todo.completed_at <= end_date,
            Todo.deleted_at == None,
        ).scalar()
        return round(result, 2) if result else 0.0

    def get_total_created_count(
        self,
        owner_id: int,
        start_date: date,
        end_date: date,
    ) -> int:
        """Count of tasks created in the date range."""
        return self.db.query(func.count(Todo.id)).filter(
            Todo.owner_id == owner_id,
            Todo.created_at >= start_date,
            Todo.created_at <= end_date,
            Todo.deleted_at == None,
        ).scalar() or 0


# Dependency Injection Helper
def get_analytics_repo(db: Session = Depends(get_db)) -> AnalyticsRepository:
    return AnalyticsRepository(db)
