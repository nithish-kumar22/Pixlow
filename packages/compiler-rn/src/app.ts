import type { AppIR } from '@pixlow/ir';
import { screenNameToComponentName } from './utils';

/** Generate App.tsx with React Navigation (stack or tabs) and all screen components. */
export function generateAppTsx(ir: AppIR): string {
  const routeName = (screen: { id: string; name: string }) => screenNameToComponentName(screen.name);
  const initialRoute = ir.screens.find((s) => s.id === ir.navigation.initialScreen);
  const initialRouteName = initialRoute ? routeName(initialRoute) : routeName(ir.screens[0]);
  const isTabs = ir.navigation.type === 'tabs';

  const screenImports = ir.screens
    .map((s) => {
      const compName = routeName(s) + 'Screen';
      return `import ${compName} from './screens/${compName}';`;
    })
    .join('\n');

  if (isTabs) {
    const tabScreens = ir.screens
      .map((s) => {
        const compName = routeName(s) + 'Screen';
        const route = routeName(s);
        return `        <Tab.Screen name="${route}" component={${compName}} />`;
      })
      .join('\n');
    return `import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';

${screenImports}

const Tab = createBottomTabNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <Tab.Navigator initialRouteName="${initialRouteName}">
${tabScreens}
      </Tab.Navigator>
    </NavigationContainer>
  );
}
`;
  }

  const screenComponents = ir.screens
    .map((s) => {
      const compName = routeName(s) + 'Screen';
      const route = routeName(s);
      return `        <Stack.Screen name="${route}" component={${compName}} />`;
    })
    .join('\n');

  return `import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

${screenImports}

const Stack = createNativeStackNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="${initialRouteName}">
${screenComponents}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
`;
}
