# AI-Powered Mobile App Generation Platform

> A production-level architecture planning document for a platform that generates mobile applications from natural language prompts and visual design.

---

## Table of Contents

- [Vision & Problem Decomposition](#vision--problem-decomposition)
- [Development Roadmap](#development-roadmap)
  - [Phase 0 — Foundation](#phase-0--foundation-weeks-14)
  - [Phase 1 — MVP](#phase-1--mvp-weeks-516)
  - [Phase 2 — Design-to-Code](#phase-2--design-to-code--bi-directional-sync-weeks-1732)
  - [Phase 3 — Scale & Production](#phase-3--scale--production-features-months-812)
- [Recommended Tech Stack](#recommended-tech-stack)
  - [Frontend](#31-frontend-web-dashboard)
  - [Backend](#32-backend)
  - [AI / LLM Integration](#33-ai--llm-integration)
  - [Real-time Rendering Engine](#34-real-time-rendering-engine)
  - [Database](#35-database)
  - [DevOps & Infrastructure](#36-devops--infrastructure)
- [Technology Tradeoff Comparisons](#technology-tradeoff-comparisons)
- [System Architecture Diagram](#system-architecture-diagram)
- [Critical Early Decisions](#critical-early-decisions)
- [MVP Stack Summary](#mvp-stack-summary)

---

## Vision & Problem Decomposition

Before the roadmap, here is a breakdown of the platform's core technical challenges:

| Challenge | Complexity | Description |
|---|---|---|
| **Prompt-to-Code** | Very High | LLM orchestration, code generation, AST manipulation |
| **Real-time Preview** | High | Sandboxed runtime, hot-reload, device emulation |
| **Design-to-Code** | High | Visual IR → code compiler, bi-directional sync |
| **Code-to-Design** | Very High | AST parsing → visual component reconstruction |
| **Multi-framework Output** | High | Generating React Native, Flutter, or web targets |

---

## Development Roadmap

### Phase 0 — Foundation (Weeks 1–4)

Pure infrastructure scaffolding. No product visible yet.

- Monorepo setup (`turborepo` or `nx`)
- Auth system (Clerk or Auth0)
- CI/CD pipeline (GitHub Actions + Docker)
- Database schema design (users, projects, generations)
- LLM API key management & rate-limiting layer
- Basic project CRUD (create, save, version a project)

---

### Phase 1 — MVP (Weeks 5–16)

**Goal:** A user can describe an app, get code, and see a live preview.

#### Prompt-to-Code (Core Loop)

- User inputs a natural language prompt
- System sends prompt to LLM (GPT-4o or Claude 3.5 Sonnet) with a structured system prompt that enforces a specific output schema
- LLM returns a component tree in a normalized **Intermediate Representation (IR)** — a JSON/YAML format you define (not raw code yet)
- An IR → Code compiler transforms the IR into React Native (JSX/TSX) files

```
User Prompt → LLM → IR (JSON) → Code Compiler → React Native Code
```

> **Why IR?** Direct LLM → code is brittle and unpredictable. An IR gives you a stable contract between the AI and your compiler. The LLM hallucinates less when generating structured JSON.

#### Live Preview

- Use **Expo Snack's** approach: bundle the generated React Native code in-browser using Metro bundler wrapped in a WebSocket-connected sandbox
- Render preview in an `<iframe>` pointing to a sandboxed Expo Go / web renderer
- For MVP, target React Native Web (renders in browser) to avoid native emulator dependency

#### MVP Deliverables

- [ ] Prompt input → code generation
- [ ] In-browser preview (React Native Web)
- [ ] Save / version projects
- [ ] Basic component library (Button, Text, Input, Image, List)
- [ ] Export generated code as ZIP

---

### Phase 2 — Design-to-Code + Bi-directional Sync (Weeks 17–32)

**Goal:** Add the visual drag-and-drop builder and keep it in sync with code.

#### Visual Builder Architecture

- Build the canvas using a headless drag-and-drop engine: **dnd-kit** or **craft.js**
- Every element on the canvas maps to an IR node
- The canvas is purely a visual editor for the IR — it never directly generates code

```
Canvas (drag/drop) ↔ IR (source of truth) ↔ Code Compiler ↔ Preview
```

#### Bi-directional Sync

- **Design → Code**: When a user moves/resizes a component on the canvas, update the IR node → re-run the IR → Code compiler → hot-reload preview
- **Code → Design**: When a user edits code, parse the AST (using **@babel/parser** or **tree-sitter**) → reconstruct IR → re-render canvas
- The IR is always the **single source of truth**. The canvas and the code editor are two views of the same IR.

#### Phase 2 Deliverables

- [ ] Drag-and-drop canvas editor
- [ ] Properties panel (style, layout, event handlers)
- [ ] Code editor with Monaco Editor (VS Code's editor)
- [ ] Code ↔ Canvas bi-directional sync
- [ ] AI "fix this" / "improve this component" commands in editor
- [ ] Component library panel with 30+ components
- [ ] Asset management (images, fonts, icons)
- [ ] Multiple screen/page management

---

### Phase 3 — Scale & Production Features (Months 8–12+)

**Goal:** Platform becomes production-grade, multi-tenant, and commercially viable.

- **Multi-framework output**: Add Flutter and/or SwiftUI as IR compilation targets
- **Publishing pipeline**: One-click deploy to Expo EAS (iOS/Android), or PWA
- **Collaboration**: Real-time multiplayer editing (Yjs + WebSockets or Liveblocks)
- **Version control**: Git-backed project storage with diff views
- **Plugin marketplace**: Custom component / template ecosystem
- **Fine-tuned models**: Fine-tune on your own generated app corpus to improve quality and reduce latency
- **Usage-based billing**: Stripe metering + token tracking per generation
- **Team workspaces**: Org/team management, RBAC, shared component libraries

---

## Recommended Tech Stack

### 3.1 Frontend (Web Dashboard)

| Layer | Choice | Reasoning |
|---|---|---|
| **Framework** | Next.js 15 (App Router) | SSR, API routes, streaming support, production-grade |
| **Language** | TypeScript | Required for complex AST/IR work; type safety critical |
| **Styling** | Tailwind CSS + shadcn/ui | Rapid iteration, consistent design system |
| **Canvas Editor** | craft.js or custom with dnd-kit | craft.js gives component-tree model out of the box |
| **Code Editor** | Monaco Editor (`@monaco-editor/react`) | VS Code experience, LSP support, TypeScript IntelliSense |
| **State Management** | Zustand (global) + React Query (server state) | Lightweight, minimal boilerplate |
| **Real-time** | Yjs + PartyKit or Liveblocks | CRDT-based real-time sync for collaboration |

---

### 3.2 Backend

| Layer | Choice | Use Case |
|---|---|---|
| **API Layer** | Node.js + Fastify (or tRPC for type-safe API) | Fast, low overhead, works well with TypeScript monorepo |
| **Job Queue** | BullMQ + Redis | LLM calls are slow; offload to background workers with progress streaming |
| **Code Compiler Service** | Isolated Node.js microservice | IR → code compilation is CPU-bound; isolate it |
| **Preview Sandbox** | Sandpack (by CodeSandbox) | Browser-based bundler; renders React/React Native Web in-browser with zero server cost |
| **WebSockets** | Socket.io or native WS | Real-time preview hot-reload |
| **Auth** | Clerk | OAuth, JWT, org management out of the box |

> **Sandpack** is the key insight for preview: it runs the Metro/Webpack bundler entirely in the browser using WebAssembly. You send generated code, it hot-reloads. No cloud VM per user.

---

### 3.3 AI / LLM Integration

| Component | Choice | Reasoning |
|---|---|---|
| **Primary LLM** | Claude 3.5 Sonnet (Anthropic) | Best at structured JSON output and long-context code generation |
| **Secondary / Fast** | GPT-4o-mini or Gemini Flash | For quick iterations, autocomplete, small edits |
| **LLM Orchestration** | Vercel AI SDK or LangChain.js | Streaming, tool calling, structured output with Zod schemas |
| **Structured Output** | Zod schema + `instructor` pattern | Force LLM to emit valid IR JSON — never parse free-form code |
| **Prompt Management** | Langfuse or Promptlayer | Version prompts, A/B test, trace tokens |
| **Embeddings/Search** | OpenAI `text-embedding-3-small` | For semantic component search, template matching |
| **Vector DB** | pgvector (Postgres extension) | Store component embeddings; avoid separate infra for MVP |

#### LLM Prompt Architecture

```
System Prompt:
  - Output ONLY valid JSON conforming to the AppIR schema
  - Available components: [list with props]
  - Target framework: React Native
  - Design system: [your component library tokens]

User Prompt:
  - "[User's app description]"

Response → validate with Zod → IR → Code Compiler
```

---

### 3.4 Real-time Rendering Engine

```
Generated Code (TSX files)
       ↓
  Sandpack Core (in-browser bundler, WebAssembly)
       ↓
  React Native Web runtime
       ↓
  Rendered preview in <iframe>
```

For native-accurate preview (Phase 2+):
- **Expo Snack API**: Send code to Expo's hosted runner, get a QR code for real device testing
- **React Native Skia** + custom renderer: For pixel-perfect rendering in canvas (advanced)

---

### 3.5 Database

| Store | Choice | Use Case |
|---|---|---|
| **Primary DB** | PostgreSQL (Supabase or Neon) | Users, projects, IR snapshots, billing |
| **Cache / Queue** | Redis (Upstash for serverless) | BullMQ jobs, session cache, rate limiting |
| **File Storage** | S3-compatible (AWS S3 or Cloudflare R2) | Generated code zips, uploaded assets |
| **Vector Search** | pgvector | Component/template semantic search |
| **Real-time** | Supabase Realtime or Liveblocks | Collaborative editing state |

---

### 3.6 DevOps & Infrastructure

| Layer | Choice | Reasoning |
|---|---|---|
| **Frontend Hosting** | Vercel | Zero-config Next.js, edge functions, automatic previews |
| **Backend Services** | Railway or Render (MVP) → AWS ECS/EKS (Scale) | Railway is fast to ship; migrate to AWS when cost optimization matters |
| **Container Runtime** | Docker + Docker Compose (dev) | Local parity, easy service orchestration |
| **LLM Worker** | Separate containerized worker service | Isolate slow LLM calls, scale independently |
| **Code Preview Sandbox** | Sandpack (client-side) — zero infra | No server cost per preview |
| **CDN** | Cloudflare | Asset delivery, DDoS protection, R2 storage |
| **Monitoring** | Datadog or Sentry + Posthog | Error tracking + product analytics |
| **Secrets** | Doppler or AWS Secrets Manager | Never commit API keys |
| **IaC** | Terraform (at scale) | Reproducible infra |

---

## Technology Tradeoff Comparisons

### React Native vs Flutter

| Dimension | React Native | Flutter |
|---|---|---|
| **Code generation ease** | High — JSX is LLM-friendly, JavaScript ecosystem familiar to LLMs | Medium — Dart is less common in LLM training data |
| **Web preview** | Excellent — React Native Web renders in browser natively | Poor — Flutter Web exists but is heavy and quirky |
| **LLM code quality** | Higher — GPT-4/Claude trained on massive React Native corpus | Lower — less training data for Dart/Flutter |
| **Native performance** | Good (bridged, or new arch JSI) | Excellent — compiled to native ARM, own rendering engine |
| **Component ecosystem** | Massive (npm) | Growing (pub.dev) |
| **Bi-directional sync** | Easier — AST tooling (Babel, tree-sitter) mature | Harder — Dart AST tooling less mature |
| **Recommendation** | **Start here** | Add as Phase 3 compilation target |

> **Verdict:** Build on React Native first. Flutter output is a Phase 3 IR compilation target.

---

### Monolith vs Microservices

| Dimension | Modular Monolith | Microservices |
|---|---|---|
| **Development speed** | Fast — one repo, one deploy, shared types | Slow — network contracts, separate deployments |
| **Operational complexity** | Low | High — service discovery, distributed tracing |
| **Scaling granularity** | Coarse | Fine — scale LLM workers independently |
| **Team size fit** | 1–10 engineers | 10+ engineers, multiple teams |
| **Debugging** | Easy — single stack trace | Hard — distributed tracing required |
| **Cost (infra)** | Lower | Higher |

> **Verdict:** Start with a **modular monolith**. Extract to microservices only when a specific service is a bottleneck (almost certainly the LLM worker first).

---

### Direct Code Generation vs IR-First Generation

| Approach | Direct Code Generation | IR-First Generation |
|---|---|---|
| **Consistency** | Low — LLM output varies wildly | High — schema-validated JSON |
| **Multi-framework** | Requires separate prompts per framework | Single IR → multiple compilers |
| **Bi-directional sync** | Nearly impossible | Natural — IR is the shared state |
| **Error recovery** | Hard — syntax errors in generated code | Easy — Zod validation catches bad IR |
| **Iteration speed** | Fast to prototype | Slower upfront, much faster long-term |
| **Recommendation** | Never at production scale | **Always use this approach** |

> **Verdict:** IR-first is non-negotiable for this platform. The IR schema design is one of the most important engineering decisions you'll make.

---

### Preview Strategy: Client-side Sandpack vs Server-side VM

| Dimension | Sandpack (client-side) | Server VM (e.g., Docker per user) |
|---|---|---|
| **Cost** | Zero per preview | High — VMs are expensive |
| **Latency** | ~1–2s warm, instant hot-reload | ~5–10s cold start |
| **Native accuracy** | React Native Web only | True native emulation possible |
| **Scalability** | Infinite — runs in browser | Hard — VM pool management |
| **Security** | Browser sandbox | OS-level isolation |
| **Recommendation** | **Use for MVP and Phase 2** | Add native emulator for Phase 3 premium tier |

---

### Real-time Collaboration: Liveblocks vs Yjs + PartyKit

| Dimension | Liveblocks | Yjs + PartyKit |
|---|---|---|
| **Setup time** | Very fast — managed service | Medium — self-hosted CRDT |
| **Cost** | Usage-based, gets expensive at scale | Cheaper at scale |
| **Control** | Low — vendor dependency | High — full control |
| **Features** | Presence, cursors, comments built-in | Build everything yourself |
| **Recommendation** | **Phase 2 MVP** | Migrate in Phase 3 if cost is an issue |

---

## System Architecture Diagram

```
┌────────────────────────────────────────────────────────┐
│                    FRONTEND (Next.js)                  │
│                                                        │
│  ┌──────────────┐  ┌──────────────┐  ┌─────────────┐  │
│  │ Prompt Input │  │ Canvas Editor│  │ Code Editor │  │
│  │              │  │  (craft.js)  │  │  (Monaco)   │  │
│  └──────┬───────┘  └──────┬───────┘  └──────┬──────┘  │
│         │                 │                 │         │
│         └─────────────────▼─────────────────┘         │
│                     IR (JSON) - Source of Truth        │
│                           │                           │
│                    ┌──────▼──────┐                    │
│                    │  Sandpack   │ ← Live Preview     │
│                    │  (in-browser│   React Native Web │
│                    │  bundler)   │                    │
│                    └─────────────┘                    │
└─────────────────────────┬──────────────────────────────┘
                          │ REST / tRPC / WebSocket
┌─────────────────────────▼──────────────────────────────┐
│                    BACKEND (Fastify)                   │
│                                                        │
│  ┌──────────────┐  ┌──────────────┐  ┌─────────────┐  │
│  │  Auth (Clerk)│  │ Project API  │  │  IR → Code  │  │
│  └──────────────┘  └──────────────┘  │  Compiler   │  │
│                                      └─────────────┘  │
│  ┌──────────────────────────────────────────────────┐  │
│  │              LLM Worker (BullMQ)                 │  │
│  │   Prompt → Anthropic API → Zod validate → IR    │  │
│  └──────────────────────────────────────────────────┘  │
└──────────────┬──────────────────────────────────────────┘
               │
┌──────────────▼──────────────────────────────────────────┐
│                    DATA LAYER                           │
│  PostgreSQL (Neon)   Redis (Upstash)   S3/R2 (assets)  │
└─────────────────────────────────────────────────────────┘
```

---

## Critical Early Decisions

Make these deliberately — changing them later is expensive.

1. **Define your IR schema first.** This is the backbone of your entire system. Get it wrong and you rewrite everything. Model it after React's virtual DOM + style tokens + event handler references.

2. **Choose one target framework (React Native) and go deep** before adding Flutter. Breadth too early kills execution.

3. **Never let the LLM generate raw code directly.** Always validate through a schema. One escaped quote crashes the whole app.

4. **Use Sandpack for preview from day one.** It eliminates an entire class of infrastructure problems.

5. **Build the IR ↔ Canvas sync before bi-directional code sync.** Code ↔ canvas sync is the hardest engineering problem on this platform; don't underestimate it.

---

## MVP Stack Summary

Ship in 16 weeks with this lean, high-velocity stack.

| Layer | Technology |
|---|---|
| **Frontend** | Next.js 15 + TypeScript + Tailwind + shadcn/ui |
| **Code Editor** | Monaco Editor |
| **Preview** | Sandpack (React Native Web target) |
| **Backend** | Node.js + Fastify + tRPC |
| **LLM** | Claude 3.5 Sonnet via Vercel AI SDK (streaming) |
| **IR Schema** | Zod-validated JSON |
| **Database** | Supabase (Postgres + Auth + Realtime) |
| **Queue** | Upstash Redis + BullMQ |
| **Storage** | Cloudflare R2 |
| **Frontend Hosting** | Vercel |
| **Backend Hosting** | Railway |
| **Auth** | Clerk |
| **Monitoring** | Sentry + Posthog |

---

## Core Features

### Prompt-to-Code
- Users describe an app in natural language
- The system generates production-ready mobile app code
- Real-time rendering/preview of the generated app

### Design-to-Code
- Drag-and-drop visual UI builder
- Automatic code generation from design
- Bi-directional sync (design updates code, code updates design)
