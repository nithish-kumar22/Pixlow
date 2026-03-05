import { z } from 'zod';
import { IR_VERSION } from './constants';

/** Component type enum — platform-agnostic names for RN and Flutter compilers */
export const layoutNodeTypeEnum = z.enum([
  'View',
  'Text',
  'Image',
  'Button',
  'TextInput',
  'FlatList',
  'ScrollView',
  'SafeAreaView',
]);

/** Event handler payload: action (e.g. navigate) and optional target (e.g. screen id) */
export const eventPayloadSchema = z.object({
  action: z.string(),
  target: z.string().optional(),
});

/** Flexible record for component props (e.g. content, label, source) */
const propsRecordSchema = z.record(z.string(), z.unknown()).default({});

/** Flexible record for style (e.g. flex, fontSize, color) — each compiler maps as needed */
const styleRecordSchema = z.record(z.string(), z.unknown()).default({});

/** Events map: e.g. onPress -> { action, target } */
const eventsSchema = z.record(z.string(), eventPayloadSchema).optional();

/** Shape of a layout node for recursive schema typing */
interface LayoutNodeShape {
  id: string;
  type: z.infer<typeof layoutNodeTypeEnum>;
  props: Record<string, unknown>;
  style: Record<string, unknown>;
  children?: LayoutNodeShape[];
  events?: Record<string, z.infer<typeof eventPayloadSchema>>;
}

/** Recursive layout node: single root per screen, tree of nodes */
export const layoutNodeSchema = z.lazy(() =>
  z.object({
    id: z.string(),
    type: layoutNodeTypeEnum,
    props: propsRecordSchema,
    style: styleRecordSchema,
    children: z.array(layoutNodeSchema).optional(),
    events: eventsSchema,
  })
) as z.ZodType<LayoutNodeShape>;

/** Screen: id, name, and single root layout node */
export const screenSchema = z.object({
  id: z.string(),
  name: z.string(),
  layout: layoutNodeSchema,
});

/** Navigation: stack or tabs, with initial screen id */
export const navigationSchema = z.object({
  type: z.enum(['stack', 'tabs']),
  initialScreen: z.string(),
});

/** Theme: design tokens (primaryColor, fontFamily, etc.) */
export const themeSchema = z.object({
  primaryColor: z.string().optional(),
  fontFamily: z.string().optional(),
});

/** Top-level App IR schema */
export const appIRSchema = z.object({
  version: z.string(),
  appId: z.string().optional(),
  screens: z.array(screenSchema).min(1, 'At least one screen is required'),
  navigation: navigationSchema,
  theme: themeSchema.default({}),
  dataBindings: z.record(z.string(), z.unknown()).optional().default({}),
  assets: z.array(z.unknown()).optional().default([]),
});

/** Validate that version matches current IR_VERSION (optional refinement) */
export const appIRSchemaWithVersion = appIRSchema.refine(
  (data) => data.version === IR_VERSION,
  { message: `IR version must be ${IR_VERSION}` }
);
