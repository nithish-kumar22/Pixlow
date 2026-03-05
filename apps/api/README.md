# apps/api — FastAPI backend

Backend API for projects, versions, and prompt → IR generation.

- **Stack:** FastAPI, SQLAlchemy (async), Alembic, Aiven PostgreSQL, Clerk (auth), Svix (webhook verification).
- **M03:** Exposes `POST /webhooks/clerk` for Clerk user sync (user.created / user.updated). Configure the endpoint URL in Clerk Dashboard → Webhooks and set `CLERK_WEBHOOK_SECRET` to the signing secret.
- **M04:** Projects, versions, and generation endpoints; all protected routes require `Authorization: Bearer <token>` (Clerk session token). JWT is verified using Clerk JWKS (`CLERK_JWKS_URL`).

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
| `CLERK_WEBHOOK_SECRET` | Clerk webhook signing secret (Dashboard → Webhooks). |
| `CLERK_JWKS_URL` | Clerk JWKS URL for JWT verification (e.g. `https://<your-clerk-frontend-api>/.well-known/jwks.json`). Required for protected routes. |
| `OPENROUTER_API_KEY` | (M08) OpenRouter API key for LLM generation. Required for `POST /projects/{id}/generate`. |
| `OPENROUTER_MODEL_ID` | (M08) Optional. OpenRouter model id (e.g. `openai/gpt-4o-mini`). Default: `openai/gpt-4o-mini`. |

## Auth (protected routes)

Protected routes (projects, versions, generation) require the request header:

```
Authorization: Bearer <session_token>
```

The session token is a Clerk JWT. Obtain it from the frontend via `auth().getToken()` (server) or `useAuth().getToken()` (client). The API validates the JWT using `CLERK_JWKS_URL` and resolves the user to the internal `users.id` (synced from Clerk via webhook). If the token is missing, invalid, or the user is not in `users`, the API returns 401 with `{"detail": "...", "code": "UNAUTHORIZED"}`.

## Error format

Errors return JSON with `detail` and `code`:

- `400` — `BAD_REQUEST` (validation, invalid input)
- `401` — `UNAUTHORIZED` (missing or invalid token)
- `404` — `NOT_FOUND` (resource missing or not owned)

## Tests

From `apps/api`: `pytest tests/ -v`. Requires `pytest`, `pytest-asyncio` (in requirements.txt). Auth tests do not require `CLERK_JWKS_URL`.

## Migrations

Migrations are managed by **Alembic** in the `migrations/` directory. Identity is provided by **Clerk**; the `users` table stores a mirror keyed by `clerk_id` (synced on sign-in or via Clerk webhook).

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

- **users** — `id`, `clerk_id` (unique), `email`, `name`, `avatar_url`, `created_at`, `updated_at`
- **projects** — `id`, `owner_id` (FK → users), `name`, `description`, `platform`, `head_version_id` (FK → project_versions), `deleted_at` (soft-delete), timestamps
- **project_versions** — `id`, `project_id` (FK → projects), `parent_id` (FK → project_versions), `ir_snapshot` (JSONB), `ir_hash`, `message`, `created_at`
