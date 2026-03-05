# @pixlow/compiler-rn

IR → React Native (Expo) compiler (Module M09). Transforms validated `AppIR` from `@pixlow/ir` into a `FileTree` (path → file content) for in-browser preview (M11) and export ZIP (M17).

## Usage

```ts
import { compileIRToReactNative, compileIRToReactNativeAsync } from '@pixlow/compiler-rn';
import { validateIR, getSampleIR } from '@pixlow/ir';

// Validate IR first (e.g. from LLM or storage), then compile
const ir = validateIR(getSampleIR());
const fileTree = compileIRToReactNative(ir);
// fileTree['App.tsx'], fileTree['screens/HomeScreen.tsx'], fileTree['theme.ts'], fileTree['package.json']

// For formatted output (Prettier), use async:
const formattedTree = await compileIRToReactNativeAsync(ir);
```

## Output

- `App.tsx` — React Navigation (stack or tabs) and screen registration
- `screens/<Name>Screen.tsx` — One component per screen
- `theme.ts` — Design tokens from IR theme
- `package.json` — Dependencies for React Native / Expo

## Scripts

- `npm run build` — Compile TypeScript to `dist/`
- `npm run lint` — Type-check
- `npm test` — Run Vitest tests
