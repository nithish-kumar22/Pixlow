import type { LayoutNode } from '@pixlow/ir';

/** Context for generating JSX (e.g. screen id → route name for navigation). */
export interface NodeToJSXContext {
  /** Map IR screen id to React Navigation route name (e.g. screen_home → "Home"). */
  screenIdToRouteName: Record<string, string>;
}

function styleToObjectString(style: Record<string, unknown>): string {
  if (Object.keys(style).length === 0) return '{}';
  const parts = Object.entries(style).map(([k, v]) => {
    const key = k;
    const val = typeof v === 'string' ? `'${v.replace(/'/g, "\\'")}'` : String(v);
    return `${key}: ${val}`;
  });
  return `{ ${parts.join(', ')} }`;
}

/** Escape for use inside JS template literal (backticks). */
function escapeTemplateLiteral(s: string): string {
  return s.replace(/\\/g, '\\\\').replace(/`/g, '\\`').replace(/\$/g, '\\$');
}


/**
 * Recursively convert an IR layout node to React Native JSX string.
 * Uses inline styles; uses node.id for key where needed.
 */
export function nodeToJSX(node: LayoutNode, ctx: NodeToJSXContext): string {
  const styleStr = styleToObjectString(node.style);
  const keyAttr = node.id ? ` key="${node.id}"` : '';
  const children = node.children ?? [];
  const hasChildren = children.length > 0;

  const onPressHandler = node.events?.onPress;
  const onPressAttr =
    onPressHandler?.action === 'navigate' && onPressHandler.target
      ? ` onPress={() => navigation.navigate('${ctx.screenIdToRouteName[onPressHandler.target] ?? onPressHandler.target}')}`
      : onPressHandler
        ? ' onPress={() => {}}'
        : '';

  switch (node.type) {
    case 'View': {
      const inner = hasChildren ? children.map((c) => nodeToJSX(c, ctx)).join('\n        ') : '';
      return `<View${keyAttr} style={${styleStr}}>${hasChildren ? `\n        ${inner}\n      ` : ''}</View>`;
    }
    case 'Text': {
      const content = (node.props.content as string) ?? '';
      return `<Text${keyAttr} style={${styleStr}}>{\`${escapeTemplateLiteral(content)}\`}</Text>`;
    }
    case 'Image': {
      const source = node.props.source;
      let sourceStr: string;
      if (typeof source === 'string') {
        const s = source.replace(/\\/g, '\\\\').replace(/'/g, "\\'");
        if (s.startsWith('http://') || s.startsWith('https://')) {
          sourceStr = `{ uri: '${s}' }`;
        } else {
          sourceStr = `require('${s}')`;
        }
      } else if (typeof source === 'object' && source && 'uri' in source) {
        const uri = String((source as { uri: string }).uri).replace(/\\/g, '\\\\').replace(/'/g, "\\'");
        sourceStr = `{ uri: '${uri}' }`;
      } else {
        sourceStr = '{ uri: "" }';
      }
      return `<Image${keyAttr} source={${sourceStr}} style={${styleStr}} />`;
    }
    case 'Button': {
      const label = (node.props.label as string) ?? 'Button';
      return `<TouchableOpacity${keyAttr} style={${styleStr}}${onPressAttr}>\n        <Text>{\`${escapeTemplateLiteral(label)}\`}</Text>\n      </TouchableOpacity>`;
    }
    case 'TextInput': {
      const placeholder = (node.props.placeholder as string) ?? '';
      const value = (node.props.value as string) ?? '';
      return `<TextInput${keyAttr} placeholder={\`${escapeTemplateLiteral(placeholder)}\`} value={\`${escapeTemplateLiteral(value)}\`} style={${styleStr}} />`;
    }
    case 'ScrollView': {
      const inner = hasChildren ? children.map((c) => nodeToJSX(c, ctx)).join('\n        ') : '';
      return `<ScrollView${keyAttr} style={${styleStr}}>${hasChildren ? `\n        ${inner}\n      ` : ''}</ScrollView>`;
    }
    case 'SafeAreaView': {
      const inner = hasChildren ? children.map((c) => nodeToJSX(c, ctx)).join('\n        ') : '';
      return `<SafeAreaView${keyAttr} style={${styleStr}}>${hasChildren ? `\n        ${inner}\n      ` : ''}</SafeAreaView>`;
    }
    case 'FlatList': {
      const dataProp = node.props.data;
      const dataStr = Array.isArray(dataProp) ? JSON.stringify(dataProp) : '[]';
      const child = children[0];
      const renderItemBody = child
        ? `({ item }) => (${nodeToJSX(child, ctx)})`
        : "({ item }) => <Text>{typeof item === 'object' ? JSON.stringify(item) : String(item)}</Text>";
      return `<FlatList${keyAttr} data={${dataStr}} renderItem={${renderItemBody}} keyExtractor={(item) => (item && typeof item === 'object' && 'id' in item ? String((item as { id: unknown }).id) : String(item))} style={${styleStr}} />`;
    }
    default: {
      const inner = hasChildren ? children.map((c) => nodeToJSX(c, ctx)).join('\n        ') : '';
      return `<View${keyAttr} style={${styleStr}}>${hasChildren ? `\n        ${inner}\n      ` : ''}</View>`;
    }
  }
}
