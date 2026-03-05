import { describe, it, expect } from 'vitest';
import { getSampleIR } from '@pixlow/ir';
import { compileIRToReactNative, compileIRToReactNativeAsync } from './compile';

describe('compileIRToReactNative', () => {
  const ir = getSampleIR();

  it('returns FileTree with expected keys', () => {
    const tree = compileIRToReactNative(ir);
    expect(tree).toHaveProperty('App.tsx');
    expect(tree).toHaveProperty('screens/HomeScreen.tsx');
    expect(tree).toHaveProperty('theme.ts');
    expect(tree).toHaveProperty('package.json');
  });

  it('App.tsx contains NavigationContainer and Stack navigator', () => {
    const tree = compileIRToReactNative(ir);
    expect(tree['App.tsx']).toContain('NavigationContainer');
    expect(tree['App.tsx']).toContain('Stack.Navigator');
    expect(tree['App.tsx']).toContain('HomeScreen');
    expect(tree['App.tsx']).toContain('initialRouteName');
  });

  it('screens/HomeScreen.tsx contains View, Text, TouchableOpacity and sample content', () => {
    const tree = compileIRToReactNative(ir);
    const homeScreen = tree['screens/HomeScreen.tsx'];
    expect(homeScreen).toContain('View');
    expect(homeScreen).toContain('Text');
    expect(homeScreen).toContain('TouchableOpacity');
    expect(homeScreen).toContain('Hello, World!');
    expect(homeScreen).toContain('Tap me');
  });

  it('theme.ts contains theme tokens', () => {
    const tree = compileIRToReactNative(ir);
    expect(tree['theme.ts']).toContain('primaryColor');
    expect(tree['theme.ts']).toContain('fontFamily');
    expect(tree['theme.ts']).toContain('#6366f1');
    expect(tree['theme.ts']).toContain('Inter');
  });

  it('package.json is valid JSON with expected dependencies', () => {
    const tree = compileIRToReactNative(ir);
    const pkg = JSON.parse(tree['package.json']);
    expect(pkg.name).toBe('sample-app');
    expect(pkg.dependencies).toHaveProperty('react');
    expect(pkg.dependencies).toHaveProperty('react-native');
    expect(pkg.dependencies).toHaveProperty('expo');
    expect(pkg.dependencies).toHaveProperty('@react-navigation/native');
  });

  it('compileIRToReactNativeAsync returns formatted FileTree', async () => {
    const tree = await compileIRToReactNativeAsync(ir);
    expect(tree).toHaveProperty('App.tsx');
    expect(tree).toHaveProperty('screens/HomeScreen.tsx');
    expect(tree['App.tsx']).toContain('NavigationContainer');
    expect(tree['screens/HomeScreen.tsx']).toContain('Hello, World!');
  });
});
