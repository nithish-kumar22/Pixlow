import type { CatalogPlatform } from './types';
import { getComponentCatalog } from './getComponentCatalog';

export function getCatalogForPrompt(platform: CatalogPlatform): string {
  const catalog = getComponentCatalog(platform);

  const lines: string[] = [];
  lines.push('You can use only the following components in IR layout nodes:');

  for (const entry of catalog) {
    const props =
      entry.props.length > 0
        ? entry.props.map((p) => `${p.name}: ${p.type}`).join(', ')
        : 'none';

    const styleProps =
      entry.styleProps && entry.styleProps.length > 0
        ? entry.styleProps.join(', ')
        : 'basic React Native layout / text styles';

    lines.push(
      `- ${entry.name} (${entry.id}) — ${entry.description} | props: ${props} | style props: ${styleProps}`
    );
  }

  return lines.join('\n');
}

