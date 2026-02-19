"""
Analytics Service - Business logic for productivity analytics.
Processes raw data into chart-ready structures.
"""

from datetime import datetime, timedelta
from typing import List, Dict, Any
from collections import defaultdict

from ..repositories.analytics_repository import AnalyticsRepository
from ..models.todo import Todo

PRIORITY_OPTIONS = ["Priority", "Important", "Necessary", "Normal"]


def _get_period_key(dt: datetime, unit: str) -> str:
    """
    Return a period key string for grouping.
    - week:  'YYYY-WNN'  (ISO week number)
    - month: 'YYYY-MM'
    """
    if unit == "week":
        iso_year, iso_week, _ = dt.isocalendar()
        return f"{iso_year}-W{iso_week:02d}"
    else:
        return dt.strftime("%Y-%m")


def _get_period_label(dt: datetime, unit: str) -> str:
    """Human-readable label for a period."""
    if unit == "week":
        iso_year, iso_week, _ = dt.isocalendar()
        return f"W{iso_week:02d}/{iso_year}"
    else:
        return dt.strftime("%m/%Y")


def _generate_period_keys(start: datetime, end: datetime, unit: str) -> List[str]:
    """Generate all period keys between start and end."""
    keys = []
    current = start
    seen = set()
    while current <= end:
        key = _get_period_key(current, unit)
        if key not in seen:
            seen.add(key)
            keys.append(key)
        current += timedelta(days=1)
    return keys


class AnalyticsService:
    def __init__(self, repo: AnalyticsRepository):
        self.repo = repo

    def get_stats(
        self,
        owner_id: int,
        start_date: datetime,
        end_date: datetime,
        unit: str = "week",
    ) -> Dict[str, Any]:
        """
        Generate analytics data for the dashboard.

        Returns:
            - pie_data: Early vs Late task ratios
            - stacked_column_data: Task counts by priority per time unit
            - line_chart_data: Average productivity scores per time unit
            - cumulative_score: Overall average score (X/100)
        """
        tasks = self.repo.get_completed_tasks_in_range(owner_id, start_date, end_date)
        total = len(tasks)

        # ── Pie Data: Early vs Late ──
        early_count = 0
        late_count = 0
        on_time_count = 0
        no_deadline_count = 0

        for t in tasks:
            if t.due_date is None:
                no_deadline_count += 1
                continue
            if t.completed_at and t.due_date:
                diff = (t.due_date - t.completed_at).total_seconds()
                if diff > 0:
                    early_count += 1
                elif diff < 0:
                    late_count += 1
                else:
                    on_time_count += 1

        pie_data = {
            "early": early_count,
            "late": late_count,
            "on_time": on_time_count,
            "no_deadline": no_deadline_count,
            "total": total,
            "early_ratio": round(early_count / total, 4) if total > 0 else 0,
            "late_ratio": round(late_count / total, 4) if total > 0 else 0,
        }

        # ── Stacked Column Data: priority x time-unit ──
        all_periods = _generate_period_keys(start_date, end_date, unit)

        # Initialize: { period_key: { priority: count } }
        stacked_data = {
            p: {prio: 0 for prio in PRIORITY_OPTIONS}
            for p in all_periods
        }

        # Score accumulators per period for line chart
        score_sums = defaultdict(float)
        score_counts = defaultdict(int)

        for t in tasks:
            if t.completed_at is None:
                continue
            period = _get_period_key(t.completed_at, unit)
            priority = t.priority if t.priority in PRIORITY_OPTIONS else "Normal"
            if period in stacked_data:
                stacked_data[period][priority] += 1
            else:
                stacked_data[period] = {prio: 0 for prio in PRIORITY_OPTIONS}
                stacked_data[period][priority] = 1

            if t.productivity_score is not None:
                score_sums[period] += t.productivity_score
                score_counts[period] += 1

        # Format stacked_column_data as list
        stacked_column_data = []
        for period in all_periods:
            entry = {"period": period}
            entry.update(stacked_data.get(period, {prio: 0 for prio in PRIORITY_OPTIONS}))
            stacked_column_data.append(entry)
        # Add any periods that exist in data but not in all_periods
        for period in stacked_data:
            if period not in all_periods:
                entry = {"period": period}
                entry.update(stacked_data[period])
                stacked_column_data.append(entry)

        # ── Line Chart Data: Average scores per period ──
        line_chart_data = []
        for period in all_periods:
            avg = round(score_sums[period] / score_counts[period], 2) if score_counts[period] > 0 else 0
            line_chart_data.append({"period": period, "avg_score": avg})

        # ── Cumulative Score ──
        cumulative_score = self.repo.get_average_score(owner_id, start_date, end_date)

        return {
            "pie_data": pie_data,
            "stacked_column_data": stacked_column_data,
            "line_chart_data": line_chart_data,
            "cumulative_score": cumulative_score,
        }
