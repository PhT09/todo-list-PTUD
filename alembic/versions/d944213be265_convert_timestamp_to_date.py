"""convert_timestamp_to_date

Revision ID: d944213be265
Revises: a1b2c3d4e5f6
Create Date: 2026-03-04 22:05:17.037189

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'd944213be265'
down_revision: Union[str, Sequence[str], None] = 'a1b2c3d4e5f6'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    # Convert timestamp columns in 'todos' table to purely 'date'
    op.execute("ALTER TABLE todos ALTER COLUMN created_at TYPE DATE USING created_at::date")
    op.execute("ALTER TABLE todos ALTER COLUMN updated_at TYPE DATE USING updated_at::date")
    op.execute("ALTER TABLE todos ALTER COLUMN due_date TYPE DATE USING due_date::date")
    op.execute("ALTER TABLE todos ALTER COLUMN deleted_at TYPE DATE USING deleted_at::date")
    op.execute("ALTER TABLE todos ALTER COLUMN completed_at TYPE DATE USING completed_at::date")

    # Convert timestamp columns in 'users' table to purely 'date'
    op.execute("ALTER TABLE users ALTER COLUMN created_at TYPE DATE USING created_at::date")


def downgrade() -> None:
    """Downgrade schema."""
    op.execute("ALTER TABLE todos ALTER COLUMN created_at TYPE TIMESTAMP WITHOUT TIME ZONE USING created_at::timestamp")
    op.execute("ALTER TABLE todos ALTER COLUMN updated_at TYPE TIMESTAMP WITHOUT TIME ZONE USING updated_at::timestamp")
    op.execute("ALTER TABLE todos ALTER COLUMN due_date TYPE TIMESTAMP WITHOUT TIME ZONE USING due_date::timestamp")
    op.execute("ALTER TABLE todos ALTER COLUMN deleted_at TYPE TIMESTAMP WITHOUT TIME ZONE USING deleted_at::timestamp")
    op.execute("ALTER TABLE todos ALTER COLUMN completed_at TYPE TIMESTAMP WITHOUT TIME ZONE USING completed_at::timestamp")

    op.execute("ALTER TABLE users ALTER COLUMN created_at TYPE TIMESTAMP WITHOUT TIME ZONE USING created_at::timestamp")
