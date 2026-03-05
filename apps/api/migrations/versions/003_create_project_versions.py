"""Create project_versions table.

Immutable IR snapshots per project. parent_id for version lineage.

Revision ID: 003_project_versions
Revises: 002_projects
Create Date: 2025-03-04

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = "003_project_versions"
down_revision: Union[str, Sequence[str], None] = "002_projects"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "project_versions",
        sa.Column("id", postgresql.UUID(as_uuid=True), server_default=sa.text("gen_random_uuid()"), nullable=False),
        sa.Column("project_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("parent_id", postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column("ir_snapshot", postgresql.JSONB(astext_type=sa.Text()), nullable=False),
        sa.Column("ir_hash", sa.Text(), nullable=True),
        sa.Column("message", sa.Text(), nullable=True),
        sa.Column("created_at", sa.TIMESTAMP(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.PrimaryKeyConstraint("id"),
        sa.ForeignKeyConstraint(["project_id"], ["projects.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["parent_id"], ["project_versions.id"], ondelete="SET NULL"),
    )
    op.create_index(
        "idx_project_versions_project_created",
        "project_versions",
        ["project_id", "created_at"],
        postgresql_ops={"created_at": "DESC"},
    )


def downgrade() -> None:
    op.drop_index("idx_project_versions_project_created", table_name="project_versions")
    op.drop_table("project_versions")
