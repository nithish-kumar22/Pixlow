import { describe, it, expect } from 'vitest';
import { formatUserMessage } from './formatUserMessage';

describe('formatUserMessage', () => {
  it('includes trimmed prompt in output', () => {
    const prompt = '  A to-do app with a list and add button  ';
    const result = formatUserMessage(prompt, 'react-native');
    expect(result).toContain('A to-do app with a list and add button');
    expect(result).not.toMatch(/^\s+A to-do/);
  });

  it('includes Target platform: React Native', () => {
    const result = formatUserMessage('Build a counter app', 'react-native');
    expect(result).toContain('Target platform: React Native');
  });

  it('includes Generate a mobile app with the following description', () => {
    const result = formatUserMessage('A simple calculator', 'react-native');
    expect(result).toContain('Generate a mobile app with the following description');
    expect(result).toContain('A simple calculator');
  });
});
