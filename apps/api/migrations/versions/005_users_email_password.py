"""Users table: drop clerk_id, add password_hash, email unique and not null.

JWT email/password auth; users table is source of identity.

Revision ID: 005_users_email_password
Revises: 004_head_version_fk
Create Date: 2025-03-07

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = "005_users_email_password"
down_revision: Union[str, Sequence[str], None] = "004_head_version_fk"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.drop_index("idx_users_clerk_id", table_name="users")
    op.drop_column("users", "clerk_id")
    op.add_column("users", sa.Column("password_hash", sa.Text(), nullable=True))
    op.alter_column(
        "users",
        "email",
        existing_type=sa.Text(),
        nullable=False,
    )
    op.create_index("idx_users_email_unique", "users", ["email"], unique=True)


def downgrade() -> None:
    op.drop_index("idx_users_email_unique", table_name="users")
    op.alter_column(
        "users",
        "email",
        existing_type=sa.Text(),
        nullable=True,
    )
    op.drop_column("users", "password_hash")
    op.add_column("users", sa.Column("clerk_id", sa.Text(), nullable=True))
    op.create_index("idx_users_clerk_id", "users", ["clerk_id"], unique=True)
