import { describe, it, expect } from 'vitest';
import { validatePrompt } from './validatePrompt';
import { PROMPT_MIN_LENGTH, PROMPT_MAX_LENGTH } from './constants';

describe('validatePrompt', () => {
  it('returns ok: false for empty string', () => {
    expect(validatePrompt('')).toEqual({ ok: false, error: 'Prompt cannot be empty.' });
  });

  it('returns ok: false for whitespace-only string', () => {
    expect(validatePrompt('   \n\t  ')).toEqual({
      ok: false,
      error: 'Prompt cannot be empty.',
    });
  });

  it('returns ok: false when prompt is too short', () => {
    const short = 'a'.repeat(PROMPT_MIN_LENGTH - 1);
    expect(validatePrompt(short)).toEqual({
      ok: false,
      error: `Prompt must be at least ${PROMPT_MIN_LENGTH} characters (got ${short.length}).`,
    });
  });

  it('returns ok: true for valid prompt at min length', () => {
    const valid = 'a'.repeat(PROMPT_MIN_LENGTH);
    expect(validatePrompt(valid)).toEqual({ ok: true });
  });

  it('returns ok: true for valid prompt (e.g. 15 chars)', () => {
    expect(validatePrompt('A to-do app with list')).toEqual({ ok: true });
  });

  it('returns ok: true at max length (4000)', () => {
    const max = 'a'.repeat(PROMPT_MAX_LENGTH);
    expect(validatePrompt(max)).toEqual({ ok: true });
  });

  it('returns ok: false when over max length', () => {
    const over = 'a'.repeat(PROMPT_MAX_LENGTH + 1);
    expect(validatePrompt(over)).toEqual({
      ok: false,
      error: `Prompt must be at most ${PROMPT_MAX_LENGTH} characters (got ${over.length}).`,
    });
  });

  it('trims leading and trailing spaces then validates', () => {
    expect(validatePrompt('   A to-do app with a list and add button.   ')).toEqual({
      ok: true,
    });
    expect(validatePrompt('   x          ')).toEqual({
      ok: false,
      error: `Prompt must be at least ${PROMPT_MIN_LENGTH} characters (got 1).`,
    });
  });
});
