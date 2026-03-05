/**
 * Sync-only compile entry (no Prettier). Use from browser/client bundles
 * so Prettier (Node-only) is never pulled in.
 */
import type { AppIR } from '@pixlow/ir';
import { generateAppTsx } from './app';
import { generateScreenFiles } from './screens';
import { generateThemeTs } from './theme';
import { generatePackageJson } from './packageJson';
import type { FileTree } from './types';

/**
 * Synchronous compile: skips Prettier (returns unformatted code).
 * Use for browser/client where Prettier is not available.
 */
export function compileIRToReactNativeSync(ir: AppIR): FileTree {
  const screenFiles = generateScreenFiles(ir);
  const tree: FileTree = {
    'App.tsx': generateAppTsx(ir),
    'theme.ts': generateThemeTs(ir),
    'package.json': generatePackageJson(ir),
  };
  for (const [path, content] of Object.entries(screenFiles)) {
    tree[path] = content;
  }
  return tree;
}

export type { FileTree } from './types';
