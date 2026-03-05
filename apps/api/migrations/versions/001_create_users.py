"""Create users table.

Clerk is the source of identity; this table is synced from Clerk on sign-in or webhook.
Stores clerk_id (Clerk user id), email, name, avatar_url.

Revision ID: 001_users
Revises:
Create Date: 2025-03-04

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = "001_users"
down_revision: Union[str, Sequence[str], None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "users",
        sa.Column("id", postgresql.UUID(as_uuid=True), server_default=sa.text("gen_random_uuid()"), nullable=False),
        sa.Column("clerk_id", sa.Text(), nullable=False),
        sa.Column("email", sa.Text(), nullable=True),
        sa.Column("name", sa.Text(), nullable=True),
        sa.Column("avatar_url", sa.Text(), nullable=True),
        sa.Column("created_at", sa.TIMESTAMP(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.TIMESTAMP(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("idx_users_clerk_id", "users", ["clerk_id"], unique=True)
    op.create_index("idx_users_email", "users", ["email"])


def downgrade() -> None:
    op.drop_index("idx_users_email", table_name="users")
    op.drop_index("idx_users_clerk_id", table_name="users")
    op.drop_table("users")
