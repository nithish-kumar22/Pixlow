import { describe, it, expect } from 'vitest';
import { validateIR } from './validate';
import { sampleIR } from './sampleIR';

describe('validateIR', () => {
  it('accepts valid sample IR and returns object with expected top-level keys', () => {
    const result = validateIR(sampleIR);
    expect(result).toHaveProperty('version', '1.0');
    expect(result).toHaveProperty('screens');
    expect(result).toHaveProperty('navigation');
    expect(result).toHaveProperty('theme');
    expect(Array.isArray(result.screens)).toBe(true);
    expect(result.screens.length).toBeGreaterThanOrEqual(1);
    expect(result.screens[0]).toHaveProperty('id', 'screen_home');
    expect(result.screens[0]).toHaveProperty('name', 'Home');
    expect(result.screens[0]).toHaveProperty('layout');
    expect(result.screens[0].layout).toHaveProperty('type', 'View');
    expect(result.screens[0].layout).toHaveProperty('children');
  });

  it('accepts valid minimal IR with required fields only', () => {
    const minimal = {
      version: '1.0',
      screens: [
        {
          id: 's1',
          name: 'Main',
          layout: {
            id: 'root',
            type: 'View',
            props: {},
            style: {},
          },
        },
      ],
      navigation: { type: 'stack' as const, initialScreen: 's1' },
      theme: {},
    };
    const result = validateIR(minimal);
    expect(result.version).toBe('1.0');
    expect(result.screens).toHaveLength(1);
    expect(result.navigation.type).toBe('stack');
  });

  it('accepts events.onPress.target=null', () => {
    const ir = {
      version: '1.0',
      screens: [
        {
          id: 's1',
          name: 'Main',
          layout: {
            id: 'root',
            type: 'View',
            props: {},
            style: {},
            events: {
              onPress: { action: 'navigate', target: null },
            },
            children: null,
          },
        },
      ],
      navigation: { type: 'stack' as const, initialScreen: 's1' },
      theme: {},
    };

    expect(() => validateIR(ir)).not.toThrow();
  });

  it('throws on missing required field (version)', () => {
    const invalid = {
      screens: [
        {
          id: 's1',
          name: 'Main',
          layout: { id: 'root', type: 'View', props: {}, style: {} },
        },
      ],
      navigation: { type: 'stack', initialScreen: 's1' },
      theme: {},
    };
    expect(() => validateIR(invalid)).toThrow();
  });

  it('throws on missing required field (screens)', () => {
    const invalid = {
      version: '1.0',
      navigation: { type: 'stack', initialScreen: 's1' },
      theme: {},
    };
    expect(() => validateIR(invalid)).toThrow();
  });

  it('throws on wrong type (screens as string)', () => {
    const invalid = {
      version: '1.0',
      screens: 'not-an-array',
      navigation: { type: 'stack', initialScreen: 's1' },
      theme: {},
    };
    expect(() => validateIR(invalid)).toThrow();
  });

  it('throws on empty screens array', () => {
    const invalid = {
      version: '1.0',
      screens: [],
      navigation: { type: 'stack', initialScreen: 's1' },
      theme: {},
    };
    expect(() => validateIR(invalid)).toThrow();
  });

  it('throws on invalid navigation type', () => {
    const invalid = {
      version: '1.0',
      screens: [
        {
          id: 's1',
          name: 'Main',
          layout: { id: 'root', type: 'View', props: {}, style: {} },
        },
      ],
      navigation: { type: 'drawer', initialScreen: 's1' },
      theme: {},
    };
    expect(() => validateIR(invalid)).toThrow();
  });

  it('throws on invalid layout node type', () => {
    const invalid = {
      version: '1.0',
      screens: [
        {
          id: 's1',
          name: 'Main',
          layout: {
            id: 'root',
            type: 'InvalidComponent',
            props: {},
            style: {},
          },
        },
      ],
      navigation: { type: 'stack', initialScreen: 's1' },
      theme: {},
    };
    expect(() => validateIR(invalid)).toThrow();
  });
});
