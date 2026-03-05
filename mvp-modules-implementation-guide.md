# MVP Modules — Implementation Guide (Open Source Release)

> **Purpose:** Break the AI-Powered Mobile App Generation Platform into small, ordered modules with clear step-by-step implementation tasks. Focus: ship an MVP and release it as open source.

**References:** `high-level-design.md`, `execution-roadmap.md`, `production-level-architecture-planning-document.md`

### How to use this document

1. **Execute modules in order** — Respect the dependency order in [Section 2](#2-module-dependency-order). Do not start a module until its dependencies are done.
2. **Complete every step** — Each numbered step under a module is a concrete task. Check off as you go; use the [Definition of Done](#8-definition-of-done-per-module) before marking a module complete.
3. **Core only** — This guide includes only core modules required for the first open-source release. No optional modules or optional features.
4. **One module at a time** — Finish one module (including tests and docs for that module) before starting the next, to keep the codebase shippable.
5. **Answer the Decisions section first** — Before implementing, answer the questions in [Section 0](#0-decisions--questions-answer-these-first). Then use your choices consistently in the modules (the doc refers to “your chosen …” once you’ve decided).

---

## 0. Decisions / questions (answer these first)

Answer these and record your choices (e.g. in a `DECISIONS.md` or at the top of the README). The implementation steps in the modules will refer to “your chosen [X]” and will not prescribe a specific option.

1. **Auth provider**  
   Which authentication service or library do you want for sign-up / sign-in? (e.g. Clerk, Supabase Auth, NextAuth, Auth0, or custom.)

2. **Database**  
   Which PostgreSQL host and how will you run migrations? (e.g. Neon, Supabase, local Postgres; and migration tool: Supabase migrations, Drizzle, Prisma, raw SQL + runner, or Alembic if using FastAPI.)

3. **Backend API**  
   Where will the main API (projects, versions, generation) live?  
   - **Option A:** Next.js API (Node.js) — tRPC or Next.js Route Handlers (REST).  
   - **Option B:** Separate backend — e.g. **FastAPI** (Python). Frontend (Next.js) calls the FastAPI base URL; auth can be JWT or session validated by FastAPI.

4. **LLM provider**  
   Which LLM API will you use for prompt → IR generation? (e.g. **OpenRouter** — single API key for multiple models such as GPT, Claude, etc. — or a direct provider such as OpenAI/Anthropic.)

5. **Repo structure**  
   Single Next.js app or monorepo (e.g. `apps/web`, `apps/api` for FastAPI, `packages/ir`)?

Once you have answered these, the rest of the guide uses “your chosen auth provider”, “your chosen backend”, “your chosen LLM provider”, and “your chosen database/migration approach” . For this project, the LLM provider is **OpenRouter** (single API key; models such as GPT are selected via OpenRouter model ids).

### Recorded decisions (for this project)

| # | Question       | Choice |
|---|----------------|--------|
| 1 | **Auth provider** | **Clerk** |
| 2 | **Database** | **Cloud PostgreSQL from Aiven** |
| 3 | **Backend API** | **Option B — separate FastAPI backend** |
| 4 | **LLM provider** | **OpenRouter** — single API key; models are GPT or others via OpenRouter (e.g. `openai/gpt-4o-mini` for MVP). No separate OpenAI/Claude keys. |
| 5 | **Repo structure** | **Monorepo**: `apps/web` (Next.js), `apps/api` (FastAPI), `packages/ir` (shared IR schema/types). |

The implementation steps in the modules below use these choices. For auth, database, and migrations: use Clerk, Aiven Postgres, and a migration approach **Alembic** for migrations.

### Additional recorded choices

| # | Decision | Choice |
|---|----------|--------|
| A | **Migration tool** | **Alembic** |
| B | **MVP platform** | **React Native only** for MVP and open source; design so it scales to Flutter when commercializing. |
| C | **Save strategy** | **Save after each successful generation** (no explicit Save button; no auto-save debounce). |
| D | **Project delete** | **Soft-delete** (mark as deleted; keep data). |
| E | **Preview tabs** | **Show file tabs** in Sandpack preview. |
| F | **LLM access** | **OpenRouter** — one API key; use GPT or other models via OpenRouter model ids (e.g. `openai/gpt-4o-mini`). No separate OpenAI/Claude keys. |


---

## Table of Contents

0. [Decisions / questions (answer these first)](#0-decisions--questions-answer-these-first)
1. [MVP Scope & Out of Scope](#1-mvp-scope--out-of-scope)
2. [Module Dependency Order](#2-module-dependency-order)
3. [Phase A — Foundation](#phase-a--foundation)
4. [Phase B — IR & Core Engines](#phase-b--ir--core-engines)
5. [Phase C — Application & UX](#phase-c--application--ux)
6. [Phase D — Polish & Open Source Release](#phase-d--polish--open-source-release)
7. [Post-MVP Modules (Backlog)](#7-post-mvp-modules-backlog)
8. [Definition of Done per Module](#8-definition-of-done-per-module)

---

## 1. MVP Scope & Out of Scope

### In scope for MVP (open source release)

| Capability | Description |
|------------|-------------|
| **User auth** | Sign up / sign in (email or OAuth). Single user; no org/team. |
| **Project creation** | User creates a project with **name** and description. MVP: **React Native only** (platform fixed; no UI choice). |
| **Prompt → App** | User enters a natural-language prompt → LLM returns IR → compiler emits code → user sees preview. |
| **IR as source of truth** | One-way: Prompt/LLM updates IR → code is emitted from IR only (no code → canvas). |
| **Live preview** | In-browser preview of generated app (React Native Web via Sandpack). |
| **Save & versions** | Save after each generation; list versions; restore a version. |
| **Export** | Download generated code as a ZIP (run locally with Expo). |

### Out of scope for MVP

| Capability | Notes |
|------------|--------|
| Canvas / drag-and-drop editor | Post-MVP; MVP is prompt-only for generating/refining. |
| Code editor (Monaco) with sync | Post-MVP; MVP can show read-only code or simple code block. |
| Billing / payments | Open source MVP has no billing. |
| Organizations / teams | Single-user only. |
| Rate limiting (beyond basic) | Post-MVP. |
| pgvector / template search | Use static component catalog only. |
| Real-time collaboration | Post-MVP. |
| Native device preview (QR / Expo Go) | Post-MVP; browser preview only. |

---

## 2. Module Dependency Order

Execute modules in this order. Dependencies are listed per module.

```
Phase A (Foundation)
  M01 → M02 → M03 → M04

Phase B (IR & Core)
  M05 → M06 → M07 → M08 → M09 → M11

Phase C (Application)
  M12 → M13 → M14 → M15 → M16 → M17

Phase D (Polish)
  M19 → M20
```

---

# Phase A — Foundation

---

## Module M01 — Repository & Development Environment

**Purpose:** One-click clone, install, and run for contributors. Standardize tooling and scripts.

**MVP:** Yes  
**Depends on:** None  
**Deliverables:** Monorepo or single app, package.json scripts, lint/format, env template.

### Implementation steps

1. **Create repository**
   - 1.1 Initialize git: `git init`, create `.gitignore` (node_modules, .env, .env.local, .next, dist, coverage, *.log).
   - 1.2 Add README.md with project title, one-line description, and “Getting started” placeholder.

2. **Structure**
   - 2.1 Use monorepo layout: root with `apps/web` (Next.js), `apps/api` (FastAPI), and `packages/ir`. Initialize npm/pnpm workspaces with `"workspaces": ["apps/*", "packages/*"]`. In `apps/api` add `requirements.txt` or `pyproject.toml` for Python deps. Document the structure in README.

3. **Scaffold Next.js app**
   - 3.1 Run `npx create-next-app@latest` with TypeScript, ESLint, Tailwind, App Router, `src/` directory. No Turbopack for MVP if it causes issues.
   - 3.2 Ensure `next.config.js` or `next.config.mjs` exists and is committed.

4. **Add dev scripts**
   - 4.1 In `package.json`: `"dev": "next dev"`, `"build": "next build"`, `"start": "next start"`, `"lint": "next lint"`.
   - 4.2 Add Prettier: `npm install -D prettier`, add `"format": "prettier --write ."` and `.prettierrc` (e.g. single quotes, 2 spaces).
   - 4.3 Add `.prettierignore`: `.next`, `node_modules`, `out`.

5. **Environment template**
   - 5.1 Create `.env.example` with placeholder keys (no real secrets): e.g. `DATABASE_URL=`, `OPENROUTER_API_KEY=`, `NEXT_PUBLIC_APP_URL=http://localhost:3000`.
   - 5.2 Document each variable in README or in comments in `.env.example`.
   - 5.3 Ensure `.env` and `.env.local` are in `.gitignore`.

6. **Verify run**
   - 6.1 Run `npm install`, `npm run dev`; confirm app runs at http://localhost:3000.
   - 6.2 Run `npm run lint` and `npm run build`; fix any errors.

---

## Module M02 — Database Schema & Migrations

**Purpose:** Persist users, projects, and project versions. Schema matches HLD and supports platform (React Native / Flutter).

**MVP:** Yes  
**Depends on:** M01  
**Deliverables:** Schema SQL and migration flow.

### Implementation steps

1. **Database and migration tool**
   - 1.1 Using **Aiven PostgreSQL** and **Alembic**, create a `migrations/` or `db/` directory in `apps/api` and document in README how to run migrations.
   - 1.2 **Clerk** stores users externally; define a `users` table that stores `clerk_id` (or Clerk user id) as the stable identifier, plus `email`, `name`, `avatar_url`, and sync from Clerk on sign-in or webhook.

2. **Define `users` table**
   - 2.1 Create migration: `users` with `id` (UUID PK), `clerk_id` (TEXT UNIQUE, from Clerk), `email`, `name`, `avatar_url`, `created_at`, `updated_at`. Document in code comments that Clerk is the source of identity.
   - 2.2 Add index on `clerk_id` and on `email`.

3. **Define `projects` table**
   - 3.1 Columns: `id` (UUID PK), `owner_id` (FK → users), `name` (TEXT), `description` (TEXT, nullable), `platform` (TEXT NOT NULL DEFAULT 'react-native'; MVP uses only 'react-native'; add 'flutter' when commercializing), `head_version_id` (UUID, nullable), `deleted_at` (TIMESTAMPTZ, nullable; for **soft-delete**), `created_at`, `updated_at`.
   - 3.2 Add FK: `owner_id` REFERENCES users(id) ON DELETE CASCADE.
   - 3.3 Add index: `projects(owner_id)`.

4. **Define `project_versions` table**
   - 4.1 Columns: `id` (UUID PK), `project_id` (FK → projects ON DELETE CASCADE), `parent_id` (FK → project_versions, nullable), `ir_snapshot` (JSONB NOT NULL), `ir_hash` (TEXT, for dedup), `message` (TEXT, nullable), `created_at`.
   - 4.2 Indexes: `(project_id, created_at DESC)`.

5. **Link `projects.head_version_id`**
   - 5.1 Add FK: `projects.head_version_id` REFERENCES project_versions(id). Create migration after project_versions exists.
   - 5.2 Ensure first version is inserted and then project updated with head_version_id.

6. **Run migrations**
   - 6.1 Document how to run Alembic migrations (e.g. `alembic upgrade head`) with `DATABASE_URL` set.
   - 6.2 Run migrations against a local or dev database and confirm tables exist.

---

## Module M03 — Authentication

**Purpose:** Identify users so projects are private and owned. Use **Clerk** for auth (see [Recorded decisions](#recorded-decisions-for-this-project)).

**MVP:** Yes  
**Depends on:** M01, M02  
**Deliverables:** Sign up, sign in, sign out, session in app, and protected API/project access.

### Implementation steps

1. **Provider**
   - 1.1 Use **Clerk**. Install `@clerk/nextjs` in `apps/web`. Add `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` and `CLERK_SECRET_KEY` to `.env.example` and document in README.

2. **Install and configure**
   - 2.1 Run `npm install @clerk/nextjs` in `apps/web`. Add Clerk env vars to `.env.example` with short comments.

3. **Wrap app with provider**
   - 3.1 Wrap root layout with `<ClerkProvider>`. Add Clerk middleware to protect routes (`/dashboard`, `/projects`) and redirect unauthenticated users to sign-in.

4. **Sync user to database**
   - 4.1 On first sign-in (or via Clerk webhook): insert or update the `users` row in **Aiven Postgres** with `clerk_id`, email, name, avatar_url from Clerk. Call FastAPI from webhook or from frontend after sign-in to upsert user. Use `clerk_id` as the stable external id.

5. **Sign up / Sign in UI**
   - 5.1 Use Clerk’s `<SignIn />` and `<SignUp />` on dedicated routes (e.g. `/sign-in`, `/sign-up`). Redirect to dashboard or projects after success.

6. **Sign out**
   - 6.1 Add a “Sign out” button that calls the provider’s sign-out and redirects to home or sign-in.

7. **Protected routes**
   - 7.1 Ensure dashboard and project pages require auth; redirect unauthenticated users to sign-in.
   - 7.2 Implement server-side check: resolve session, then load project only if `project.owner_id === currentUser.id`.

8. **API auth**
   - 8.1 In **FastAPI**: get the current user via the Clerk auth dependency (M04). Attach `userId` to the request context. Reject unauthenticated requests for protected endpoints.

---

## Module M04 — API Layer (FastAPI)

**Purpose:** Backend API for projects, versions, and generation. Implement as a **FastAPI** service in `apps/api` (see [Recorded decisions](#recorded-decisions-for-this-project)).

**MVP:** Yes  
**Depends on:** M01, M02, M03  
**Deliverables:** Projects, versions, and generation endpoints; auth on every protected route; consistent error responses.

### Implementation steps

1. **FastAPI app**
   - 1.1 Create a FastAPI app in `apps/api`. Install: `fastapi`, `uvicorn`, and a PostgreSQL driver/ORM (e.g. `asyncpg`, `sqlalchemy`) and JWT/session validation for **Clerk** (e.g. verify Clerk JWT or call Clerk API). Add `NEXT_PUBLIC_API_URL` to frontend `.env.example` pointing to the FastAPI server.

2. **Auth dependency**
   - 2.1 Implement a dependency that reads the Bearer token from the request, validates it with **Clerk** (JWT verification or Clerk backend API), and returns `userId` (or 401). Apply this dependency to all protected routes.

3. **Routers**
   - 3.1 Create APIRouter modules: `projects`, `versions`, `generation`. Use Pydantic models for request/response bodies. Connect to **Aiven PostgreSQL** using your chosen driver/ORM (e.g. SQLAlchemy, Tortoise, or raw asyncpg).

4. **Project routes**
   - 4.1 `GET /projects` — list projects for current user (exclude soft-deleted: `deleted_at IS NULL`). `GET /projects/{id}` — get one, verify ownership. `POST /projects` — body: `name`, `description?`; MVP: set `platform` to `'react-native'` server-side (no client choice). Create and return project. `PATCH /projects/{id}` — update name/description only. `DELETE /projects/{id}` — verify ownership; **soft-delete** (set `deleted_at`; exclude from list).

5. **Version routes**
   - 5.1 `GET /projects/{id}/versions` — list versions. `POST /projects/{id}/versions` — body: `ir`, `message?`; save version, set head. `GET /versions/{id}` — get one version’s `ir_snapshot` (verify project ownership).

6. **Generation route**
   - 6.1 `POST /projects/{id}/generate` — body: `prompt`; validate; call LLM (M08 implemented in Python); return IR or jobId. Implement full logic in M08.

7. **CORS and errors**
   - 7.1 Enable CORS for the Next.js origin. Return consistent error JSON (e.g. `{ "detail": "...", "code": "NOT_FOUND" }`) and HTTP status codes (404, 401, 400).

8. **Run and document**
   - 8.1 Document how to run the FastAPI server (e.g. `uvicorn main:app --reload`). Add backend env vars to `.env.example` (e.g. `DATABASE_URL`, auth secrets, `OPENROUTER_API_KEY`).

---

# Phase B — IR & Core Engines

---

## Module M05 — IR Schema (Zod) & TypeScript Types

**Purpose:** Single, versioned schema for the Intermediate Representation (IR). All LLM output and compiler input must conform.

**MVP:** Yes  
**Depends on:** M01  
**Deliverables:** Zod schema, TypeScript types, and a validator function; one sample valid IR file.

### Implementation steps

1. **Create package or directory**
   - 1.1 Create `packages/ir` with `package.json` and `tsconfig.json` (monorepo; see [Recorded decisions](#recorded-decisions-for-this-project)).

2. **Define version and top-level keys**
   - 2.1 Define `IR_VERSION = '1.0'`. Top-level: `version`, `appId?`, `screens`, `navigation`, `theme`, `dataBindings?`, `assets?`.
   - 2.2 TypeScript: export interface `AppIR` with these fields.

3. **Screen schema**
   - 3.1 `Screen`: `id` (string), `name` (string), `layout` (single root node). Layout is a tree of nodes.
   - 3.2 Node: `id`, `type` (string enum: View, Text, Image, Button, TextInput, FlatList, ScrollView, etc.), `props` (record), `style` (record), `children?` (array of nodes), `events?` (e.g. onPress with action/target).

4. **Navigation schema**
   - 4.1 `navigation`: `type` ('stack'|'tabs'), `initialScreen` (screen id).

5. **Theme schema**
   - 5.1 `theme`: `primaryColor?`, `fontFamily?`, or a small record of design tokens.

6. **Zod schema**
   - 6.1 Implement `appIRSchema` in Zod matching the above (z.object, z.array, z.enum for type, z.record for props/style).
   - 6.2 Export `type AppIR = z.infer<typeof appIRSchema>`.

7. **Validator**
   - 7.1 Export `function validateIR(data: unknown): AppIR { return appIRSchema.parse(data); }`. Use in LLM response parsing and before saving versions.

8. **Sample IR**
   - 8.1 Add `sampleIR.json` or `sampleIR.ts` with one valid app (e.g. one screen, View with Text and Button). Use in tests and as few-shot example for LLM.

9. **Tests**
   - 9.1 Unit test: valid sample passes; invalid (missing required field, wrong type) throws.

---

## Module M06 — Component Catalog (Static)

**Purpose:** List of components the LLM can use, with props and default styles. No vector search for MVP.

**MVP:** Yes  
**Depends on:** M05  
**Deliverables:** Catalog type, static catalog of **React Native** primitives; used in system prompt (M07).

### Implementation steps

1. **Define catalog entry type**
   - 1.1 Type: `{ id, name, description, category?, props: { name, type, default? }[], styleProps?: string[], exampleSnippet? }`. Keep it minimal.

2. **React Native catalog**
   - 2.1 Add entries for: View, Text, Image, TouchableOpacity/Button, TextInput, FlatList, ScrollView, SafeAreaView. For each: name, short description, props (e.g. Text: content; Button: label, onPress; Image: source), and allowed style props (flex, fontSize, color, etc.).
   - 2.2 Store as `catalogReactNative.ts` or JSON. Export as `getComponentCatalog(platform: 'react-native')`.

3. **Catalog for prompt**
   - 4.1 Function `getCatalogForPrompt(platform: string): string` that returns a text or JSON summary for inclusion in system prompt (M07).



---

## Module M07 — Prompt Validation & System Prompt Builder

**Purpose:** Validate user prompt; build system prompt with IR schema, component catalog, and instructions so LLM returns valid IR.

**MVP:** Yes  
**Depends on:** M05, M06  
**Deliverables:** Prompt validation (length, sanitization), `buildSystemPrompt(platform, options?)`, and clear “output only JSON” instructions.

### Implementation steps

1. **Prompt validation**
   - 1.1 Min length (e.g. 10 chars), max length (e.g. 4000). Return structured error if invalid.
   - 1.2 Strip leading/trailing whitespace; reject if empty after strip.
   - 1.3 Export `validatePrompt(prompt: string): { ok: true } | { ok: false, error: string }`.

2. **System prompt structure**
   - 2.1 System prompt must include: (a) role (“You are a mobile app generator…”), (b) output format (“Respond with ONLY valid JSON…”), (c) IR schema summary or minimal example, (d) component catalog for chosen platform, (e) design rules (e.g. one root View per screen, use ids).

3. **Build system prompt**
   - 3.1 `buildSystemPrompt(platform: 'react-native' | 'flutter', options?: { includeExample?: boolean }): string`.
   - 3.2 Inject schema snippet (key names and types) and catalog from M06. If includeExample, add one minimal IR JSON example (from M05 sample).

4. **User message formatting**
   - 4.1 Function that takes raw user prompt and returns the user message (e.g. “Generate a mobile app with the following description: …”). Prepend “Target platform: React Native”.

5. **Documentation**
   - 5.1 Document prompt constraints (length, language) in code comments or README so future contributors can tune.

---

## Module M08 — LLM Integration (Structured Output → IR)

**Purpose:** Call LLM with system + user prompt; parse response to IR; validate with Zod.

**MVP:** Yes  
**Depends on:** M05, M07  
**Deliverables:** `generateIR(prompt, projectId?, platform): Promise<AppIR>`, retry on invalid JSON.

### Implementation steps

1. **LLM provider (OpenRouter)**
   - 1.1 Implement this module in **FastAPI** (Python). Use **OpenRouter** as the single provider: one API key (`OPENROUTER_API_KEY` in backend env; never expose to client). OpenRouter exposes an OpenAI-compatible API, so use the **OpenAI** Python SDK (`openai`) with `base_url="https://openrouter.ai/api/v1"` and `api_key=OPENROUTER_API_KEY`. Model is specified by OpenRouter model id (e.g. `openai/gpt-4o-mini` for MVP; can switch to `anthropic/claude-3-5-sonnet` or others without code change).

2. **Single-call generation**
   - 2.1 Implement `generateIR(prompt: str, platform: str) -> AppIR` in Python. Reuse the system prompt builder from M07 (implement or port in `apps/api`).
   - 2.2 Build system prompt with M07; user message = user prompt. Call the OpenRouter API (OpenAI-compatible chat completions). Use a configurable model id (e.g. `openai/gpt-4o-mini`). Get full response text.

3. **Parse JSON from response**
   - 3.1 Strip markdown code blocks (```json … ```) if present. `JSON.parse` the string. If parse fails, retry once (max 2 retries) with “Return only valid JSON, no markdown” in a follow-up or retry.

4. **Validate with IR schema**
   - 4.1 Run `validateIR(parsed)` (M05). On failure, retry (max 2 retries) with error message in user prompt. Return validated AppIR or throw with clear error.

5. **Integrate with API**
   - 5.1 In the FastAPI generation route (M04): call `generateIR(prompt, project.platform)`. Create a version with the returned IR (M04/M16). Return IR to client or jobId if async.

6. **Error handling**
   - 6.1 Handle rate limit, timeout, and API errors; map to user-friendly messages. Log errors server-side.

---

## Module M09 — IR → React Native Compiler

**Purpose:** Transform validated IR into React Native (Expo) code: TSX files, package.json, app entry. Used for preview and export.

**MVP:** Yes  
**Depends on:** M05  
**Deliverables:** `compileIRToReactNative(ir: AppIR): FileTree`, with one file per screen + App.tsx + package.json; StyleSheet or inline styles.

### Implementation steps

1. **Define output type**
   - 1.1 `FileTree = Record<string, string>` (path → content). Paths e.g. `App.tsx`, `screens/HomeScreen.tsx`, `package.json`.

2. **Map IR node types to RN components**
   - 2.1 View → `<View style={...}>`; Text → `<Text style={...}>`; Image → `<Image source={...}/>`; Button → `<TouchableOpacity>` + Text; TextInput → `<TextInput>`; FlatList → `<FlatList data=... renderItem=...>`; ScrollView → `<ScrollView>`. Handle `style` and `props` from IR.

3. **Recursive node-to-JSX**
   - 3.1 Function `nodeToJSX(node: IRNode): string` that handles children recursively. Generate stable keys (e.g. node.id) for list items. Resolve styles into StyleSheet or inline object.

4. **Screen files**
   - 4.1 For each screen in `ir.screens`, generate `screens/<Name>Screen.tsx` with one component that renders the screen’s layout root. Import View, Text, etc. from 'react-native'.

5. **Navigation**
   - 5.1 Generate `App.tsx` that uses React Navigation (stack or tabs) and imports all screen components. Set initial route from `ir.navigation.initialScreen`.

6. **Theme**
   - 6.1 Generate `theme.ts` with colors/font from `ir.theme`; use in components or pass as context.

7. **package.json**
   - 7.1 Emit minimal `package.json` with dependencies: react, react-native, expo, @react-navigation/native, etc. Name from `ir.appId` or fixed “generated-app”.

8. **Post-processing**
   - 8.1 Run Prettier on generated TSX strings for readability. Catch and ignore formatting errors in MVP.

9. **Tests**
   - 9.1 Feed sample IR (M05) through compiler; assert FileTree has expected keys and that App.tsx and one screen file contain expected strings (e.g. “View”, “Text”).

---

## Module M11 — In-Browser Preview (Sandpack)

**Purpose:** Render generated React Native (or RN Web) code in the browser so user sees the app without running Expo locally.

**MVP:** Yes  
**Depends on:** M09.  
**Deliverables:** Preview component that accepts FileTree or single entry code; Sandpack with React/RN Web template; hot-update when IR/code changes.

### Implementation steps

1. **Install Sandpack**
   - 1.1 `npm install @codesandbox/sandpack-react`.

2. **Choose template**
   - 2.1 Use `template="react"` and provide entry file (e.g. App.jsx) that imports React Native Web components, or use a community template for “react-native-web” if available. For MVP, simplest is React-like components that mirror RN (View → div, Text → span) in a custom template.

3. **Preview component**
   - 3.1 Create `<Preview files={FileTree} entry="App.tsx" />` that passes `files` to Sandpack. Sandpack’s `files` prop: object of path → code string.
   - 3.2 Set `options={{ showPreview: true, showTabs: true }}` (show file tabs). Ensure preview iframe is visible and sized (e.g. device frame or fixed height).

4. **Wire to compiler**
   - 4.1 When IR is available (after generation or load), run `compileIRToReactNative(ir)` (MVP: platform is always react-native). Pass result to `<Preview files={...} />`. Ensure template has react-native-web and correct entry.

5. **Handle platform**
   - 5.1 MVP is React Native only; one preview path.

6. **Hot-update**
   - 6.1 When IR changes (e.g. refine or load version), recompile and update Sandpack `files` prop so preview refreshes. Debounce ~300ms to avoid excessive recompiles during typing.

7. **Error state**
   - 7.1 If compilation fails, show error message in place of preview. If Sandpack runtime error, show in preview area or in a small log.

---

# Phase C — Application & UX

---

## Module M12 — App Shell & Routing

**Purpose:** Layout, navigation, and public vs protected routes so the app feels coherent and works on mobile/desktop.

**MVP:** Yes  
**Depends on:** M01, M03  
**Deliverables:** Root layout, nav bar or sidebar, routes: `/`, `/sign-in`, `/sign-up`, `/dashboard`, `/projects`, `/projects/new`, `/projects/[id]`.

### Implementation steps

1. **Root layout**
   - 1.1 Shared layout: header (logo, user menu, sign out), main content area. Use Tailwind; make it responsive.

2. **Public routes**
   - 2.1 `/`: Landing page (hero, short description, CTA “Get started” → sign-up or dashboard). `/sign-in`, `/sign-up`: auth UI (M03).

3. **Protected routes**
   - 3.1 `/dashboard` or `/projects`: list projects (M14). `/projects/new`: create project (M14). `/projects/[id]`: project editor (M15). Wrap in auth check; redirect to sign-in if not authenticated.

4. **Navigation links**
   - 4.1 In header: “Projects” → `/projects`, “New project” → `/projects/new`. User avatar/menu: “Sign out”.

5. **404**
   - 5.1 Add `app/not-found.tsx` for 404.

6. **Loading and error**
   - 6.1 Add `loading.tsx` for suspense and `error.tsx` for error boundary on key routes.

---

## Module M13 — Prompt UI & Streaming

**Purpose:** Input for app description, submit to backend, show “Generating…” and then result (IR drives preview and code).

**MVP:** Yes  
**Depends on:** M04, M08, M12  
**Deliverables:** Prompt input, submit button, loading state, error display, and wiring to generation API and IR store.

### Implementation steps

1. **Prompt input component**
   - 1.1 Textarea or input; placeholder “Describe the app you want, e.g. A to-do app with a list and add button”. Max length consistent with M07 (e.g. 4000).

2. **Submit**
   - 2.1 Button “Generate” (or “Create app”). On click: validate prompt client-side (length); disable button; call `generation.create` (or equivalent) with `projectId` and `prompt`. Pass `projectId` from current project (editor page) or create project on first generate (M14).

3. **Loading state**
   - 3.1 While request in flight: show spinner or “Generating your app…” and disable input. If streaming (M08): show progress text or progress bar.

4. **Success**
   - 4.1 On success: API returns IR (or jobId and client polls/SSE for IR). Store IR in client state (Zustand or React state). Trigger preview (M11) and code view (M15) to update.

5. **Error**
   - 5.1 On API error or validation error: show message below input; re-enable button. Do not clear prompt so user can fix and retry.

---

## Module M14 — Project CRUD & Platform Selection

**Purpose:** Create project with name and platform; list projects; open project; update name; delete project.

**MVP:** Yes  
**Depends on:** M04, M12  
**Deliverables:** New project form (name, platform), project list page, project card with name/platform/last updated, open/delete actions.

### Implementation steps

1. **New project page**
   - 1.1 Route: `/projects/new`. Form: project name (required), description, **MVP: no platform selector** (platform fixed to react-native). Submit → `projects.create`; redirect to `/projects/[id]` (editor). Pre-fill name “Untitled App” if empty.

2. **Project list page**
   - 2.1 Route: `/projects`. Fetch `projects.list`; display cards (name, platform, updated_at). Each card: click → `/projects/[id]`; “Delete” with confirmation.

3. **Project editor entry**
   - 3.1 From list or “New project”, land on `/projects/[id]`. Load `projects.get(id)`; if 404 or not owner, redirect or show error. Store current project (id, name, platform) in client state.

4. **Update project name**
   - 4.1 In editor or list: allow editing name (inline or modal); call `projects.update({ id, name })`. Reflect in header and list.

5. **Delete project**
   - 5.1 Button “Delete project” with confirm dialog; call `projects.delete({ id })`; redirect to `/projects`.

6. **Empty state**
   - 6.1 If no projects, show “Create your first app” and link to `/projects/new`.

---

## Module M15 — Project Editor Page (IR Store, Code View, Preview)

**Purpose:** Single page where user sees prompt input, generated app preview, and read-only code. IR is source of truth; code is emitted from IR.

**MVP:** Yes  
**Depends on:** M09, M11, M12, M13, M14  
**Deliverables:** Editor layout (prompt + preview + code); Zustand store for current IR; compile IR to code and show in Sandpack + code block or simple code view.

### Implementation steps

1. **Editor layout**
   - 1.1 Split view: left or top = prompt (M13); right or bottom = preview (M11) and code view. Tabs or panels to switch “Preview” / “Code”. Responsive: stack on small screens.

2. **IR store (Zustand)**
   - 2.1 Create store: `{ ir: AppIR | null, setIR(ir), clearIR() }`. When project loads, set IR from `project.head_version` if any. When generation completes, setIR(ir).

3. **Compile and preview**
   - 3.1 When `ir` is set, call `compileIRToReactNative(ir)` (M09; MVP is RN-only). Pass React Native FileTree to Sandpack (M11).

4. **Code view**
   - 4.1 Read-only: show main entry file (e.g. App.tsx) or list of files in a simple tabbed view. Content = compiled code from same IR. No sync from code edits back to IR (one-way only).

5. **Loading and empty**
   - 5.1 If no IR yet (new project): show “Describe your app and click Generate” and placeholder preview/code. If loading generation, show loading in preview/code area.

6. **Project name in header**
   - 6.1 Display current project name and platform in header; link back to project list.

---

## Module M16 — Save & Version Persistence

**Purpose:** Persist current IR as a new version; load version history; restore a version as head so user can undo or branch.

**MVP:** Yes  
**Depends on:** M04, M15  
**Deliverables:** Auto-save or “Save” button, version list, restore version.

### Implementation steps

1. **Save**
   - 1.1 **Save after each successful generation**: when the LLM returns valid IR and the user sees the preview, call `versions.save({ projectId, ir: store.ir, message? })` (e.g. message "Initial generation"). No explicit “Save” button, no auto-save debounce. On success, update local “last saved” indicator.

2. **Version list**
   - 2.1 In editor or sidebar: “Versions” or “History”. Fetch `versions.list({ projectId })`. Show list with date and message (e.g. “Initial generation”, “After refine”).

3. **Restore**
   - 3.1 Click a version → fetch `versions.get({ versionId })`; set IR in store to that snapshot; set as new head (or “Restore” creates new version with that IR). Recompile and update preview/code.

4. **Conflict**
   - 4.1 If user has unsaved changes and restores, confirm: “Discard current changes?”. MVP can keep it simple: restore overwrites current in-memory IR.

5. **First version**
   - 5.1 When first version is saved, ensure `projects.head_version_id` is set (handled in M04/M02).

---

## Module M17 — Export ZIP

**Purpose:** Let user download generated code as a ZIP so they can run it locally. **MVP: React Native (Expo) only.**

**MVP:** Yes  
**Depends on:** M09, M15  
**Deliverables:** “Export” button; compile IR to FileTree; build ZIP; trigger download; “How to run” instructions.

### Implementation steps

1. **Export button**
   - 1.1 In editor: “Export” or “Download code”. On click: get current IR from store and project.platform; run `compileIRToReactNative(ir)` to get FileTree (MVP: React Native only).

2. **Build ZIP**
   - 2.1 Use `jszip` (or similar): add each file in FileTree to ZIP with path. Generate blob; trigger download with filename `{projectName}-{platform}-{date}.zip`.

3. **Instructions**
   - 3.1 After download or in modal: “To run: unzip, then run `npm install && npx expo start`.” Link to Expo docs.

4. **Error**
   - 4.1 If compilation fails, show message and do not download.

---

# Phase D — Polish & Open Source Release

---

## Module M19 — Open Source Polish (README, License, Contributing)

**Purpose:** Make the repo welcoming for contributors and clear for self-hosting. No business-specific or secret content.

**MVP:** Yes (for release)  
**Depends on:** All MVP modules  
**Deliverables:** README, LICENSE, CONTRIBUTING, .env.example, and clear “Getting started” and “Building the MVP” sections.

### Implementation steps

1. **README**
   - 1.1 Project name and one-line description. “Features” list (prompt → app, platform choice, preview, export, save/versions). “Getting started”: clone, install deps, copy `.env.example` to `.env`, set env vars, run frontend (and backend if FastAPI). Link to architecture (e.g. `high-level-design.md` or short “Architecture” section). Screenshot or GIF. “Tech stack”: list the stack you chose in [Decisions](#0-decisions--questions-answer-these-first) (e.g. Next.js, FastAPI or Next.js API, Postgres, Sandpack).
   - 1.2 Section “Self-hosting”: env vars, database setup, migrations, how to run and deploy frontend and backend (e.g. Vercel + Postgres; if FastAPI, add backend host, e.g. Railway, Render, or Docker). Section “Development”: scripts, how to run tests.
   - 1.3 Credits and license (e.g. MIT).

2. **LICENSE**
   - 2.1 Add LICENSE file (MIT or Apache 2.0). Ensure year and copyright holder are correct.

3. **.env.example**
   - 3.1 List every env var with placeholder and one-line comment. No real keys. Include: `DATABASE_URL`; auth-related vars for your chosen auth provider; `OPENROUTER_API_KEY` (LLM via OpenRouter); `NEXT_PUBLIC_APP_URL`; if using FastAPI, `NEXT_PUBLIC_API_URL` (or backend URL) and any backend-only vars.

4. **CONTRIBUTING.md**
   - 4.1 How to open issues, fork, branch naming, PR process. How to run lint and tests. Link to module doc (this file) for “where to start”.

5. **Remove secrets and noise**
   - 5.1 Grep for API keys, passwords, and internal URLs; remove or replace with env. Ensure no `.env` or `.env.local` is committed.

---

## Module M20 — Deployment & Runbook

**Purpose:** One-click or scripted deploy so maintainers and users can run the app in production (e.g. Vercel + hosted Postgres).

**MVP:** Yes (for release)  
**Depends on:** M01, M02, M19  
**Deliverables:** Deploy instructions and env config in hosting dashboard.

### Implementation steps

1. **Hosting choice**
   - 1.1 Document deployment for the stack you chose: frontend (e.g. Vercel for Next.js); backend (if FastAPI: e.g. Railway, Render, Fly.io, or Docker); database (e.g. Neon, Supabase, or managed Postgres). Add “Deployment” section in README.

2. **Environment variables**
   - 2.1 List all production env vars in README and .env.example. Document where to set them (Vercel project settings, etc.). Include: `DATABASE_URL`, auth keys, `OPENROUTER_API_KEY`, `NEXT_PUBLIC_APP_URL` (production URL).

3. **Database**
   - 3.1 Production DB: run migrations (M02). Document: “Run migrations: `npm run db:migrate` with DATABASE_URL set.” Seed only for staging if needed; not for prod.

4. **Build and deploy**
   - 4.1 Deploy frontend (e.g. connect repo to Vercel; build command `npm run build`, output `.next`). If using FastAPI, deploy backend separately and set `NEXT_PUBLIC_API_URL` in frontend env. Ensure no server-only secrets are in client bundle. Test production build locally (frontend and, if applicable, backend).

5. **Runbook**
   - 5.1 Short runbook: how to rollback (redeploy previous), how to run migrations, where logs are, how to rotate API keys. Can live in README or docs/runbook.md.

---

# 7. Post-MVP Modules (Backlog)

These are not required for the first open source release. Implement in order after MVP is stable.

| Module | Description |
|--------|-------------|
| **IR → Flutter compiler (M10)** | Emit Flutter (Dart) code; add when commercializing beyond React Native. |
| **Refine (M18)** | Follow-up prompt to change existing app (merge new IR with current). |
| **Canvas editor** | Drag-and-drop UI builder (e.g. craft.js/dnd-kit); canvas mutations update IR; one-way canvas → code. |
| **Code editor (Monaco)** | Read-only or editable code view with syntax highlighting; edits do not sync back to IR (per HLD). |
| **More components** | Extend catalog and compiler (e.g. 30+ components, custom components). |
| **Rate limiting** | Per-user or per-IP limits (e.g. 10 generations/day) via Redis or DB. |
| **Native preview** | QR code + Expo Go for real device preview. |
| **Organizations** | Multi-tenant: orgs, members, shared projects. |
| **Billing** | Stripe integration for paid plans (if productized later). |
| **Template search** | pgvector + embeddings for “similar templates” in prompt enrichment. |
| **Collaboration** | Real-time multi-user editing (Yjs/CRDT). |

---

# 8. Definition of Done per Module

Before marking a module complete:

- [ ] All implementation steps for that module are done.
- [ ] No known regressions: existing flows still work.
- [ ] New code is covered by at least one test where practical (especially M05, M07, M08, M09).
- [ ] README or inline comments updated if the module adds env vars or new scripts.
- [ ] Lint and build pass.

**MVP release checklist (overall):**

- [ ] User can sign up and sign in.
- [ ] User can create a project with name (MVP: React Native only; platform fixed).
- [ ] User can enter a prompt and get an app (IR → code → preview).
- [ ] User can see live preview and read-only code.
- [ ] User can save and see version history; restore a version.
- [ ] User can export project as ZIP and run locally.
- [ ] README, LICENSE, .env.example, and deploy instructions are complete.
- [ ] Repository is public and tagged (e.g. v0.1.0 or “mvp”).

---

*End of MVP Modules Implementation Guide.*
