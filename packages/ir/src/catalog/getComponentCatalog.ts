import type { CatalogEntry, CatalogPlatform } from './types';
import { catalogReactNative } from './catalogReactNative';

export function getComponentCatalog(platform: CatalogPlatform): CatalogEntry[] {
  if (platform === 'react-native') {
    return catalogReactNative;
  }

  throw new Error(`Unsupported catalog platform: ${platform}`);
}

