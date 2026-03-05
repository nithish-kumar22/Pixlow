# @pixlow/ir

Shared **Intermediate Representation (IR)** schema and types for Pixlow (Module M05), plus the static **component catalog** used by the prompt builder (Module M06).

## Contents

- **Zod schema** — `appIRSchema` and sub-schemas for version, screens, layout nodes, navigation, theme
- **TypeScript types** — `AppIR`, `LayoutNode`, `Screen`, `Navigation`, `Theme` (inferred from schema)
- **Validator** — `validateIR(data: unknown): AppIR` for LLM response parsing and before saving versions
- **Sample IR** — `sampleIR` / `getSampleIR()` for tests and LLM few-shot (e.g. M07 `includeExample`)
- **Component catalog (M06)** — static React Native component catalog and helpers for system prompts
- **Prompt validation and system prompt (M07)** — `validatePrompt`, `buildSystemPrompt`, `formatUserMessage`; prompt length limits (`PROMPT_MIN_LENGTH`, `PROMPT_MAX_LENGTH`)

## M07 — Prompt validation and system prompt

- **Prompt constraints:** Min length 10 characters, max 4000 (see `PROMPT_MIN_LENGTH`, `PROMPT_MAX_LENGTH`). Leading/trailing whitespace is trimmed before validation.
- **System prompt:** `buildSystemPrompt(platform, options?)` returns a string with: role and output-format instructions, IR schema summary, design rules (one root per screen, unique ids, catalog-only types), and the component catalog from M06. Option `includeExample: true` appends one minimal IR JSON example (from M05 sample).
- **User message:** `formatUserMessage(prompt, platform)` formats the trimmed user prompt with a "Target platform: …" prefix for the LLM user message.
- M08 (Python/FastAPI) uses the same structure; it may port this logic to Python or call this package.

## Scripts

- `npm run build` — compile TypeScript to `dist/`
- `npm run lint` — type-check with `tsc --noEmit`
- `npm run test` — run unit tests (Vitest)
- `npm run test:watch` — run tests in watch mode

## Usage

### IR validation and sample

```ts
import {
  validateIR,
  sampleIR,
  type AppIR,
  getCatalogForPrompt,
} from '@pixlow/ir';

const parsed = JSON.parse(llmResponseText);
const ir: AppIR = validateIR(parsed); // throws ZodError if invalid

// Include catalog summary in an LLM system prompt (M07)
const catalogSummary = getCatalogForPrompt('react-native');
```

### Prompt validation and system prompt (M07)

```ts
import {
  validatePrompt,
  buildSystemPrompt,
  formatUserMessage,
  PROMPT_MIN_LENGTH,
  PROMPT_MAX_LENGTH,
} from '@pixlow/ir';

const result = validatePrompt(userInput);
if (!result.ok) {
  console.error(result.error);
  return;
}
const systemPrompt = buildSystemPrompt('react-native', { includeExample: true });
const userMessage = formatUserMessage(userInput.trim(), 'react-native');
// Send systemPrompt + userMessage to LLM (e.g. in M08)
```

Consumers: M06 (component catalog), M07 (system prompt), M08 (LLM → IR), M09 (IR → React Native compiler).
