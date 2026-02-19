"""Add priority, completed_at, productivity_score to todos

Revision ID: a1b2c3d4e5f6
Revises: 5380bc4afe2e
Create Date: 2026-02-19 10:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'a1b2c3d4e5f6'
down_revision: str = '5380bc4afe2e'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Add new columns to todos table
    op.add_column('todos', sa.Column('completed_at', sa.DateTime(), nullable=True))
    op.add_column('todos', sa.Column('productivity_score', sa.Float(), nullable=True))
    op.add_column('todos', sa.Column('priority', sa.String(length=20), nullable=True))

    # Set default priority for existing rows
    op.execute("UPDATE todos SET priority = 'Normal' WHERE priority IS NULL")

    # Make priority non-nullable after setting defaults
    with op.batch_alter_table('todos') as batch_op:
        batch_op.alter_column('priority', nullable=False, server_default='Normal')

    # Set completed_at for existing completed tasks
    op.execute("""
        UPDATE todos
        SET completed_at = updated_at
        WHERE is_done = 1 AND completed_at IS NULL
    """)


def downgrade() -> None:
    with op.batch_alter_table('todos') as batch_op:
        batch_op.drop_column('priority')
        batch_op.drop_column('productivity_score')
        batch_op.drop_column('completed_at')
