/**
 * @pixlow/compiler-rn — IR → React Native (Expo) compiler (Module M09).
 * Transforms validated AppIR into a FileTree for preview (M11) and export (M17).
 */

export type { FileTree } from './types';
export { compileIRToReactNative, compileIRToReactNativeSync, compileIRToReactNativeAsync } from './compile';
export { nodeToJSX } from './nodeToJSX';
export type { NodeToJSXContext } from './nodeToJSX';
export { generateScreenFiles } from './screens';
export { generateAppTsx } from './app';
export { generateThemeTs } from './theme';
export { generatePackageJson } from './packageJson';
export { screenNameToComponentName } from './utils';
