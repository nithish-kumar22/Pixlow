/**
 * Transform M09 compiler FileTree into Sandpack-ready files for in-browser preview (M11).
 * - Normalizes paths (leading slash)
 * - Injects react-native stub and single-screen entry
 * - Rewrites 'react-native' imports to use stub (no React Navigation in preview)
 */

import type { FileTree } from '@pixlow/compiler-rn/sync';
import { REACT_NATIVE_STUB_CODE } from './react-native-stub';

export type SandpackFileEntry =
  | string
  | { code: string; readOnly?: boolean; active?: boolean; hidden?: boolean };

export type SandpackFiles = Record<string, SandpackFileEntry>;

const STUB_PATH = '/react-native-stub.js';
const ENTRY_PATH = '/index.js';

/** Extract initial route name from generated App.tsx (e.g. initialRouteName="Home" -> "Home") */
function getInitialRouteNameFromApp(appContent: string): string | null {
  const match = appContent.match(/initialRouteName=["'](\w+)["']/);
  return match ? match[1] : null;
}

/** Rewrite react-native import to stub path; leave other imports unchanged */
function rewriteImports(content: string): string {
  return content.replace(
    /from\s+['"]react-native['"]/g,
    `from '${STUB_PATH}'`
  );
}

/**
 * Transform compiler FileTree to Sandpack files.
 * Uses single-screen preview: only the initial screen is rendered (no React Navigation in sandbox).
 */
export function fileTreeToSandpackFiles(compilerFileTree: FileTree): SandpackFiles {
  const appContent = compilerFileTree['App.tsx'] ?? '';
  const initialRoute = getInitialRouteNameFromApp(appContent);
  const screenKeys = Object.keys(compilerFileTree).filter((p) =>
    p.startsWith('screens/') && p.endsWith('.tsx')
  );

  // Resolve initial screen file: screens/HomeScreen.tsx for initialRouteName="Home"
  let initialScreenPath = '';
  if (initialRoute) {
    const candidate = `screens/${initialRoute}Screen.tsx`;
    if (compilerFileTree[candidate]) {
      initialScreenPath = `/${candidate}`;
    }
  }
  if (!initialScreenPath && screenKeys.length > 0) {
    initialScreenPath = '/' + screenKeys[0];
  }

  const result: SandpackFiles = {};

  // 1. Inject stub
  result[STUB_PATH] = {
    code: REACT_NATIVE_STUB_CODE,
    readOnly: true,
    hidden: true,
  };

  // 2. Add compiler files with normalized paths and rewritten imports (exclude App.tsx and package.json for preview)
  for (const [path, content] of Object.entries(compilerFileTree)) {
    if (path === 'package.json') continue;
    if (path === 'App.tsx') continue; // We use index.js to mount single screen only
    const normalizedPath = path.startsWith('/') ? path : `/${path}`;
    result[normalizedPath] = rewriteImports(content);
  }

  // 3. Generate entry that mounts the initial screen (or placeholder if none)
  const importPath = initialScreenPath.startsWith('/screens/')
    ? '.' + initialScreenPath
    : initialScreenPath;
  const entryCode = initialScreenPath
    ? `import React from 'react';
import ReactDOM from 'react-dom/client';
import InitialScreen from '${importPath}';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(React.createElement(InitialScreen, {}));
`
    : `import React from 'react';
import ReactDOM from 'react-dom/client';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(React.createElement('div', { style: { padding: 16 } }, 'No screen to preview'));
`;

  result[ENTRY_PATH] = {
    code: entryCode,
    readOnly: true,
    hidden: true,
  };

  return result;
}

/**
 * Normalize compiler path to Sandpack path (ensure leading slash).
 */
export function toSandpackPath(compilerPath: string): string {
  return compilerPath.startsWith('/') ? compilerPath : `/${compilerPath}`;
}
