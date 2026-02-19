"""
Analytics Router - API endpoints for productivity analytics.
"""

from fastapi import APIRouter, Depends, Query
from datetime import datetime
from sqlalchemy.orm import Session

from ..core.database import get_db
from ..api.deps import get_current_user
from ..models.user import User
from ..repositories.analytics_repository import AnalyticsRepository
from ..services.analytics_service import AnalyticsService

router = APIRouter(prefix="/analytics", tags=["analytics"])


@router.get("/stats")
def get_analytics_stats(
    start_date: datetime = Query(..., description="Start of date range (ISO 8601)"),
    end_date: datetime = Query(..., description="End of date range (ISO 8601)"),
    unit: str = Query("week", pattern="^(week|month)$", description="Aggregation unit: week or month"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Get productivity analytics for the authenticated user.

    Query Params:
        - start_date: Start of the date range
        - end_date: End of the date range
        - unit: 'week' or 'month'

    Response:
        - pie_data: Early/Late task ratios
        - stacked_column_data: Task counts by priority per time unit
        - line_chart_data: Average productivity scores per time unit
        - cumulative_score: Overall average score (X/100)
    """
    # Strip timezone for consistent comparison
    if start_date.tzinfo is not None:
        start_date = start_date.replace(tzinfo=None)
    if end_date.tzinfo is not None:
        end_date = end_date.replace(tzinfo=None)

    repo = AnalyticsRepository(db)
    service = AnalyticsService(repo)
    return service.get_stats(current_user.id, start_date, end_date, unit)
