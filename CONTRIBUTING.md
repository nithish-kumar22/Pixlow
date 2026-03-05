# Contributing to Pixlow

Thanks for your interest in contributing. This document explains how to set up the project, open issues, and submit pull requests.

## Opening issues

- **Bugs:** Describe what you did, what you expected, and what happened. Include your environment (OS, Node version, whether you're using the FastAPI backend) and any error messages.
- **Features:** Describe the feature and why it would help. Check the [MVP modules guide](mvp-modules-implementation-guide.md) and backlog to avoid duplicating planned work.

## Development setup

1. **Clone and install**
   ```bash
   git clone <repo-url>
   cd pixlow
   npm install
   ```

2. **Environment**
   - Copy `.env.example` to `.env` (and `.env.local` if your setup uses it).
   - Fill in the placeholders (see [README — Environment variables](README.md#environment-variables)). You need at least: `DATABASE_URL`, Clerk keys, `OPENROUTER_API_KEY`, and `NEXT_PUBLIC_API_URL` for full flows.

3. **Run frontend and backend**
   - Frontend: `npm run dev` (from repo root).
   - Backend: `npm run dev:api` from root, or from `apps/api`: `pip install -r requirements.txt` then `uvicorn main:app --reload`.

4. **Database**
   - From `apps/api`, run migrations: `alembic upgrade head` with `DATABASE_URL` set.

## Branch naming

Use a short prefix and descriptive name:

- `feature/short-description` — new features
- `fix/short-description` — bug fixes
- `docs/short-description` — documentation only
- `chore/short-description` — tooling, deps, refactors

## Pull request process

1. Open a PR against the default branch (e.g. `main` or `master`).
2. Link any related issue in the PR description.
3. Ensure **lint and tests pass** (see below) before requesting review.
4. Keep PRs focused; prefer several small PRs over one large one.

## Lint and tests

- **Lint (root):** `npm run lint`, `npm run format`
- **Tests**
  - Frontend: `npm run test -w apps/web`
  - IR package: `npm run test -w packages/ir`
  - Compiler: `npm run test -w packages/compiler-rn`
  - API: from `apps/api`, run `pytest`

Run the relevant subset for your changes; run all before merging if you touch multiple areas.

## Where to start

Implementation is organized into **modules** with a defined order. See:

- **[mvp-modules-implementation-guide.md](mvp-modules-implementation-guide.md)** — Module dependency order (Section 2), step-by-step implementation per module, and **Definition of Done** (Section 8).
- **[high-level-design.md](high-level-design.md)** — Architecture and data flow.

Pick a module whose dependencies are already done, complete every step and the Definition of Done for that module, then open a PR.
