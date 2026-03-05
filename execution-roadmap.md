# Practical Execution Roadmap
## AI-Powered Mobile App Generation Platform
### A Mentor's Guide: Fresher to Builder in 6–9 Months

> **Assumption:** 2–3 hours/day, 5–6 days/week. No prior experience with AI or mobile development required. Basic JavaScript knowledge assumed.

---

## Table of Contents

1. [Before You Start — Mindset & Setup](#before-you-start--mindset--setup)
2. [Phase 0 — Learning Foundations (Weeks 1–8)](#phase-0--learning-foundations-weeks-18)
3. [Phase 1 — Build the MVP (Weeks 9–20)](#phase-1--build-the-mvp-weeks-920)
4. [Phase 2 — Advanced Features (Weeks 21–32)](#phase-2--advanced-features-weeks-2132)
5. [Phase 3 — Scale & Polish (Weeks 33–40)](#phase-3--scale--polish-weeks-3340)
6. [Common Beginner Mistakes](#common-beginner-mistakes)
7. [Portfolio Strategy](#portfolio-strategy)
8. [Weekly Habit System](#weekly-habit-system)
9. [Resource List](#resource-list)

---

## Before You Start — Mindset & Setup

### The Most Important Thing Nobody Tells Beginners

> You will not understand everything before you build. That is not a problem — it is the process.

The #1 mistake is spending 3 months learning before writing a single line of product code. Do not do that. This roadmap is designed so you are **building from Week 1**.

### The Smallest Version of This Platform

Before planning 9 months, understand what the **absolute smallest working version** looks like:

```
User types: "Make me a to-do app"
      ↓
You send that text to Claude API
      ↓
Claude returns React Native code
      ↓
You display that code in a code block on the page
```

That is it. That is your Week 9 milestone. Everything after that is adding features to this loop.

### Environment Setup (Do This on Day 1)

```bash
# Install these before anything else
Node.js v20+        → https://nodejs.org
VS Code             → https://code.visualstudio.com
Git                 → https://git-scm.com

# VS Code extensions to install
- Prettier (formatting)
- ESLint (code quality)
- TypeScript Error Lens (see TS errors inline)
- Tailwind CSS IntelliSense

# Create accounts (all free tiers)
- GitHub              → store your code
- Vercel              → deploy your frontend
- Anthropic Console   → Claude API key
- Supabase            → free PostgreSQL database
```

---

## Phase 0 — Learning Foundations (Weeks 1–8)

**Goal:** Learn just enough to build Phase 1. No more. No less.

> You are NOT trying to master these topics. You are trying to know enough to build and Google the rest.

---

### Week 1 — JavaScript & TypeScript Basics

**What to learn:**
- Variables, functions, arrays, objects, async/await
- TypeScript: types, interfaces, the `?` operator
- ES6+: destructuring, spread operator, arrow functions

**Daily breakdown:**
```
Day 1–2: JavaScript fundamentals (if you know JS, skip to Day 3)
Day 3–4: TypeScript basics — types, interfaces, generics (just the basics)
Day 5–6: Async/await, fetch API, JSON handling
Day 7:   Build: Fetch data from a public API and display it on a webpage
```

**Build this (Day 7 mini-project):**
```javascript
// Fetch a joke from a public API and display it
async function getJoke() {
  const res = await fetch('https://official-joke-api.appspot.com/random_joke')
  const data = await res.json()
  document.getElementById('joke').innerText = data.setup + ' — ' + data.punchline
}
```

**Why:** Every part of your platform talks to APIs and handles async data. This is the foundation.

---

### Week 2 — React Fundamentals

**What to learn:**
- Components, props, state (`useState`)
- `useEffect` hook
- Event handling
- Conditional rendering, lists with `.map()`

**Daily breakdown:**
```
Day 1–2: React components, JSX, props
Day 3–4: useState, controlled inputs (forms)
Day 5–6: useEffect, data fetching in React
Day 7:   Build: A simple AI chat UI (input box + message list, no real AI yet)
```

**Build this (Day 7 mini-project):**
A chat interface where you type a message and it appears in a message list. Fake the AI response for now (just echo back "You said: [message]").

**Why:** Your prompt-to-code feature is essentially a fancy chat interface.

---

### Week 3 — Next.js + Styling

**What to learn:**
- What Next.js adds on top of React (file-based routing, API routes)
- Create a Next.js project (`npx create-next-app`)
- Tailwind CSS: utility classes, responsive design
- shadcn/ui: pre-built components (Button, Input, Card)

**Daily breakdown:**
```
Day 1–2: Next.js project structure, pages, routing
Day 3:   Tailwind CSS basics — flex, grid, spacing, colors
Day 4:   Install and use shadcn/ui components
Day 5–6: Build a multi-page layout with navigation
Day 7:   Build: A landing page for your AI app generator (fake, no functionality)
```

**Build this (Day 7 mini-project):**
Build the landing page of your platform. Header with logo, hero section with prompt input, features section, footer. No backend yet — just the UI.

**Why:** You'll use this exact page in your MVP.

---

### Week 4 — Calling LLM APIs

**What to learn:**
- How REST APIs work (request, response, headers, body)
- How to use the Anthropic Claude API (or OpenAI API — they're very similar)
- Next.js API routes (server-side code in `/app/api/`)
- Streaming responses (text appears word by word)

**Daily breakdown:**
```
Day 1:   Read Anthropic API docs, get your API key
Day 2:   Make your first Claude API call from Node.js (in terminal, no UI)
Day 3:   Create a Next.js API route that calls Claude
Day 4–5: Connect your Week 3 UI to the real API (type → API route → Claude → display)
Day 6:   Add streaming so text appears word by word (Vercel AI SDK makes this easy)
Day 7:   Build: A working AI chat that calls Claude API with streaming
```

**Build this (Day 7 milestone) — YOUR FIRST REAL FEATURE:**
```
User types: "Write me a poem about coding"
→ API route sends to Claude
→ Response streams back word by word
→ Displayed in chat UI
```

This is real. This works. This is exciting.

**Install Vercel AI SDK — it handles streaming for you:**
```bash
npm install ai @anthropic-ai/sdk
```

```typescript
// app/api/chat/route.ts
import { anthropic } from '@ai-sdk/anthropic'
import { streamText } from 'ai'

export async function POST(req: Request) {
  const { prompt } = await req.json()
  const result = streamText({
    model: anthropic('claude-3-5-sonnet-20241022'),
    prompt: prompt,
  })
  return result.toDataStreamResponse()
}
```

**Common mistake here:** Calling the Claude API directly from the browser (client-side). Never do this — your API key gets exposed. ALWAYS call LLMs from a server-side API route.

---

### Week 5 — React Native Basics (Just Enough)

**What to learn:**
- What React Native is and how it differs from React
- Core components: `View`, `Text`, `TextInput`, `TouchableOpacity`, `FlatList`, `StyleSheet`
- How Expo works
- How to run a React Native app in Expo Snack (browser-based, no install needed)

**Daily breakdown:**
```
Day 1:   Read React Native docs intro. Open Expo Snack (snack.expo.dev) in browser.
Day 2–3: Build a simple React Native screen with View, Text, TouchableOpacity
Day 4:   Learn StyleSheet (similar to CSS but different syntax)
Day 5–6: Build a 2-screen app with navigation (React Navigation)
Day 7:   Build: A React Native to-do app in Expo Snack
```

**Why React Native and not Flutter:** Claude knows React Native FAR better than it knows Flutter. Your AI will generate better code.

**Important:** You do NOT need to install React Native locally. Use Expo Snack in the browser for all learning.

---

### Week 6 — Databases & Auth

**What to learn:**
- What Supabase is (Postgres + Auth as a service)
- SQL basics: CREATE TABLE, INSERT, SELECT, WHERE
- Supabase client library
- Authentication: sign up, sign in, sessions

**Daily breakdown:**
```
Day 1:   Create a Supabase project. Explore the dashboard.
Day 2:   Learn SQL basics (SELECT, INSERT, UPDATE) in Supabase SQL editor
Day 3:   Connect Supabase to your Next.js project
Day 4–5: Add auth: email sign-up, sign-in, protected routes
Day 6:   Save and retrieve data from Supabase (e.g., save chat messages)
Day 7:   Build: Add auth + save user's prompts to Supabase
```

**Install Supabase:**
```bash
npm install @supabase/supabase-js @supabase/ssr
```

---

### Week 7 — The Intermediate Representation (IR) Concept

**This week is conceptual but critical.** Before building the MVP, you must understand the IR.

**What is the IR and why does it matter:**

The IR is a JSON object that describes your app. It is the "source of truth" that everything in your platform reads and writes. The AI generates it. The code compiler reads it. The canvas editor edits it. The preview renders it.

```json
{
  "screens": [
    {
      "id": "screen_home",
      "name": "Home",
      "components": [
        {
          "id": "comp_001",
          "type": "Text",
          "props": { "content": "Hello World" },
          "style": { "fontSize": 24, "color": "#000" }
        },
        {
          "id": "comp_002",
          "type": "Button",
          "props": { "label": "Tap Me" },
          "style": { "backgroundColor": "#6366f1" }
        }
      ]
    }
  ]
}
```

**Daily breakdown:**
```
Day 1:   Design your IR schema on paper. What fields does each component need?
Day 2:   Write Zod schemas that validate your IR
Day 3:   Write a function: IR → React Native code (just Text and View for now)
Day 4:   Write a function: Claude output → validated IR (with Zod)
Day 5–6: Test your IR compiler with 5 different IR inputs
Day 7:   Build: IR validator + IR → code function for 5 component types
```

**Install Zod:**
```bash
npm install zod
```

**Week 7 output — your IR compiler (simplified):**
```typescript
function compileIRToCode(ir: AppIR): string {
  const components = ir.screens[0].components.map(comp => {
    if (comp.type === 'Text') {
      return `<Text style={${JSON.stringify(comp.style)}}>${comp.props.content}</Text>`
    }
    if (comp.type === 'Button') {
      return `<TouchableOpacity style={${JSON.stringify(comp.style)}}>
        <Text>${comp.props.label}</Text>
      </TouchableOpacity>`
    }
    return ''
  })
  return `
import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';

export default function HomeScreen() {
  return (
    <View style={{ flex: 1, padding: 20 }}>
      ${components.join('\n      ')}
    </View>
  );
}`
}
```

---

### Week 8 — Sandpack (Live Preview in Browser)

**What to learn:**
- What Sandpack is (CodeSandbox's in-browser bundler)
- How to embed Sandpack in a React component
- How to send code files to Sandpack and get a live preview
- How to hot-reload Sandpack when code changes

**Daily breakdown:**
```
Day 1:   Read Sandpack docs. Install @codesandbox/sandpack-react
Day 2–3: Embed a basic Sandpack preview in your Next.js page
Day 4:   Send hardcoded React Native code to Sandpack → see it render
Day 5:   Connect Sandpack to your Week 7 IR compiler
Day 6:   Test: IR JSON → compile → Sandpack renders it live
Day 7:   Build: A page where you edit JSON and see the app update in real-time
```

**Install Sandpack:**
```bash
npm install @codesandbox/sandpack-react
```

```tsx
// Basic Sandpack setup
import { Sandpack } from "@codesandbox/sandpack-react"

export default function Preview({ code }: { code: string }) {
  return (
    <Sandpack
      template="react"
      files={{
        "/App.js": code,
      }}
      options={{ showPreview: true, showTabs: false }}
    />
  )
}
```

**End of Phase 0 Checkpoint:**
By end of Week 8, you should be able to:
- [ ] Call Claude API from a Next.js API route
- [ ] Have Claude return a valid IR JSON
- [ ] Compile that IR JSON to React Native code
- [ ] Render that code live in Sandpack

If you can do all four, you are ready for Phase 1.

---

## Phase 1 — Build the MVP (Weeks 9–20)

**Goal:** Build a working product that a real user can use. Prompt in → App preview out.

### Week 9 — Connect All the Pieces (First Working Prototype)

This is the most important week. You are connecting everything you built in Phase 0.

```
[Prompt Input] → [API Route] → [Claude API] → [IR JSON] → [Compiler] → [Sandpack Preview]
```

**Daily breakdown:**
```
Day 1:   Create a new Next.js project (clean slate for the product)
Day 2:   Build the UI: prompt input box + loading state + Sandpack preview side-by-side
Day 3:   Wire the API route: prompt → Claude with structured output (Zod schema for IR)
Day 4:   Wire the compiler: IR → code string
Day 5:   Wire Sandpack: receive code string → render live
Day 6:   End-to-end test: type "make a login screen" → see it render
Day 7:   Fix bugs. Show someone. Get feedback.
```

**The prompt that forces Claude to return IR (not raw code):**
```
You are a mobile app code generator. When given a description, you MUST respond
with ONLY a valid JSON object matching this exact schema. Do not include any
explanation, markdown, or code blocks. Just the raw JSON.

Schema:
{
  "screens": [{ "id": string, "name": string, "components": [...] }]
}

Each component must have: id, type (one of: Text, View, Button, TextInput, Image),
props (object), style (object with React Native style properties).
```

**Milestone check:** By end of Day 6, you have a working (rough) product. It breaks on complex prompts. That is fine.

---

### Week 10 — Make It Not Break

The first version breaks constantly. This week is about hardening it.

```
Day 1:   Handle LLM returning invalid JSON → retry logic (max 2 retries)
Day 2:   Add error messages shown to user (not just console.log)
Day 3:   Handle empty/vague prompts → show a helpful message
Day 4:   Add 8 more component types to your compiler
         (FlatList, Image, ScrollView, Switch, Slider, TextInput, Icon, SafeAreaView)
Day 5:   Test 20 different prompts. Fix the top 5 most common failures.
Day 6:   Add a loading spinner + "Generating your app..." status message
Day 7:   Show to 3 people. Watch them use it. Note every confusion.
```

---

### Week 11 — Auth + Save Projects

Without saving, users lose their work on refresh. This is unacceptable.

```
Day 1–2: Add Supabase auth (email sign-up + Google OAuth)
Day 3:   Create projects table in Supabase
Day 4:   Auto-save: every generation saves to DB with { userId, prompt, ir, createdAt }
Day 5:   Projects list page: show all saved projects with thumbnails (screenshots)
Day 6:   Load a saved project: click → load IR → recompile → preview renders
Day 7:   Test full flow: sign up → generate → save → log out → log in → open saved project
```

**Supabase projects table:**
```sql
CREATE TABLE projects (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name        TEXT NOT NULL DEFAULT 'Untitled App',
  prompt      TEXT,
  ir_snapshot JSONB NOT NULL,
  created_at  TIMESTAMPTZ DEFAULT now(),
  updated_at  TIMESTAMPTZ DEFAULT now()
);

-- Row Level Security: users can only see their own projects
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users own their projects"
  ON projects FOR ALL USING (auth.uid() = user_id);
```

---

### Week 12 — Prompt Iteration (Edit Your App)

Right now users generate an app and that's it. They need to be able to refine it.

```
Day 1–2: Add a "refine" prompt input below the preview
          User types: "Make the button blue and add a header"
          System sends: current IR + new instruction to Claude
Day 3:   Claude returns updated IR (only the changed parts)
Day 4:   Merge updated IR with existing IR
Day 5:   Preview hot-reloads with changes
Day 6:   Add version history: each refinement saves a new version
Day 7:   Test: generate → refine 5 times → undo to version 2
```

**The refinement prompt:**
```
Here is the current app's IR:
${JSON.stringify(currentIR)}

The user wants this change: "${userRefinementPrompt}"

Return the COMPLETE updated IR JSON with the requested changes applied.
```

---

### Week 13 — Export Code

Users need to actually use what they generate. Add code download.

```
Day 1:   Create a ZIP download button
Day 2:   On click: compile IR → generate all files (App.tsx, screens/, package.json)
Day 3:   Use jszip library to bundle files into a downloadable ZIP
Day 4:   Test: download ZIP → unzip → run npx expo start → app loads
Day 5:   Add instructions modal: "How to run your app locally"
Day 6:   Add copy-to-clipboard for individual screen files
Day 7:   Polish: add file tree viewer in the UI showing all generated files
```

```bash
npm install jszip file-saver
```

---

### Week 14 — UI Polish & Performance

The app works but looks rough. This week makes it feel real.

```
Day 1:   Device frame around the preview (iPhone/Android chrome)
Day 2:   Split-view layout: prompt history left, preview right, code tab toggle
Day 3:   Add component type icons in the generated code panel
Day 4:   Improve prompt suggestions: show 6 example prompts on empty state
Day 5:   Add keyboard shortcut: Cmd+Enter to generate
Day 6:   Mobile-responsive layout (works on tablet)
Day 7:   Performance: debounce preview updates, lazy load Monaco editor
```

---

### Week 15 — Deploy to Production

Your app has been running on localhost. It's time to put it on the internet.

```
Day 1:   Push code to GitHub (create a new repo)
Day 2:   Deploy to Vercel (connect GitHub repo → auto-deploy)
Day 3:   Set up environment variables in Vercel dashboard
         (ANTHROPIC_API_KEY, SUPABASE_URL, SUPABASE_ANON_KEY)
Day 4:   Test production build: everything works? CORS issues? Fix them.
Day 5:   Get a custom domain (optional but recommended: yourappname.com ~$12/year)
Day 6:   Set up basic monitoring: Sentry (free tier, catches errors)
Day 7:   Share with 10 people. Collect real feedback.
```

---

### Weeks 16–17 — Bug Bash & Feedback Loop

Do NOT add new features. Fix what's broken.

```
Week 16:
  Day 1–2: Review Sentry errors from real users
  Day 3–4: Fix top 10 errors/bugs
  Day 5–6: Improve error messages (no more "Something went wrong")
  Day 7:   Interview 3 users. Ask: "What confused you? What did you expect?"

Week 17:
  Day 1–2: Fix the issues users reported
  Day 3–4: Improve the prompt-to-IR quality (refine your system prompt)
  Day 5–6: Add 5 more component types based on what users asked for
  Day 7:   Re-test with same users. Did it improve?
```

---

### Weeks 18–19 — Rate Limiting + Basic Billing Setup

Free infinite usage is not sustainable and prevents real launches.

```
Week 18:
  Day 1–2: Add rate limiting: 10 free generations per day (store in Supabase)
  Day 3:   Show "You've used 7/10 free generations today" counter
  Day 4:   "Upgrade" button (no actual payment yet — just collect emails)
  Day 5–6: Usage tracking table in Supabase

Week 19:
  Day 1–2: Set up Stripe (test mode)
  Day 3–4: Create Pro plan: $9/month → 100 generations/day
  Day 5:   Stripe webhook → update user plan in Supabase on payment
  Day 6:   Test full payment flow (use Stripe test card: 4242 4242 4242 4242)
  Day 7:   Deploy + monitor
```

---

### Week 20 — MVP Completion Checkpoint

**Your MVP is complete when a user can:**

- [ ] Sign up without help
- [ ] Describe an app in plain English
- [ ] See a live preview of that app
- [ ] Refine it with follow-up prompts
- [ ] Save the project
- [ ] Come back and find it later
- [ ] Export the code as a ZIP
- [ ] Upgrade to Pro if they want more generations

**Realistic state at Week 20:**
- Handles ~60% of prompts well
- ~10 component types supported
- Preview works for simple apps
- 20–50 active test users
- Maybe 2–3 paying users

That is enough. That is real. Ship it.

---

## Phase 2 — Advanced Features (Weeks 21–32)

**Goal:** Add the drag-and-drop visual builder and code sync. This is the hard part.

> **Warning:** Phase 2 is significantly harder than Phase 1. The bi-directional sync between code and canvas is the most technically challenging feature you will build. Budget extra time and be patient with yourself.

---

### Weeks 21–22 — The Canvas Editor (Design side)

**What you're building:** A visual canvas where users can click, drag, and drop components.

```
Week 21: Learn craft.js (canvas editor library)
  Day 1–2: Read craft.js docs. Run the examples.
  Day 3–4: Set up craft.js in your project with 5 basic components
  Day 5–6: Connect craft.js component tree to your IR (one direction only: canvas → IR)
  Day 7:   Build: Drag a Text and Button onto canvas → IR updates in console

Week 22: Build the properties panel
  Day 1–2: When a component is selected, show its props/style in a side panel
  Day 3–4: Edit props in the panel → update IR → canvas re-renders
  Day 5:   Add component library panel: draggable components on the left
  Day 6:   Multiple screens: tab bar to switch between screens
  Day 7:   Test: Build a 2-screen app entirely via drag-and-drop
```

**Install craft.js:**
```bash
npm install @craftjs/core
```

---

### Weeks 23–24 — Canvas → Code → Preview Sync

Connect the canvas to your existing code compiler and preview.

```
Week 23: Canvas → Code direction
  Day 1–2: When IR changes (from canvas), trigger your IR compiler
  Day 3–4: Send compiled code to Sandpack → preview updates
  Day 5:   Debounce: only recompile after 150ms of inactivity
  Day 6:   Only recompile the screen that changed (not the whole app)
  Day 7:   Test: drag a button on canvas → preview updates in <500ms

Week 24: Add Monaco code editor tab
  Day 1–2: Install @monaco-editor/react. Show generated code in Monaco.
  Day 3:   Add tab toggle: "Code" | "Design" | "Preview"
  Day 4:   When canvas changes → Monaco code updates automatically
  Day 5:   Styling: Monaco with dark theme, proper indentation
  Day 6:   Add copy-to-clipboard button in code view
  Day 7:   Test full flow: prompt → canvas view → code view → preview
```

---

### Weeks 25–26 — Code → Canvas Sync (The Hard Part)

**This is genuinely difficult.** Budget extra time. It will not work perfectly. That is OK.

```
Week 25: Build the AST parser
  Day 1:   Install @babel/parser. Read the docs.
  Day 2:   Parse a React Native component string → get the AST in console
  Day 3–4: Walk the AST: extract component types and their props
  Day 5–6: Build IR reconstructor: AST analysis → IR JSON
  Day 7:   Test: give it HomeScreen.tsx → get back IR → compare to original

Week 26: Connect code editor to canvas
  Day 1–2: Monaco onChange → debounce 500ms → parse AST
  Day 3:   If parse succeeds → update IR → canvas re-renders
  Day 4:   If parse fails → show error indicator, do NOT update canvas
  Day 5:   Define sync boundary: what syncs vs what doesn't
           (JSX structure syncs; useState/useEffect does NOT sync)
  Day 6:   Test: type in Monaco → canvas updates for component changes
  Day 7:   Bug fixing session. This will be messy. That is normal.
```

**Beginner tip for code → canvas sync:**
Start with a very limited sync scope. Only sync:
- Adding/removing JSX elements
- Changing text content
- Changing backgroundColor, fontSize, padding, margin

Do NOT try to sync business logic, hooks, or complex expressions. You will get stuck.

---

### Weeks 27–28 — Undo/Redo + Version History

```
Week 27: Undo/Redo
  Day 1–2: Implement command pattern: every IR mutation is a reversible command
  Day 3:   Undo stack (store last 50 commands)
  Day 4:   Cmd+Z to undo, Cmd+Shift+Z to redo
  Day 5–6: Test edge cases: undo after save, undo on empty stack
  Day 7:   Visual undo history panel (optional)

Week 28: Version snapshots
  Day 1–2: Save IR snapshot every 5 minutes + on explicit save
  Day 3:   Version list panel: show timestamps + optional user labels
  Day 4:   Restore a version: click version → confirm dialog → IR replaced
  Day 5:   Visual diff between two versions (which components changed)
  Day 6–7: Test + polish
```

---

### Weeks 29–30 — Component Library + Templates

```
Week 29: Expand component library
  Day 1–2: Add 15 more components:
           Card, Modal, BottomSheet, TabBar, SearchBar, Avatar,
           Badge, Chip, Divider, Header, Spinner, Toast, Toggle,
           DatePicker, Rating
  Day 3–4: Each component needs: default props, default style, canvas preview
  Day 5–6: Add component search in the sidebar
  Day 7:   Test all 20+ components in canvas + preview

Week 30: App templates
  Day 1–2: Create 5 starter templates (IR snapshots):
           - To-do app
           - Login/Signup flow
           - E-commerce product list
           - Social feed
           - Settings screen
  Day 3:   "Start from template" modal on new project creation
  Day 4:   "Apply template" to existing project
  Day 5–6: Template thumbnails (screenshot Sandpack preview, save to R2)
  Day 7:   Test + polish
```

---

### Weeks 31–32 — AI-Assist in Canvas

**Add AI as a co-pilot inside the canvas editor.**

```
Week 31: "AI Fix" button
  Day 1–2: Right-click on any component → "Ask AI to improve this"
  Day 3:   Sends: { selectedComponent: IR node, instruction: userPrompt }
  Day 4:   Claude returns updated IR node → merges into app IR
  Day 5:   "Explain this component" → Claude describes what the component does
  Day 6–7: Test + edge cases

Week 32: AI component suggestions
  Day 1–2: After dropping a blank View onto canvas,
           show AI suggestion: "This looks like a card — want me to style it?"
  Day 3–4: Style suggestions based on what's already in the app (color matching)
  Day 5:   "Complete this screen" button: sends partial IR → Claude fills gaps
  Day 6–7: Test + polish + Phase 2 review
```

---

## Phase 3 — Scale & Polish (Weeks 33–40)

**Goal:** Make it production-ready, performant, and portfolio-worthy.

---

### Weeks 33–34 — Performance Optimization

```
Week 33: Frontend performance
  Day 1:   Audit with Lighthouse. Get baseline scores.
  Day 2:   Code split: lazy-load Monaco, Sandpack, craft.js (they are huge)
  Day 3:   Move AST parsing to a Web Worker (stops blocking the UI)
  Day 4:   Virtualize the component tree (if app has 100+ components)
  Day 5–6: Reduce Sandpack re-renders: only update changed files
  Day 7:   Re-audit Lighthouse. Target: >85 Performance score.

Week 34: Backend performance
  Day 1–2: Cache compiled code: same IR hash → skip recompile, return cached result
  Day 3:   Add background jobs for slow operations (export ZIP, EAS build)
  Day 4:   Optimize Supabase queries: add indexes on user_id, project_id
  Day 5:   Add Redis caching for frequently accessed data (Upstash free tier)
  Day 6–7: Load test: what happens with 50 simultaneous users?
```

---

### Weeks 35–36 — Security & Reliability

```
Week 35: Security hardening
  Day 1:   Add Content Security Policy headers
  Day 2:   Audit API routes: is every route checking auth?
  Day 3:   Input validation with Zod on every API route
  Day 4:   Rate limiting on all endpoints (not just generation)
  Day 5:   Check generated code cannot escape Sandpack iframe
  Day 6–7: Security checklist review

Week 36: Reliability
  Day 1–2: Add comprehensive error boundaries in React
  Day 3:   Improve retry logic for failed LLM calls
  Day 4:   Add health check endpoint + uptime monitoring (Better Uptime, free)
  Day 5:   Database backup strategy (Supabase daily backups are automatic)
  Day 6–7: Disaster recovery test: what if Supabase goes down? Anthropic API?
```

---

### Weeks 37–38 — Collaboration Features

```
Week 37: Share projects
  Day 1–2: Public shareable link for any project (read-only view)
  Day 3:   Fork a shared project: create your own copy
  Day 4:   Embed preview: <iframe> embed code for portfolios
  Day 5–6: Social sharing meta tags (preview image when link shared on Twitter/LinkedIn)
  Day 7:   Community gallery: opt-in showcase of public projects

Week 38: Basic real-time collaboration (optional, hard)
  Day 1:   Research Liveblocks or PartyKit (pick one, read docs)
  Day 2–3: Implement presence (show who else is viewing a project)
  Day 4–5: Sync IR changes between two open tabs/users
  Day 6–7: Test + polish
```

---

### Weeks 39–40 — Final Polish & Launch Preparation

```
Week 39: UX polish
  Day 1:   Onboarding tour for new users (Intro.js or Shepherd.js)
  Day 2:   Empty states: what does an empty project list look like?
  Day 3:   Mobile-responsive UI (some users will visit from phone)
  Day 4:   Keyboard shortcuts cheat sheet
  Day 5:   Improve error messages everywhere (no jargon, clear guidance)
  Day 6–7: User acceptance testing: get 5 fresh eyes on it

Week 40: Launch preparation
  Day 1–2: Write product documentation (how to use each feature)
  Day 3:   Record a 2-minute demo video (use Loom)
  Day 4:   Prepare Product Hunt launch post
  Day 5:   Submit to Product Hunt (schedule for Tuesday morning EST)
  Day 6–7: Monitor, respond to comments, fix critical launch-day bugs
```

---

## Common Beginner Mistakes

These are the exact mistakes most beginners make. Read this before starting.

---

### Mistake 1: Tutorial Hell — Learning Instead of Building

**What happens:** You spend 3 months watching tutorials and reading docs before writing a single line of product code.

**The reality:** You learn React by building with React. Tutorials give you 20% of what you need. The other 80% comes from getting stuck and figuring it out.

**Fix:** After each learning week in Phase 0, build the mini-project. You will feel "not ready." Build anyway.

---

### Mistake 2: Trying to Build Everything at Once

**What happens:** You try to build the canvas editor, the code editor, the AI integration, the auth, and the billing all in the first month.

**The reality:** Your Week 9 prototype that does ONE thing (prompt → preview) is more valuable than a half-finished product with 10 features.

**Fix:** Follow the roadmap in order. Do not skip to Phase 2 before Phase 1 is working.

---

### Mistake 3: Letting LLMs Generate Raw Code Directly

**What happens:** You tell Claude "generate a React Native app" and try to render whatever it returns. It works 40% of the time and breaks the other 60%.

**The reality:** LLM output is unpredictable. Syntax errors, wrong imports, hallucinated components.

**Fix:** Force Claude to generate IR JSON. Then YOUR compiler generates code. You control the output format, not the LLM.

---

### Mistake 4: Not Deploying Early

**What happens:** You spend 4 months building on localhost and then spend 2 weeks debugging deployment issues.

**The reality:** Deploying early surfaces environment issues (CORS, env vars, SSL) early when they are easy to fix.

**Fix:** Deploy to Vercel at Week 15. Yes, even if it's embarrassing.

---

### Mistake 5: Building the Canvas Before the Prompt Engine

**What happens:** You think the drag-and-drop canvas is the "cool" part so you start there. You spend 8 weeks building a canvas editor that connects to nothing.

**The reality:** The canvas is only useful when it connects to the IR, which connects to the compiler, which connects to the preview. Build the pipeline first, then the UI on top.

**Fix:** Follow the order: IR schema → compiler → preview → prompt engine → canvas.

---

### Mistake 6: Trying to Sync Everything in Code → Canvas Direction

**What happens:** You try to make EVERY code change reflect in the canvas, including business logic, hooks, complex expressions.

**The reality:** This is unsolvable for arbitrary code. Even professional tools like Framer and Builder.io have limited sync boundaries.

**Fix:** Define a clear sync boundary on Day 1 of Week 25. Sync: JSX structure, props, styles. Do NOT sync: hooks, functions, state logic.

---

### Mistake 7: Ignoring Error States

**What happens:** Your app crashes silently. Users see a white screen. They leave and never come back.

**The reality:** Users will enter weird prompts. The LLM will return invalid JSON. The compiler will fail. The Sandpack will timeout. All of these are normal and expected.

**Fix:** Add a try/catch around EVERY async operation. Show a human-readable error message. Log to Sentry.

---

### Mistake 8: Skipping the Feedback Loop

**What happens:** You build in isolation for 5 months, convinced you know what users want.

**The reality:** You are wrong about what users want. You always are. The sooner you find out, the less wasted work.

**Fix:** Show working (even rough) software to real people after Week 9, Week 15, Week 20. Watch them. Say nothing. Note what confuses them.

---

### Mistake 9: Underestimating Phase 2

**What happens:** You assume Phase 2 (canvas + sync) is similar difficulty to Phase 1.

**The reality:** Bi-directional code/canvas sync is 3× harder than the entire prompt engine. The AST parsing, IR reconstruction, and CRDT conflict resolution are genuinely difficult engineering problems.

**Fix:** Add 2-week buffers to Phase 2 estimates. Do not promise the canvas feature to users until it's fully working.

---

### Mistake 10: Exposing Your API Keys

**What happens:** You put `ANTHROPIC_API_KEY` in a client-side JavaScript file. Your key gets scraped. You get a $5,000 API bill.

**The reality:** This happens to beginners constantly.

**Fix:** API keys go in `.env.local` (never commit this file). They are only used in server-side Next.js API routes (`/app/api/`), never in client-side components.

---

## Portfolio Strategy

Building this platform is the portfolio. Here's how to present it to maximize impact.

---

### What to Showcase and How

#### 1. The Demo Video (Most Important)

Record a 2-minute Loom video showing:
```
0:00 – 0:15  → "Here's the problem: building a mobile app requires months of learning"
0:15 – 0:45  → Live demo: type "build a fitness tracking app" → see it generate
0:45 – 1:15  → Live demo: drag to rearrange components → code updates live
1:15 – 1:45  → Show the generated code: "This is production-ready React Native"
1:45 – 2:00  → "I built this in X months. Here's the GitHub."
```

Put this video as the first thing on your README and portfolio site.

#### 2. The GitHub Repository

Your repo demonstrates engineering discipline. Structure it well:

```
README.md                    ← Demo GIF at top, clear description, tech stack
├── Architecture section     ← Link to your HLD document
├── Setup instructions       ← Works in <5 minutes
├── Feature list             ← Bullet points with screenshots
└── What I learned           ← Shows self-awareness and growth
```

Write clear commit messages. Reviewers DO look at commit history.

#### 3. The Technical Blog Post

Write one post (500–800 words) titled:
**"How I Built an AI App Generator: The IR Pattern That Made It Possible"**

Cover:
- The problem you solved
- Why you chose the IR approach over direct code generation
- One specific hard problem and how you solved it (bi-directional sync)
- What you'd do differently

Post it on: dev.to, Medium, Hashnode, your personal site. Share on LinkedIn.

This demonstrates you can **think about** engineering, not just code it.

#### 4. The Live Demo

Your deployed app IS your portfolio piece. Make sure:
- It loads in under 3 seconds
- The first generation works without sign-up (or sign-up is < 30 seconds)
- There are sample prompts shown so people know what to type
- The error states are handled gracefully

When someone asks "can I see your work?", you send one link.

#### 5. What To Emphasize in Job Applications

| If applying for... | Highlight this |
|---|---|
| **Frontend engineer** | Canvas editor, Monaco integration, Sandpack, React performance |
| **Full-stack engineer** | End-to-end pipeline, API design, auth, database schema |
| **AI/ML engineer** | IR approach, prompt engineering, structured output, LLM orchestration |
| **Backend engineer** | BullMQ workers, PostgreSQL schema, API design, rate limiting |

#### 6. The "I Built a Real Product" Angle

Most candidates have toy projects (to-do apps, weather apps). You have:
- A product with real users
- Billing integration (Stripe)
- A novel engineering challenge (bi-directional sync)
- Production deployment

In interviews, say: *"I built and launched an AI-powered mobile app generator. It has X active users and Y paying subscribers. Here's the most interesting technical challenge I solved..."*

That framing gets attention.

---

## Weekly Habit System

Consistency beats intensity. 2–3 focused hours/day beats 12-hour weekend binges.

### Daily Routine (2.5 hours)

```
30 min — Learning block (new concept or doc reading)
90 min — Building block (focused coding on current milestone)
30 min — Review block (test what you built, fix bugs, commit)
```

### Weekly Routine

```
Monday     → Plan the week. Read current milestone. Set up tasks.
Tue–Fri    → Build. Follow the daily routine.
Saturday   → Build the week's mini-project or milestone deliverable.
Sunday     → Review. What did you learn? What's next? Update notes.
```

### Tracking Progress

Keep a `learning-log.md` file in your repo:
```markdown
## Week 4 — LLM APIs
- Learned: How to call Anthropic API, streaming responses
- Built: Working AI chat with Claude
- Struggled with: CORS errors when calling API from client (fixed: moved to API route)
- Next week: React Native basics
```

This becomes part of your portfolio. It shows your thinking process.

### When You Get Stuck (You Will)

```
1. Try to solve it for 25 minutes on your own
2. Google the exact error message
3. Ask ChatGPT/Claude with your specific code + error
4. Post on Stack Overflow (forces you to articulate the problem clearly)
5. Sleep on it (seriously — overnight often solves it)
```

Do NOT skip steps. Going straight to asking AI makes you dependent and slows your actual learning.

---

## Resource List

### Free Learning Resources

| Topic | Resource | Time |
|---|---|---|
| TypeScript | TypeScript Handbook (typescriptlang.org) | 4–6 hours |
| React | react.dev official tutorial | 8–10 hours |
| Next.js | nextjs.org/learn | 4–6 hours |
| Tailwind CSS | tailwindcss.com/docs (just read reference) | 2–3 hours |
| Supabase | supabase.com/docs/guides/getting-started | 3–4 hours |
| React Native | reactnative.dev/docs/getting-started | 4–5 hours |
| Vercel AI SDK | sdk.vercel.ai/docs | 2–3 hours |
| Sandpack | sandpack.codesandbox.io/docs | 2–3 hours |
| craft.js | craft.js.org/docs | 3–4 hours |
| Zod | zod.dev | 1–2 hours |

### Tools & Services (All Have Free Tiers)

| Service | Purpose | Free Tier |
|---|---|---|
| Vercel | Frontend hosting | Unlimited personal projects |
| Supabase | Database + Auth | 2 free projects, 500MB storage |
| Anthropic | Claude API | $5 free credits on signup |
| Upstash | Redis | 10,000 commands/day |
| Cloudflare R2 | File storage | 10GB/month |
| Sentry | Error monitoring | 5,000 errors/month |
| Loom | Demo video recording | Unlimited (with watermark) |
| Better Uptime | Uptime monitoring | 10 monitors free |

### Key Libraries

```bash
# Core
npm install next react react-dom typescript

# Styling
npm install tailwindcss @shadcn/ui

# AI
npm install ai @ai-sdk/anthropic

# Validation
npm install zod

# Database
npm install @supabase/supabase-js @supabase/ssr

# Preview
npm install @codesandbox/sandpack-react

# Canvas editor
npm install @craftjs/core

# Code editor
npm install @monaco-editor/react

# AST parsing (Phase 2)
npm install @babel/parser @babel/traverse @babel/generator

# File export
npm install jszip file-saver

# Queue (if needed in Phase 3)
npm install bullmq ioredis
```

---

## Timeline Summary

| Phase | Weeks | What You Have at the End |
|---|---|---|
| Phase 0 — Learning | 1–8 | Fundamentals + working components |
| Phase 1 — MVP | 9–20 | Deployed product with real users |
| Phase 2 — Advanced | 21–32 | Canvas editor + bi-directional sync |
| Phase 3 — Scale | 33–40 | Production-ready, portfolio-ready |

**Total: ~40 weeks (9–10 months) at 2–3 hours/day**

If you can do 4–5 hours/day, compress this to 5–6 months.

---

## Final Note From Your Mentor

You will feel like giving up around Week 6 (when the concepts feel abstract), Week 10 (when everything breaks in production), and Week 26 (when bi-directional sync doesn't work right).

Every builder feels this. It is not a sign you should stop. It is a sign you are doing hard things.

The builders who ship are not the ones who didn't struggle. They are the ones who struggled and kept going anyway.

Ship it ugly. Improve it. Ship it again.

> "A year from now you will wish you had started today."

Start today.
