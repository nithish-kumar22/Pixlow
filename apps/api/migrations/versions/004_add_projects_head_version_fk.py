"""Add projects.head_version_id FK to project_versions.

Run after project_versions exists. ON DELETE SET NULL so deleting a version
does not break the project.

Revision ID: 004_head_version_fk
Revises: 003_project_versions
Create Date: 2025-03-04

"""
from typing import Sequence, Union

from alembic import op

# revision identifiers, used by Alembic.
revision: str = "004_head_version_fk"
down_revision: Union[str, Sequence[str], None] = "003_project_versions"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_foreign_key(
        "fk_projects_head_version_id",
        "projects",
        "project_versions",
        ["head_version_id"],
        ["id"],
        ondelete="SET NULL",
    )


def downgrade() -> None:
    op.drop_constraint("fk_projects_head_version_id", "projects", type_="foreignkey")
