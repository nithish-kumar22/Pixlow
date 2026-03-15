# apps/api — FastAPI backend

Backend API for projects, versions, and prompt → IR generation.

- **Stack:** FastAPI, SQLAlchemy (async), Alembic, Aiven PostgreSQL, JWT email/password auth.
- **Auth:** `POST /auth/register` and `POST /auth/login` (email + password) return a JWT. Protected routes require `Authorization: Bearer <jwt>`; JWT is verified with `JWT_SECRET` (HS256), `sub` claim is user id.

## Run

From `apps/api`:

1. Set environment variables (see **Environment** below).
2. `pip install -r requirements.txt`
3. `uvicorn main:app --reload`

Server runs at http://localhost:8000 by default. Set `NEXT_PUBLIC_API_URL` in the frontend (e.g. `http://localhost:8000`) so the Next.js app can call the API.

**From repo root:** `npm run dev:api` (runs uvicorn from `apps/api`).

## Environment

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | PostgreSQL connection URL (e.g. Aiven or local). |
| `JWT_SECRET` | Secret for signing/verifying JWTs. Required for auth and protected routes. Use a strong random string. |
| `OPENROUTER_API_KEY` | (M08) OpenRouter API key for LLM generation. Required for `POST /projects/{id}/generate`. |
| `OPENROUTER_MODEL_ID` | (M08) Optional. OpenRouter model id (e.g. `openai/gpt-4o-mini`). Default: `openai/gpt-4o-mini`. |

## Auth (protected routes)

- **Register:** `POST /auth/register` with body `{ "email": "...", "password": "..." }` → returns `{ "access_token": "<jwt>", "token_type": "bearer" }`.
- **Login:** `POST /auth/login` with body `{ "email": "...", "password": "..." }` → same token response.
- **Me:** `GET /auth/me` with header `Authorization: Bearer <jwt>` → returns current user id, email, name.

Protected routes (projects, versions, generation) require:

```
Authorization: Bearer <jwt>
```

The JWT is signed with `JWT_SECRET` (HS256); the `sub` claim is the user UUID. If the token is missing or invalid, the API returns 401 with `{"detail": "...", "code": "UNAUTHORIZED"}`.

## Error format

Errors return JSON with `detail` and `code`:

- `400` — `BAD_REQUEST` (validation, invalid input)
- `401` — `UNAUTHORIZED` (missing or invalid token)
- `404` — `NOT_FOUND` (resource missing or not owned)

## Tests

From `apps/api`: `pytest tests/ -v`. Requires `pytest`, `pytest-asyncio` (in requirements.txt). Auth tests set `JWT_SECRET` for invalid-token tests.

## Migrations

Migrations are managed by **Alembic** in the `migrations/` directory. The `users` table stores email, password_hash, name, avatar_url; identity is JWT-based (`sub` = user id).

### Prerequisites

- Set the `DATABASE_URL` environment variable (e.g. Aiven PostgreSQL or local Postgres). Use a standard PostgreSQL URL; the env script will use the `asyncpg` driver for running migrations.

### Commands

From `apps/api`:

- **Apply all migrations:** `alembic upgrade head`
- **Roll back one revision:** `alembic downgrade -1`
- **Roll back all:** `alembic downgrade base`
- **Create a new revision (autogenerate from models):** `alembic revision --autogenerate -m "description"`
- **Create an empty revision (hand-written):** `alembic revision -m "description"`

### Schema (MVP)

- **users** — `id`, `email` (unique), `password_hash`, `name`, `avatar_url`, `created_at`, `updated_at`
- **projects** — `id`, `owner_id` (FK → users), `name`, `description`, `platform`, `head_version_id` (FK → project_versions), `deleted_at` (soft-delete), timestamps
- **project_versions** — `id`, `project_id` (FK → projects), `parent_id` (FK → project_versions), `ir_snapshot` (JSONB), `ir_hash`, `message`, `created_at`
