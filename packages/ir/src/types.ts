import { z } from 'zod';
import {
  appIRSchema,
  layoutNodeSchema,
  layoutNodeTypeEnum,
  navigationSchema,
  screenSchema,
  themeSchema,
  eventPayloadSchema,
} from './schema';

/** Inferred App IR type — single source of truth from Zod schema */
export type AppIR = z.infer<typeof appIRSchema>;

/** Layout node (recursive tree node for screen layout) */
export type LayoutNode = z.infer<typeof layoutNodeSchema>;

/** Screen: id, name, and root layout node */
export type Screen = z.infer<typeof screenSchema>;

/** Navigation config: stack or tabs + initial screen */
export type Navigation = z.infer<typeof navigationSchema>;

/** Theme: design tokens */
export type Theme = z.infer<typeof themeSchema>;

/** Component type enum values */
export type LayoutNodeType = z.infer<typeof layoutNodeTypeEnum>;

/** Event payload for handlers (e.g. onPress) */
export type EventPayload = z.infer<typeof eventPayloadSchema>;
