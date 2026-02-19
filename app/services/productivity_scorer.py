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

Weight: 1 - 1/(1 + exp(-a * x + 5))
  where 'a' depends on priority:
    Priority  -> a = 0.8
    Important -> a = 0.95
    Necessary -> a = 1.2
    Normal    -> a = 1.48

Deadline Score (out of 100):
  - On time (Completion == Due):     70
  - Early   (Completion < Due):      ceil(30 * (Due - Completion) / (Due - Created) + 70)
  - Late    (Completion > Due):      floor(70 * (Due - Completion) / (Due - Created) + 70)

Total Score = Weight * Deadline_Score

Auto-Trash: If Actual_Duration >= 2 * Estimated_Duration => score = 0, move to trash.
"""

import math
from datetime import datetime

# Priority -> sigmoid steepness parameter
PRIORITY_A_MAP = {
    "Priority": 0.8,
    "Important": 0.95,
    "Necessary": 1.2,
    "Normal": 1.48,
}


def _days_between(d1: datetime, d2: datetime) -> float:
    """Return number of days between two datetimes (can be fractional)."""
    delta = d2 - d1
    return delta.total_seconds() / 86400.0


def calculate_weight(priority: str, actual_duration_days: float) -> float:
    """
    Weight = 1 - 1 / (1 + exp(-a * x + 5))
    where x = actual_duration_days
    """
    a = PRIORITY_A_MAP.get(priority, 1.48)  # default to Normal
    x = actual_duration_days
    exponent = -a * x + 5
    # Clamp exponent to avoid overflow
    exponent = max(min(exponent, 500), -500)
    weight = 1.0 - (1.0 / (1.0 + math.exp(exponent)))
    return weight


def calculate_deadline_score(
    created_at: datetime,
    due_date: datetime,
    completed_at: datetime,
) -> float:
    """
    Deadline Score out of 100.
    - On time: 70
    - Early:   ceil(30 * (due - completed) / (due - created) + 70)
    - Late:    floor(70 * (due - completed) / (due - created) + 70)
    """
    due_minus_completed = _days_between(completed_at, due_date)      # positive if early
    due_minus_created = _days_between(created_at, due_date)          # should be positive

    # Edge case: due_date == created_at (zero estimated duration)
    if due_minus_created <= 0:
        return 70.0

    if abs(due_minus_completed) < 1e-6:
        # Completion == Due (within tolerance)
        return 70.0
    elif due_minus_completed > 0:
        # Early: Completion before Due
        raw = 30.0 * due_minus_completed / due_minus_created + 70.0
        return min(math.ceil(raw), 100.0)
    else:
        # Late: Completion after Due
        raw = 70.0 * due_minus_completed / due_minus_created + 70.0
        return max(math.floor(raw), 0.0)


def compute_productivity(
    created_at: datetime,
    due_date: datetime | None,
    completed_at: datetime,
    priority: str,
) -> dict:
    """
    Compute the full productivity score for a completed task.

    Returns:
        {
          "score": float,          # Total productivity score
          "should_trash": bool,    # Whether the task should be auto-trashed
          "weight": float,
          "deadline_score": float,
          "actual_duration": float,
          "estimated_duration": float | None,
        }
    """
    actual_duration = _days_between(created_at, completed_at)

    # If no due_date, we can only compute the weight portion
    if due_date is None:
        weight = calculate_weight(priority, actual_duration)
        return {
            "score": round(weight * 70.0, 2),   # Base score of 70 when no deadline
            "should_trash": False,
            "weight": round(weight, 4),
            "deadline_score": 70.0,
            "actual_duration": round(actual_duration, 2),
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
            "actual_duration": round(actual_duration, 2),
            "estimated_duration": round(estimated_duration, 2),
        }

    weight = calculate_weight(priority, actual_duration)
    deadline_score = calculate_deadline_score(created_at, due_date, completed_at)
    total_score = round(weight * deadline_score, 2)

    return {
        "score": total_score,
        "should_trash": False,
        "weight": round(weight, 4),
        "deadline_score": deadline_score,
        "actual_duration": round(actual_duration, 2),
        "estimated_duration": round(estimated_duration, 2),
    }
