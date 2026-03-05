import { IR_VERSION } from './constants';
import type { AppIR } from './types';

/**
 * One valid sample App IR for tests and LLM few-shot (M07 includeExample).
 * One screen, View root with Text and Button.
 */
export const sampleIR: AppIR = {
  version: IR_VERSION,
  appId: 'sample-app',
  screens: [
    {
      id: 'screen_home',
      name: 'Home',
      layout: {
        id: 'root_home',
        type: 'View',
        props: {},
        style: { flex: 1, backgroundColor: '#ffffff' },
        children: [
          {
            id: 'text_hello',
            type: 'Text',
            props: { content: 'Hello, World!' },
            style: { fontSize: 24, fontWeight: 'bold' },
          },
          {
            id: 'btn_action',
            type: 'Button',
            props: { label: 'Tap me' },
            style: {},
            events: {
              onPress: { action: 'navigate', target: 'screen_detail' },
            },
          },
        ],
      },
    },
  ],
  navigation: {
    type: 'stack',
    initialScreen: 'screen_home',
  },
  theme: {
    primaryColor: '#6366f1',
    fontFamily: 'Inter',
  },
  dataBindings: {},
  assets: [],
};

/** Return the sample IR (for callers that prefer a function). */
export function getSampleIR(): AppIR {
  return sampleIR;
}
