import { describe, it, expect } from 'vitest';
import { layoutNodeTypeEnum } from '../schema';
import { getComponentCatalog } from './getComponentCatalog';
import { getCatalogForPrompt } from './getCatalogForPrompt';

describe('Component catalog (M06)', () => {
  it('getComponentCatalog returns entries for all layout node types for react-native', () => {
    const catalog = getComponentCatalog('react-native');

    // Ensure we have at least one entry per enum value
    const ids = new Set(catalog.map((entry) => entry.id));

    for (const type of layoutNodeTypeEnum.options) {
      expect(ids.has(type)).toBe(true);
    }
  });

  it('getComponentCatalog throws for unsupported platform', () => {
    // @ts-expect-error – testing runtime behavior for unknown platform
    expect(() => getComponentCatalog('web')).toThrowError(
      /Unsupported catalog platform/
    );
  });

  it('getCatalogForPrompt returns a readable string containing known components', () => {
    const text = getCatalogForPrompt('react-native');

    expect(text.length).toBeGreaterThan(0);
    expect(text).toContain('View');
    expect(text).toContain('Text');
  });
});

