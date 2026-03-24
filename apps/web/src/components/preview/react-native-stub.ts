/**
 * Stub for react-native used in Sandpack in-browser preview (M11).
 * Maps RN primitives to DOM elements so compiled IR code runs without react-native-web.
 */

export const REACT_NATIVE_STUB_CODE = `import React from 'react';

function withStyle(Component) {
  return function Styled(props) {
    const { style, ...rest } = props || {};
    return React.createElement(Component, { ...rest, style: style || {} });
  };
}

export const View = withStyle('div');
export const Text = withStyle('span');
export const Image = (props) => {
  const { source, style, ...rest } = props || {};
  const uri = typeof source === 'object' && source?.uri ? source.uri : source;
  return React.createElement('img', { ...rest, src: uri || '', style: style || {} });
};
export const TouchableOpacity = (props) => {
  const { onPress, style, children, ...rest } = props || {};
  return React.createElement('button', { ...rest, onClick: onPress, style: { border: 'none', background: 'none', cursor: 'pointer', ...(style || {}) }, type: 'button' }, children);
};
export const TextInput = (props) => {
  const { style, ...rest } = props || {};
  return React.createElement('input', { ...rest, style: style || {} });
};
export const ScrollView = withStyle('div');
export const SafeAreaView = withStyle('div');

export function FlatList({ data = [], renderItem, keyExtractor, style }) {
  const items = (data || []).map((item, index) => {
    const key = keyExtractor ? keyExtractor(item, index) : index;
    return React.createElement(React.Fragment, { key }, renderItem({ item, index }));
  });
  return React.createElement('div', { style: style || {} }, items);
}

export const StyleSheet = {
  create: (styles) => styles || {},
};
`;
