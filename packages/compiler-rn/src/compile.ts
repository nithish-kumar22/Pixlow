import type { AppIR } from '@pixlow/ir';
import { generateAppTsx } from './app';
import { generateScreenFiles } from './screens';
import { generateThemeTs } from './theme';
import { generatePackageJson } from './packageJson';
import type { FileTree } from './types';

async function formatTsx(code: string): Promise<string> {
  try {
    const prettier = await import('prettier');
    return await prettier.format(code, {
      parser: 'babel-ts',
      semi: true,
      singleQuote: true,
      tabWidth: 2,
    });
  } catch {
    return code;
  }
}

async function formatJson(code: string): Promise<string> {
  try {
    const prettier = await import('prettier');
    return await prettier.format(code, { parser: 'json', tabWidth: 2 });
  } catch {
    return code;
  }
}

/**
 * Compile validated AppIR to React Native (Expo) FileTree.
 * Caller must validate IR with validateIR from @pixlow/ir before calling.
 */
export async function compileIRToReactNativeAsync(ir: AppIR): Promise<FileTree> {
  const screenFiles = generateScreenFiles(ir);
  const appContent = generateAppTsx(ir);
  const themeContent = generateThemeTs(ir);
  const packageContent = generatePackageJson(ir);

  const tree: FileTree = {
    'App.tsx': await formatTsx(appContent),
    'theme.ts': await formatTsx(themeContent),
    'package.json': await formatJson(packageContent),
  };

  for (const [path, content] of Object.entries(screenFiles)) {
    tree[path] = await formatTsx(content);
  }

  return tree;
}

/**
 * Synchronous compile: skips Prettier (returns unformatted code).
 * Use for environments where async Prettier is not available.
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

/**
 * Compile IR to React Native FileTree. Uses Prettier when available (async).
 * For synchronous API without formatting, use compileIRToReactNativeSync.
 */
export function compileIRToReactNative(ir: AppIR): FileTree {
  return compileIRToReactNativeSync(ir);
}
