"""
Analytics Service - Business logic for productivity analytics.
Processes raw task data into chart-ready structures for the Productivity Dashboard.
"""

from datetime import date, timedelta
from typing import List, Dict, Any
from collections import defaultdict
import math

from ..repositories.analytics_repository import AnalyticsRepository
from ..models.todo import Todo

PRIORITY_OPTIONS = ["Priority", "Important", "Necessary", "Normal"]
WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]


# ── Period helpers ──

def _get_period_key(dt: date, unit: str) -> str:
    if unit == "week":
        iso_year, iso_week, _ = dt.isocalendar()
        return f"{iso_year}-W{iso_week:02d}"
    else:
        return dt.strftime("%Y-%m")


def _generate_period_keys(start: date, end: date, unit: str) -> List[str]:
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
        start_date: date,
        end_date: date,
        unit: str = "week",
    ) -> Dict[str, Any]:
        """
        Generate comprehensive analytics data for the Productivity Dashboard.

        Returns: kpi, workload_trend, priority_mix, punctuality,
                 score_trend, weekday_activity, lead_time, cumulative_backlog
        """

        # ── Fetch data ──
        all_tasks = self.repo.get_all_tasks_in_range(owner_id, start_date, end_date)
        completed_tasks = self.repo.get_completed_tasks_in_range(owner_id, start_date, end_date)

        # Period keys for x-axes
        periods = _generate_period_keys(start_date, end_date, unit)

        # ── 1. KPI Cards ──
        kpi = self._compute_kpi(all_tasks, completed_tasks, start_date, end_date, owner_id)

        # ── 2. Workload Trend (new vs completed per period) ──
        workload_trend = self._compute_workload_trend(all_tasks, completed_tasks, periods, unit)

        # ── 3. Priority Mix (donut of completed by priority) ──
        priority_mix = self._compute_priority_mix(completed_tasks)

        # ── 4. Punctuality (on-time vs overdue per period) ──
        punctuality = self._compute_punctuality(completed_tasks, periods, unit)

        # ── 5. Score Trend (avg score per period) ──
        score_trend = self._compute_score_trend(completed_tasks, periods, unit)

        # ── 6. Weekday Activity ──
        weekday_activity = self._compute_weekday_activity(completed_tasks)

        # ── 7. Lead Time (avg days to complete per period) ──
        lead_time = self._compute_lead_time(completed_tasks, periods, unit)

        # ── 8. Cumulative Backlog ──
        cumulative_backlog = self._compute_cumulative_backlog(all_tasks, periods, unit)

        return {
            "kpi": kpi,
            "workload_trend": workload_trend,
            "priority_mix": priority_mix,
            "punctuality": punctuality,
            "score_trend": score_trend,
            "weekday_activity": weekday_activity,
            "lead_time": lead_time,
            "cumulative_backlog": cumulative_backlog,
        }

    # ────────────────────────────────────────────
    # Private computation methods
    # ────────────────────────────────────────────

    def _compute_kpi(self, all_tasks, completed_tasks, start, end, owner_id):
        total = len(all_tasks)
        completed = len(completed_tasks)
        
        valid_scores = [t.productivity_score for t in completed_tasks if t.productivity_score is not None]
        avg_score = round(sum(valid_scores) / len(valid_scores), 2) if valid_scores else 0.0

        return {
            "total_tasks": total,
            "completed_tasks": completed,
            "avg_score": avg_score,
        }

    def _compute_workload_trend(self, all_tasks, completed_tasks, periods, unit):
        new_counts = {p: 0 for p in periods}
        done_counts = {p: 0 for p in periods}

        for t in all_tasks:
            if t.created_at:
                key = _get_period_key(t.created_at, unit)
                if key in new_counts:
                    new_counts[key] += 1

        for t in completed_tasks:
            if t.completed_at:
                key = _get_period_key(t.completed_at, unit)
                if key in done_counts:
                    done_counts[key] += 1

        return [
            {"period": p, "new_tasks": new_counts[p], "completed_tasks": done_counts[p]}
            for p in periods
        ]

    def _compute_priority_mix(self, completed_tasks):
        counts = {p: 0 for p in PRIORITY_OPTIONS}
        for t in completed_tasks:
            prio = t.priority if t.priority in PRIORITY_OPTIONS else "Normal"
            counts[prio] += 1
        return counts

    def _compute_punctuality(self, completed_tasks, periods, unit):
        on_time = {p: 0 for p in periods}
        overdue = {p: 0 for p in periods}

        for t in completed_tasks:
            if not t.completed_at or not t.due_date:
                continue
            key = _get_period_key(t.completed_at, unit)
            if key not in on_time:
                continue
            if t.completed_at <= t.due_date:
                on_time[key] += 1
            else:
                overdue[key] += 1

        return [
            {"period": p, "on_time": on_time[p], "overdue": overdue[p]}
            for p in periods
        ]

    def _compute_score_trend(self, completed_tasks, periods, unit):
        sums = {p: 0.0 for p in periods}
        counts = {p: 0 for p in periods}

        for t in completed_tasks:
            if t.completed_at and t.productivity_score is not None:
                key = _get_period_key(t.completed_at, unit)
                if key in sums:
                    sums[key] += t.productivity_score
                    counts[key] += 1

        return [
            {
                "period": p,
                "avg_score": round(sums[p] / counts[p], 2) if counts[p] > 0 else 0,
            }
            for p in periods
        ]

    def _compute_weekday_activity(self, completed_tasks):
        counts = {d: 0 for d in WEEKDAYS}
        for t in completed_tasks:
            if t.completed_at:
                day_idx = t.completed_at.weekday()  # 0=Mon
                counts[WEEKDAYS[day_idx]] += 1
        return counts

    def _compute_lead_time(self, completed_tasks, periods, unit):
        sums = {p: 0.0 for p in periods}
        counts = {p: 0 for p in periods}

        for t in completed_tasks:
            if t.completed_at and t.created_at:
                key = _get_period_key(t.completed_at, unit)
                if key in sums:
                    days = (t.completed_at - t.created_at).total_seconds() / 86400.0
                    sums[key] += days
                    counts[key] += 1

        return [
            {
                "period": p,
                "avg_days": round(sums[p] / counts[p], 1) if counts[p] > 0 else 0,
            }
            for p in periods
        ]

    def _compute_cumulative_backlog(self, all_tasks, periods, unit):
        created = {p: 0 for p in periods}
        completed = {p: 0 for p in periods}

        for t in all_tasks:
            if t.created_at:
                key = _get_period_key(t.created_at, unit)
                if key in created:
                    created[key] += 1
            if t.completed_at:
                key = _get_period_key(t.completed_at, unit)
                if key in completed:
                    completed[key] += 1

        result = []
        running = 0
        for p in periods:
            running += created[p] - completed[p]
            result.append({"period": p, "backlog": max(running, 0)})
        return result
