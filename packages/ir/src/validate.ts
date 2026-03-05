import { appIRSchema } from './schema';
import type { AppIR } from './types';

/**
 * Validates unknown data against the App IR schema.
 * Use in LLM response parsing and before saving versions.
 * @throws {import('zod').ZodError} when validation fails
 */
export function validateIR(data: unknown): AppIR {
  return appIRSchema.parse(data) as AppIR;
}
