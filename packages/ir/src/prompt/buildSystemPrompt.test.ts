import { describe, it, expect } from 'vitest';
import { buildSystemPrompt } from './buildSystemPrompt';

describe('buildSystemPrompt', () => {
  it('includes role and output format instruction', () => {
    const prompt = buildSystemPrompt('react-native');
    expect(prompt).toContain('mobile app generator');
    expect(prompt).toContain('ONLY valid JSON');
    expect(prompt).toContain('No markdown');
  });

  it('includes catalog section with View and Text', () => {
    const prompt = buildSystemPrompt('react-native');
    expect(prompt).toContain('View');
    expect(prompt).toContain('Text');
  });

  it('includes design rules (unique id, one root)', () => {
    const prompt = buildSystemPrompt('react-native');
    expect(prompt).toContain('unique');
    expect(prompt).toContain('id');
    expect(prompt).toContain('one root');
  });

  it('includes schema summary (version, screens, navigation)', () => {
    const prompt = buildSystemPrompt('react-native');
    expect(prompt).toContain('version');
    expect(prompt).toContain('screens');
    expect(prompt).toContain('navigation');
  });

  it('with includeExample: true contains sample IR (e.g. screen_home)', () => {
    const prompt = buildSystemPrompt('react-native', { includeExample: true });
    expect(prompt).toContain('screen_home');
    expect(prompt).toContain('"version"');
  });

  it('with includeExample: false does not contain sample screen id', () => {
    const prompt = buildSystemPrompt('react-native', { includeExample: false });
    expect(prompt).not.toContain('screen_home');
  });

  it('with no options does not include example', () => {
    const withExample = buildSystemPrompt('react-native', { includeExample: true });
    const withoutExample = buildSystemPrompt('react-native');
    expect(withoutExample.length).toBeLessThan(withExample.length);
    expect(withoutExample).not.toContain('screen_home');
  });
});
