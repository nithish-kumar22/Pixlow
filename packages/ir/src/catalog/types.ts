export type PropDef = {
  name: string;
  type: string;
  default?: unknown;
};

export type CatalogEntry = {
  id: string;
  name: string;
  description: string;
  category?: string;
  props: PropDef[];
  styleProps?: string[];
  exampleSnippet?: string;
};

export type ComponentCatalog = CatalogEntry[];

export type CatalogPlatform = 'react-native';

