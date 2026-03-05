"""Create projects table (without head_version_id FK).

Projects are owned by users. head_version_id is added in a later migration
after project_versions exists. Soft-delete via deleted_at.

Revision ID: 002_projects
Revises: 001_users
Create Date: 2025-03-04

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = "002_projects"
down_revision: Union[str, Sequence[str], None] = "001_users"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "projects",
        sa.Column("id", postgresql.UUID(as_uuid=True), server_default=sa.text("gen_random_uuid()"), nullable=False),
        sa.Column("owner_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("name", sa.Text(), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("platform", sa.Text(), nullable=False, server_default="react-native"),
        sa.Column("head_version_id", postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column("deleted_at", sa.TIMESTAMP(timezone=True), nullable=True),
        sa.Column("created_at", sa.TIMESTAMP(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.TIMESTAMP(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.PrimaryKeyConstraint("id"),
        sa.ForeignKeyConstraint(["owner_id"], ["users.id"], ondelete="CASCADE"),
    )
    op.create_index("idx_projects_owner_id", "projects", ["owner_id"])


def downgrade() -> None:
    op.drop_index("idx_projects_owner_id", table_name="projects")
    op.drop_table("projects")
