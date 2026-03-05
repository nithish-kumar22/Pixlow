/**
 * @pixlow/ir — Shared IR schema and types (Module M05) and
 * static component catalog (Module M06).
 *
 * - Zod schema, TypeScript types, validator, and sample IR for LLM/compiler pipeline.
 * - Static component catalog for React Native layout nodes used in system prompts (M07).
 */

export { IR_VERSION } from './constants';
export {
  appIRSchema,
  appIRSchemaWithVersion,
  layoutNodeSchema,
  layoutNodeTypeEnum,
  screenSchema,
  navigationSchema,
  themeSchema,
  eventPayloadSchema,
} from './schema';
export type {
  AppIR,
  LayoutNode,
  Screen,
  Navigation,
  Theme,
  LayoutNodeType,
  EventPayload,
} from './types';
export { validateIR } from './validate';
export { sampleIR, getSampleIR } from './sampleIR';
export {
  catalogReactNative,
  getComponentCatalog,
  getCatalogForPrompt,
} from './catalog';
export {
  PROMPT_MIN_LENGTH,
  PROMPT_MAX_LENGTH,
  validatePrompt,
  buildSystemPrompt,
  formatUserMessage,
} from './prompt';
export type { ValidatePromptResult, BuildSystemPromptOptions } from './prompt';
