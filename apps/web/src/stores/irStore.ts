/**
 * IR store (M15). Single source of truth for current app IR in the project editor.
 * Supports optional undo/redo via snapshot stack when setIR(..., { recordHistory: true }).
 */

import { create } from "zustand";
import type { AppIR } from "@pixlow/ir";

const MAX_HISTORY = 50;

function cloneIr(ir: AppIR): AppIR {
  return structuredClone(ir);
}

interface IRState {
  ir: AppIR | null;
  past: AppIR[];
  future: AppIR[];
  setIR: (ir: AppIR | null, options?: { recordHistory?: boolean }) => void;
  clearIR: () => void;
  undo: () => void;
  redo: () => void;
}

export const useIRStore = create<IRState>((set, get) => ({
  ir: null,
  past: [],
  future: [],

  setIR: (ir, options) => {
    const recordHistory = options?.recordHistory ?? false;
    const prev = get().ir;
    if (recordHistory && prev !== null && ir !== null) {
      const past = [...get().past, cloneIr(prev)];
      if (past.length > MAX_HISTORY) past.shift();
      set({ ir, past, future: [] });
      return;
    }
    set({ ir, past: [], future: [] });
  },

  clearIR: () => set({ ir: null, past: [], future: [] }),

  undo: () => {
    const { ir, past, future } = get();
    if (past.length === 0 || ir === null) return;
    const snapshot = past[past.length - 1]!;
    const newPast = past.slice(0, -1);
    set({
      ir: cloneIr(snapshot),
      past: newPast,
      future: [...future, cloneIr(ir)],
    });
  },

  redo: () => {
    const { ir, past, future } = get();
    if (future.length === 0 || ir === null) return;
    const snapshot = future[future.length - 1]!;
    const newFuture = future.slice(0, -1);
    set({
      ir: cloneIr(snapshot),
      past: [...past, cloneIr(ir)],
      future: newFuture,
    });
  },
}));

export function useCanUndo(): boolean {
  return useIRStore((s) => s.past.length > 0);
}

export function useCanRedo(): boolean {
  return useIRStore((s) => s.future.length > 0);
}
