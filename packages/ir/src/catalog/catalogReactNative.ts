import type { CatalogEntry } from './types';

export const catalogReactNative: CatalogEntry[] = [
  {
    id: 'View',
    name: 'View',
    description: 'Container for layout and grouping other components.',
    category: 'layout',
    props: [],
    styleProps: [
      'flex',
      'flexDirection',
      'justifyContent',
      'alignItems',
      'gap',
      'padding',
      'paddingHorizontal',
      'paddingVertical',
      'margin',
      'marginHorizontal',
      'marginVertical',
      'backgroundColor',
      'borderRadius',
    ],
    exampleSnippet:
      '{"type":"View","props":{},"style":{"flex":1,"padding":16},"children":[]}',
  },
  {
    id: 'Text',
    name: 'Text',
    description: 'Displays read-only text content.',
    category: 'content',
    props: [
      { name: 'content', type: 'string' },
      { name: 'numberOfLines', type: 'number', default: 0 },
    ],
    styleProps: [
      'fontSize',
      'fontWeight',
      'color',
      'textAlign',
      'margin',
      'marginBottom',
      'marginTop',
    ],
    exampleSnippet:
      '{"type":"Text","props":{"content":"Hello"},"style":{"fontSize":16}}',
  },
  {
    id: 'Image',
    name: 'Image',
    description: 'Displays an image from a URI or local asset.',
    category: 'content',
    props: [
      { name: 'source', type: 'string' },
      { name: 'resizeMode', type: '"cover" | "contain" | "center"', default: 'cover' },
    ],
    styleProps: ['width', 'height', 'borderRadius', 'margin', 'alignSelf'],
    exampleSnippet:
      '{"type":"Image","props":{"source":"https://example.com/image.png"},"style":{"width":120,"height":120}}',
  },
  {
    id: 'Button',
    name: 'Button',
    description:
      'Tappable button. In IR, use events.onPress with action (e.g. navigate) and optional target.',
    category: 'input',
    props: [
      { name: 'label', type: 'string' },
      { name: 'disabled', type: 'boolean', default: false },
    ],
    styleProps: [
      'padding',
      'paddingHorizontal',
      'paddingVertical',
      'backgroundColor',
      'borderRadius',
      'alignItems',
      'justifyContent',
      'marginTop',
    ],
    exampleSnippet:
      '{"type":"Button","props":{"label":"Continue"},"style":{"paddingVertical":12,"backgroundColor":"#6366f1"},"events":{"onPress":{"action":"navigate","target":"screen_details"}}}',
  },
  {
    id: 'TextInput',
    name: 'TextInput',
    description: 'Single-line or multi-line text input.',
    category: 'input',
    props: [
      { name: 'placeholder', type: 'string', default: '' },
      { name: 'secureTextEntry', type: 'boolean', default: false },
    ],
    styleProps: [
      'fontSize',
      'color',
      'padding',
      'borderWidth',
      'borderColor',
      'borderRadius',
      'marginVertical',
    ],
    exampleSnippet:
      '{"type":"TextInput","props":{"placeholder":"Enter your email"},"style":{"borderWidth":1,"borderColor":"#e5e7eb","padding":12}}',
  },
  {
    id: 'FlatList',
    name: 'FlatList',
    description:
      'Efficiently renders a vertical scrolling list. In IR, children often describe the item layout.',
    category: 'list',
    props: [
      { name: 'data', type: 'array' },
      {
        name: 'keyExtractor',
        type: 'string',
        default: 'id',
      },
    ],
    styleProps: ['flex', 'marginTop'],
    exampleSnippet:
      '{"type":"FlatList","props":{"data":[{"id":"1","title":"Item 1"}]},"style":{"flex":1}}',
  },
  {
    id: 'ScrollView',
    name: 'ScrollView',
    description:
      'Scroll container for content that might not fit on screen. Wraps other layout and content nodes.',
    category: 'layout',
    props: [],
    styleProps: ['flex', 'padding', 'marginTop'],
    exampleSnippet:
      '{"type":"ScrollView","props":{},"style":{"flex":1,"padding":16},"children":[]}',
  },
  {
    id: 'SafeAreaView',
    name: 'SafeAreaView',
    description:
      'Layout container that renders content within the safe area boundaries of a device.',
    category: 'layout',
    props: [],
    styleProps: ['flex', 'padding', 'backgroundColor'],
    exampleSnippet:
      '{"type":"SafeAreaView","props":{},"style":{"flex":1,"padding":16},"children":[]}',
  },
];

