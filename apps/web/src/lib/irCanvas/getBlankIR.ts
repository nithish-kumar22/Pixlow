import { IR_VERSION, type AppIR } from "@pixlow/ir";

/**
 * Return a minimal valid IR document for the canvas.
 * - 1 screen
 * - `View` root layout node
 * - stack navigation with `initialScreen` set to that screen
 *
 * Canvas edits treat this as the source-of-truth.
 */
export function getBlankIR(): AppIR {
  const screenId = "screen_1";
  const rootId = "root_1";

  return {
    version: IR_VERSION,
    appId: "canvas-app",
    screens: [
      {
        id: screenId,
        name: "Screen 1",
        layout: {
          id: rootId,
          type: "View",
          props: {},
          style: { flex: 1 },
          children: [],
        },
      },
    ],
    navigation: {
      type: "stack",
      initialScreen: screenId,
    },
    theme: {},
    dataBindings: {},
    assets: [],
  };
}

