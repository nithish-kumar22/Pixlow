# In-Browser Preview (M11)

Renders generated React Native (M09 compiler) output in the browser via Sandpack. MVP uses a **stub-based strategy**: RN primitives are mapped to DOM elements (View → div, Text → span, etc.) so the app runs without `react-native-web` in the sandbox. Only the **initial screen** is shown (no React Navigation in preview).

## Usage

```tsx
import { Preview } from '@/components/preview';

// From pre-compiled FileTree (e.g. from M09)
<Preview files={fileTree} />

// From IR (compile + debounce handled inside)
<Preview ir={appIR} />
```

## Props

- **files** — `FileTree` from `compileIRToReactNative(ir)`. When provided, transform runs immediately.
- **ir** — `AppIR`. When provided, compiles then transforms; updates are debounced 300ms.
- **entry** — Logical entry (default `App.tsx`). Sandpack runs `/index.js` which mounts the initial screen.
- **className** — Optional CSS class for the wrapper.

## Strategy

1. **Transform** (`fileTreeToSandpackFiles`): Normalizes paths (leading slash), injects `/react-native-stub.js` and `/index.js`, rewrites `from 'react-native'` to the stub, and builds an entry that mounts only the initial screen.
2. **Stub** (`react-native-stub.ts`): Exports View, Text, Image, TouchableOpacity, TextInput, ScrollView, SafeAreaView, FlatList, StyleSheet as DOM-compatible components.
3. **Sandpack**: `template="react"`, `customSetup.entry: '/index.js'`, `options: { showPreview: true, showTabs: true }`.

Compilation errors are shown in-place; Sandpack runtime errors appear in the preview iframe or browser console.
