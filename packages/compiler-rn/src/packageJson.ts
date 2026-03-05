import type { AppIR } from '@pixlow/ir';

/** Generate package.json for the compiled React Native (Expo) app. */
export function generatePackageJson(ir: AppIR): string {
  const name = ir.appId ?? 'generated-app';
  const sanitizedName = name.replace(/[^a-z0-9-]/gi, '-').toLowerCase() || 'generated-app';

  const pkg = {
    name: sanitizedName,
    version: '1.0.0',
    main: 'node_modules/expo/AppEntry.js',
    scripts: {
      start: 'expo start',
      android: 'expo start --android',
      ios: 'expo start --ios',
      web: 'expo start --web',
    },
    dependencies: {
      react: '18.2.0',
      'react-native': '0.74.5',
      expo: '~52.0.0',
      '@react-navigation/native': '^7.0.0',
      '@react-navigation/native-stack': '^7.0.0',
      '@react-navigation/bottom-tabs': '^7.0.0',
      'react-native-screens': '~4.4.0',
      'react-native-safe-area-context': '4.12.0',
    },
    devDependencies: {
      '@babel/core': '^7.25.0',
      typescript: '~5.3.0',
    },
    private: true,
  };

  return JSON.stringify(pkg, null, 2);
}
