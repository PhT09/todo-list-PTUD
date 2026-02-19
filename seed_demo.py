"""
Seed Script: Tạo tài khoản demo và dữ liệu mô phỏng
=====================================================
Tạo 1 user "demo@test.com" / "123456" với:
  - ~25 tasks đã hoàn thành (có completed_at + productivity_score)
  - ~8 tasks đang làm (active, chưa done)
  - ~3 tasks trễ hạn
  - ~2 tasks trong thùng rác
  - Phân bổ đều 4 mức priority
  - Dữ liệu trải đều 60 ngày gần đây để dashboard có biểu đồ đẹp
"""

import sys
import os
import math
import random
from datetime import datetime, timedelta, timezone

# Setup path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.core.database import SessionLocal, engine, Base
from app.models.todo import Todo
from app.models.user import User
from app.services.productivity_scorer import compute_productivity

# Hash password using passlib
from passlib.context import CryptContext
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def utc_now():
    return datetime.now(timezone.utc).replace(tzinfo=None)


def seed():
    db = SessionLocal()

    # ─── 1. Create demo user ───
    DEMO_EMAIL = "demo@test.com"
    DEMO_PASS = "123456"

    existing = db.query(User).filter(User.email == DEMO_EMAIL).first()
    if existing:
        print(f"⚠️  User '{DEMO_EMAIL}' already exists (id={existing.id}). Deleting old tasks...")
        db.query(Todo).filter(Todo.owner_id == existing.id).delete()
        db.commit()
        user = existing
    else:
        user = User(
            email=DEMO_EMAIL,
            hashed_password=pwd_context.hash(DEMO_PASS),
            is_active=True,
        )
        db.add(user)
        db.commit()
        db.refresh(user)
        print(f"✅ Created user: {DEMO_EMAIL} (id={user.id})")

    owner_id = user.id
    now = utc_now()
    priorities = ["Priority", "Important", "Necessary", "Normal"]

    tasks_to_add = []

    # ─── 2. Completed tasks (25 tasks, spread over 60 days) ───
    completed_templates = [
        "Hoàn thành báo cáo tháng",
        "Review code module authentication",
        "Thiết kế database schema mới",
        "Viết unit test cho API",
        "Tối ưu hóa query SQL",
        "Deploy production v2.1",
        "Họp sprint planning",
        "Cập nhật tài liệu API",
        "Fix bug trang đăng nhập",
        "Nghiên cứu React Server Components",
        "Cài đặt CI/CD pipeline",
        "Refactor service layer",
        "Xây dựng component Dashboard",
        "Tạo migration cho bảng mới",
        "Kiểm tra bảo mật endpoint",
        "Viết tài liệu hướng dẫn",
        "Tích hợp hệ thống thanh toán",
        "Cập nhật thư viện dependencies",
        "Tối ưu hóa performance frontend",
        "Backup dữ liệu production",
        "Thiết kế wireframe trang chủ",
        "Implement caching Redis",
        "Cấu hình Nginx reverse proxy",
        "Viết script tự động hóa deploy",
        "Hoàn thành training ML model",
    ]

    for i, title in enumerate(completed_templates):
        priority = priorities[i % 4]

        # Spread created_at over last 60 days
        days_ago = random.randint(10, 60)
        created_at = now - timedelta(days=days_ago, hours=random.randint(0, 12))

        # Estimated duration: 3-14 days
        est_days = random.randint(3, 14)
        due_date = created_at + timedelta(days=est_days)

        # Completion scenarios:
        # ~60% early, ~20% on-time-ish, ~20% late (but not auto-trash)
        roll = random.random()
        if roll < 0.60:
            # Early: complete 1-3 days before due
            early_days = random.uniform(0.5, min(3, est_days - 0.5))
            completed_at = due_date - timedelta(days=early_days)
        elif roll < 0.80:
            # On time: complete near due_date
            completed_at = due_date - timedelta(hours=random.randint(0, 12))
        else:
            # Late: complete 1-3 days after due (but not 2x, to avoid auto-trash)
            late_days = random.uniform(0.5, min(3, est_days * 0.8))
            completed_at = due_date + timedelta(days=late_days)

        # Compute score
        result = compute_productivity(created_at, due_date, completed_at, priority)

        todo = Todo(
            title=title,
            description=f"Task mô phỏng #{i+1} — mức {priority}",
            is_done=True,
            created_at=created_at,
            updated_at=completed_at,
            due_date=due_date,
            completed_at=completed_at,
            productivity_score=result["score"],
            priority=priority,
            owner_id=owner_id,
            deleted_at=None,
        )
        tasks_to_add.append(todo)

    # ─── 3. Active tasks (8 tasks, some with deadline) ───
    active_templates = [
        ("Phát triển tính năng export PDF", "Cần render bảng biểu sang PDF format", 7),
        ("Tối ưu hóa bundle size", "Giảm kích thước JS bundle dưới 200KB", 5),
        ("Viết documentation cho API v2", "Tài liệu đầy đủ cho tất cả endpoints", 10),
        ("Thiết kế dark mode cho frontend", "Chuyển đổi giữa light/dark theme", 6),
        ("Implement WebSocket notifications", "Real-time alerts khi có task mới", 8),
        ("Cải thiện UX form nhập liệu", "Thêm validation + autosave", 4),
        ("Xây dựng hệ thống logging", "Centralized logging cho production", 7),
        ("Migration sang PostgreSQL", "Chuyển từ SQLite sang PostgreSQL", 14),
    ]

    for i, (title, desc, est_days) in enumerate(active_templates):
        priority = priorities[i % 4]
        created_at = now - timedelta(days=random.randint(1, 5), hours=random.randint(0, 8))
        due_date = now + timedelta(days=est_days)

        todo = Todo(
            title=title,
            description=desc,
            is_done=False,
            created_at=created_at,
            updated_at=created_at,
            due_date=due_date,
            priority=priority,
            owner_id=owner_id,
            deleted_at=None,
        )
        tasks_to_add.append(todo)

    # ─── 4. Overdue tasks (3 tasks – past due, not completed) ───
    overdue_templates = [
        ("Sửa lỗi responsive mobile", "Trang không hiển thị đúng trên iPhone", 3),
        ("Gửi báo cáo cho khách hàng", "Báo cáo tháng 1 cần gửi gấp", 2),
        ("Cập nhật SSL certificate", "Certificate sắp hết hạn", 1),
    ]

    for i, (title, desc, overdue_days) in enumerate(overdue_templates):
        priority = priorities[i % 3]  # Priority, Important, Necessary
        created_at = now - timedelta(days=overdue_days + random.randint(3, 7))
        due_date = now - timedelta(days=overdue_days)

        todo = Todo(
            title=title,
            description=desc,
            is_done=False,
            created_at=created_at,
            updated_at=created_at,
            due_date=due_date,
            priority=priority,
            owner_id=owner_id,
            deleted_at=None,
        )
        tasks_to_add.append(todo)

    # ─── 5. Trashed tasks (2 tasks – soft-deleted, auto-trashed) ───
    trash_templates = [
        "Task bị hủy - Redesign trang landing",
        "Task quá hạn - Setup monitoring Grafana",
    ]

    for i, title in enumerate(trash_templates):
        priority = priorities[i]
        created_at = now - timedelta(days=random.randint(20, 40))
        due_date = created_at + timedelta(days=5)
        # Auto-trash: completed way too late (> 2x estimated)
        completed_at = created_at + timedelta(days=12)

        todo = Todo(
            title=title,
            description="Task đã bị đưa vào thùng rác",
            is_done=True,
            created_at=created_at,
            updated_at=completed_at,
            due_date=due_date,
            completed_at=completed_at,
            productivity_score=0.0,
            priority=priority,
            owner_id=owner_id,
            deleted_at=completed_at,
        )
        tasks_to_add.append(todo)

    # ─── Commit all ───
    db.add_all(tasks_to_add)
    db.commit()

    completed = sum(1 for t in tasks_to_add if t.is_done and not t.deleted_at)
    active = sum(1 for t in tasks_to_add if not t.is_done and not t.deleted_at)
    overdue = sum(1 for t in tasks_to_add if not t.is_done and t.due_date and t.due_date < now)
    trashed = sum(1 for t in tasks_to_add if t.deleted_at)

    print(f"\n🎉 Seed data hoàn tất!")
    print(f"   📧 Email:    {DEMO_EMAIL}")
    print(f"   🔑 Password: {DEMO_PASS}")
    print(f"   ─────────────────────────")
    print(f"   ✅ Hoàn thành: {completed}")
    print(f"   🔵 Đang làm:   {active}")
    print(f"   🔴 Trễ hạn:    {overdue}")
    print(f"   🗑️  Thùng rác:  {trashed}")
    print(f"   📊 Tổng:       {len(tasks_to_add)}")

    db.close()


if __name__ == "__main__":
    seed()
