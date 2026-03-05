"""
Productivity Scoring Engine
===========================
Implements the mathematical model for scoring task completion.

Variables:
  - Created_Date: The date the task was created.
  - Due_Date: The deadline set for the task.
  - Completion_Date: The date the task was marked as done.
  - Actual_Duration (x): Completion_Date - Created_Date (in days).
  - Estimated_Duration: Due_Date - Created_Date (in days).

Weight: 1 - 1/(1 + exp(-0.4 * x + a))
  where 'a' depends on priority:
    Priority  -> a = 5
    Important -> a = 6
    Necessary -> a = 7
    Normal    -> a = 8

Deadline Score (out of 100):
  - On time (Completion == Due):     90
  - Early   (Completion < Due):      ceil(10 * (Due - Completion) / (Due - Created) + 90)
  - Late    (Completion > Due):      floor(90 * (Due - Completion) / (Due - Created) + 90)

Total Score = Weight * Deadline_Score

Auto-Trash: If Actual_Duration >= 2 * Estimated_Duration => score = 0, move to trash.
"""

import math
from datetime import date

# Priority -> sigmoid steepness parameter
PRIORITY_A_MAP = {
    "Priority": 5,
    "Important": 6,
    "Necessary": 7,
    "Normal": 8,
}


def _days_between(d1: date, d2: date) -> int:
    """Return number of days between two dates (can be fractional)."""
    delta = d2 - d1
    return delta.days


def calculate_weight(priority: str, actual_days: float) -> float:
    """
    Weight = 1 - 1 / (1 + exp(-0.4 * x + a))
    where x = actual_days
    """
    a = PRIORITY_A_MAP.get(priority, 8)  # default to Normal
    exponent = -0.4 * actual_days + a
    # Clamp exponent to avoid overflow
    exponent = max(min(exponent, 500), -500)
    weight = 1.0 - (1.0 / (1.0 + math.exp(exponent)))
    return weight


def calculate_deadline_score(
    created_at: date,
    due_date: date,
    completed_at: date,
) -> float:
    """
    Deadline Score out of 100.
    - On time: 90
    - Early:   ceil(10 * (due - completed) / (due - created) + 90)
    - Late:    floor(90 * (due - completed) / (due - created) + 90)
    """
    due_minus_completed = _days_between(completed_at, due_date)      # positive if early
    due_minus_created = _days_between(created_at, due_date)          # should be positive

    # Edge case: due_date == created_at (zero estimated duration)
    if due_minus_created == 0:
        return 90.0

    if due_minus_completed == 0:
        # Completion == Due
        return 90.0
    elif due_minus_completed > 0:
        # Early: Completion before Due
        raw = 10.0 * due_minus_completed / due_minus_created + 90.0
        return min(math.ceil(raw), 100.0)
    else:
        # Late: Completion after Due
        raw = 90.0 * due_minus_completed / due_minus_created + 90.0
        return max(math.floor(raw), 0.0)


def compute_productivity(
    created_at: date,
    due_date: date | None,
    completed_at: date,
    priority: str,
) -> dict:
    """
    Compute the full productivity score for a completed task.
    """
    from datetime import datetime
    if isinstance(created_at, datetime):
        created_at = created_at.date()
    if isinstance(completed_at, datetime):
        completed_at = completed_at.date()
    if isinstance(due_date, datetime):
        due_date = due_date.date()

    actual_duration = _days_between(created_at, completed_at)

    # If no due_date, we can only compute the weight portion
    if due_date is None:
        weight = calculate_weight(priority, actual_duration)
        return {
            "score": round(weight * 90.0, 2),   # Base score of 90 when no deadline
            "should_trash": False,
            "weight": round(weight, 4),
            "deadline_score": 90.0,
            "actual_duration": actual_duration,
            "estimated_duration": None,
        }

    estimated_duration = _days_between(created_at, due_date)

    # Auto-Trash Logic: actual >= 2 * estimated
    if estimated_duration > 0 and actual_duration >= 2 * estimated_duration:
        return {
            "score": 0.0,
            "should_trash": True,
            "weight": 0.0,
            "deadline_score": 0.0,
            "actual_duration": actual_duration,
            "estimated_duration": estimated_duration,
        }

    weight = calculate_weight(priority, estimated_duration)
    deadline_score = calculate_deadline_score(created_at, due_date, completed_at)
    total_score = round(weight * deadline_score, 2)

    return {
        "score": total_score,
        "should_trash": False,
        "weight": round(weight, 4),
        "deadline_score": deadline_score,
        "actual_duration": actual_duration,
        "estimated_duration": estimated_duration,
    }