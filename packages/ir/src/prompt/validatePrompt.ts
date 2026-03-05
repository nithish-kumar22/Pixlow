import { PROMPT_MIN_LENGTH, PROMPT_MAX_LENGTH } from './constants';

export type ValidatePromptResult =
  | { ok: true }
  | { ok: false; error: string };

/**
 * Validates the user prompt for length and basic sanitization.
 * Strips leading/trailing whitespace; rejects empty, too short, or too long input.
 * Use before sending the prompt to the LLM (e.g. in M08).
 *
 * @param prompt - Raw user prompt string
 * @returns { ok: true } or { ok: false, error: string }. Length limits from constants (PROMPT_MIN_LENGTH, PROMPT_MAX_LENGTH).
 */
export function validatePrompt(prompt: string): ValidatePromptResult {
  const trimmed = prompt.trim();

  if (trimmed.length === 0) {
    return { ok: false, error: 'Prompt cannot be empty.' };
  }

  if (trimmed.length < PROMPT_MIN_LENGTH) {
    return {
      ok: false,
      error: `Prompt must be at least ${PROMPT_MIN_LENGTH} characters (got ${trimmed.length}).`,
    };
  }

  if (trimmed.length > PROMPT_MAX_LENGTH) {
    return {
      ok: false,
      error: `Prompt must be at most ${PROMPT_MAX_LENGTH} characters (got ${trimmed.length}).`,
    };
  }

  return { ok: true };
}
