import type { AppIR } from '@pixlow/ir';
import { nodeToJSX } from './nodeToJSX';
import { screenNameToComponentName } from './utils';

/** Generate one file per screen: screens/<Name>Screen.tsx */
export function generateScreenFiles(ir: AppIR): Record<string, string> {
  const screenIdToRouteName: Record<string, string> = {};
  for (const screen of ir.screens) {
    screenIdToRouteName[screen.id] = screenNameToComponentName(screen.name);
  }
  const ctx = { screenIdToRouteName };

  const files: Record<string, string> = {};
  const rnComponents = [
    'View',
    'Text',
    'Image',
    'TouchableOpacity',
    'TextInput',
    'FlatList',
    'ScrollView',
    'SafeAreaView',
  ];

  for (const screen of ir.screens) {
    const componentName = screenNameToComponentName(screen.name) + 'Screen';
    const layoutJSX = nodeToJSX(screen.layout, ctx);
    const content = `import React from 'react';
import { ${rnComponents.join(', ')} } from 'react-native';

export default function ${componentName}({ navigation }: { navigation: any }) {
  return (
    ${layoutJSX}
  );
}
`;
    files[`screens/${componentName}.tsx`] = content;
  }
  return files;
}
