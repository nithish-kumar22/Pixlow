import { describe, it, expect } from 'vitest';
import {
  fileTreeToSandpackFiles,
  toSandpackPath,
} from './fileTreeToSandpackFiles';
import type { FileTree } from '@pixlow/compiler-rn/sync';

describe('fileTreeToSandpackFiles', () => {
  it('normalizes paths with leading slash and injects stub and entry', () => {
    const fileTree: FileTree = {
      'App.tsx': `import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import HomeScreen from './screens/HomeScreen';
const Stack = createNativeStackNavigator();
export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Home">
        <Stack.Screen name="Home" component={HomeScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
`,
      'screens/HomeScreen.tsx': `import React from 'react';
import { View, Text } from 'react-native';
export default function HomeScreen() {
  return (
    <View><Text>Hello</Text></View>
  );
}
`,
      'theme.ts': 'export const theme = {};',
    };

    const result = fileTreeToSandpackFiles(fileTree);

    expect(result['/react-native-stub.js']).toBeDefined();
    expect(typeof result['/react-native-stub.js']).toBe('object');
    if (typeof result['/react-native-stub.js'] === 'object' && 'code' in result['/react-native-stub.js']) {
      expect(result['/react-native-stub.js'].code).toContain('View');
      expect(result['/react-native-stub.js'].code).toContain('StyleSheet');
    }

    expect(result['/index.js']).toBeDefined();
    const entry = result['/index.js'];
    const entryCode = typeof entry === 'string' ? entry : entry.code;
    expect(entryCode).toContain('createRoot');
    expect(entryCode).toContain('InitialScreen');
    expect(entryCode).toMatch(/HomeScreen/);

    expect(result['/screens/HomeScreen.tsx']).toBeDefined();
    const screenContent = result['/screens/HomeScreen.tsx'];
    const screenCode = typeof screenContent === 'string' ? screenContent : screenContent.code;
    expect(screenCode).toContain("/react-native-stub.js");
    expect(screenCode).not.toContain("from 'react-native'");

    expect(result['/theme.ts']).toBeDefined();
  });

  it('rewrites react-native imports to stub path in all files', () => {
    const fileTree: FileTree = {
      'App.tsx': `import { View } from 'react-native';\nexport default () => <View />;`,
      'screens/OtherScreen.tsx': `import { Text, View } from 'react-native';\nexport default () => null;`,
    };

    const result = fileTreeToSandpackFiles(fileTree);

    const otherContent = result['/screens/OtherScreen.tsx'];
    const otherCode = typeof otherContent === 'string' ? otherContent : otherContent.code;
    expect(otherCode).toContain("/react-native-stub.js");
    expect(otherCode).not.toMatch(/from\s+['"]react-native['"]/);
  });
});

describe('toSandpackPath', () => {
  it('adds leading slash when missing', () => {
    expect(toSandpackPath('App.tsx')).toBe('/App.tsx');
    expect(toSandpackPath('screens/Home.tsx')).toBe('/screens/Home.tsx');
  });

  it('leaves path unchanged when already has leading slash', () => {
    expect(toSandpackPath('/App.tsx')).toBe('/App.tsx');
  });
});
