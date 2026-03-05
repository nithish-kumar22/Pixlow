# Pixlow

Generate mobile apps from natural-language prompts. One-line: **Describe your app, get React Native (Expo) code and live preview.**

## Features

- **Prompt → App** — Enter a natural-language description; the LLM returns an IR (Intermediate Representation) and the compiler emits React Native (Expo) code.
- **React Native (MVP)** — First release targets React Native only; design scales to Flutter later.
- **Live preview** — In-browser preview of the generated app via Sandpack (React Native Web).
- **Save & versions** — Save after each generation; list versions and restore any version.
- **Export** — Download generated code as a ZIP and run locally with Expo.
- **Self-hosting** — Run frontend and backend yourself with your own database and API keys.

## Tech stack

| Layer | Choice |
|-------|--------|
| Frontend | Next.js (App Router, TypeScript, Tailwind) |
| Backend | FastAPI (Python) |
| Database | PostgreSQL (Aiven), Alembic migrations |
| Auth | Clerk |
| LLM | OpenRouter (single API key; e.g. `openai/gpt-4o-mini`) |
| Preview | Sandpack |
| Repo | Monorepo (npm workspaces: `apps/web`, `apps/api`, `packages/ir`, `packages/compiler-rn`) |

## Repository structure

| Path | Description |
|------|-------------|
| `apps/web` | Next.js frontend (TypeScript, Tailwind, App Router) |
| `apps/api` | FastAPI backend (projects, versions, generation) |
| `packages/ir` | Shared IR schema and types (Zod) |
| `packages/compiler-rn` | IR → React Native compiler |

Monorepo uses npm workspaces: `apps/*`, `packages/*`.

## Architecture

See [high-level-design.md](high-level-design.md) for system architecture, data flow, and module overview. Implementation order and module definitions: [mvp-modules-implementation-guide.md](mvp-modules-implementation-guide.md).

## Getting started

1. **Clone and install**
   ```bash
   git clone <repo-url>
   cd pixlow
   npm install
   ```

2. **Environment**
   - Copy `.env.example` to `.env` (and `.env.local` if needed).
   - Fill in the placeholder values (see [Environment variables](#environment-variables)).

3. **Run the app**
   - Frontend: `npm run dev` (from repo root; runs Next.js in `apps/web`).
   - Open [http://localhost:3000](http://localhost:3000).

4. **Backend**
   - From `apps/api`: install deps (`pip install -r requirements.txt`), set `DATABASE_URL` and Clerk/OpenRouter env vars, then run `uvicorn main:app --reload` (or `npm run dev:api` from root).
   - Set `NEXT_PUBLIC_API_URL` in frontend env to the API base URL (e.g. `http://localhost:8000`).

5. **Protected routes**
   - `/dashboard` and `/projects` require sign-in. Unauthenticated users are redirected to `/sign-in`.

## Environment variables

See `.env.example` for placeholders. Summary:

- `DATABASE_URL` — PostgreSQL connection string (Aiven or local).
- `NEXT_PUBLIC_APP_URL` — Frontend base URL (e.g. `http://localhost:3000`).
- **Clerk (auth):** `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`, `CLERK_SECRET_KEY`, `CLERK_JWKS_URL` — from [Clerk Dashboard](https://dashboard.clerk.com). Required for sign-in/sign-up and protected routes.
- **Clerk webhook:** `CLERK_WEBHOOK_SECRET` — from Clerk Dashboard → Webhooks → your endpoint → Signing secret. Used by the FastAPI webhook to sync users. For local dev, use a tunnel (e.g. ngrok).
- `NEXT_PUBLIC_API_URL` — FastAPI base URL (e.g. `http://localhost:8000`). All authenticated API calls send `Authorization: Bearer <token>` (Clerk session token).
- **LLM (backend only):** `OPENROUTER_API_KEY` — from [OpenRouter](https://openrouter.ai); do not expose to the client. Optional: `OPENROUTER_MODEL_ID` (default `openai/gpt-4o-mini`).

## Self-hosting

1. **Environment** — Use `.env.example` as a checklist. Set every variable for your environment (database, Clerk app, OpenRouter key, API URL).
2. **Database** — Provision PostgreSQL (e.g. Aiven, Neon, Supabase). Run migrations from `apps/api`: `alembic upgrade head` with `DATABASE_URL` set.
3. **Run services** — Frontend: `npm run dev` or `npm run build` + `npm run start`. Backend: from `apps/api`, `uvicorn main:app --reload` (dev) or run with a production ASGI server (e.g. Gunicorn + Uvicorn).
4. **Deploy** — Frontend: e.g. Vercel. Backend: e.g. Railway, Render, Fly.io, or Docker. Set `NEXT_PUBLIC_APP_URL` and `NEXT_PUBLIC_API_URL` to your production URLs. See [Deployment](#deployment) for more.

## Development

### Scripts (root)

| Script | Description |
|--------|-------------|
| `npm run dev` | Start Next.js dev server (apps/web) |
| `npm run dev:api` | Start FastAPI dev server (apps/api) |
| `npm run build` | Build Next.js app |
| `npm run start` | Start Next.js production server |
| `npm run lint` | Run ESLint |
| `npm run format` | Format code with Prettier |

### Tests

- **Frontend / IR / Compiler:** From repo root: `npm run test -w apps/web`, `npm run test -w packages/ir`, `npm run test -w packages/compiler-rn`.
- **API:** From `apps/api`: `pytest`.

Before submitting a PR, run `npm run lint` and the relevant tests.

## Deployment

- **Frontend:** Deploy the Next.js app (e.g. Vercel). Set build command `npm run build` (from root or `apps/web`), output `.next`. Configure env vars in the hosting dashboard.
- **Backend:** Deploy the FastAPI app (e.g. Railway, Render, Fly.io). Set `DATABASE_URL`, Clerk keys, `OPENROUTER_API_KEY`, and ensure CORS allows your frontend origin.
- **Database:** Run migrations in production: `alembic upgrade head` with production `DATABASE_URL`.
- Set `NEXT_PUBLIC_APP_URL` and `NEXT_PUBLIC_API_URL` to your production URLs.

## License

See [LICENSE](LICENSE).
