import { create } from "zustand";

export type WorkspaceTab = "canvas" | "preview" | "code";
export type DevicePreset = "mobile" | "tablet" | "desktop";

interface BuilderState {
  workspaceTab: WorkspaceTab;
  activeScreenId: string | null;
  selectedNodeId: string | null;
  devicePreset: DevicePreset;
  canvasZoom: number;
  showCanvasGrid: boolean;
  historyPanelOpen: boolean;
  setWorkspaceTab: (tab: WorkspaceTab) => void;
  setActiveScreenId: (id: string | null) => void;
  setSelectedNodeId: (id: string | null) => void;
  setDevicePreset: (p: DevicePreset) => void;
  setCanvasZoom: (z: number) => void;
  setShowCanvasGrid: (v: boolean) => void;
  setHistoryPanelOpen: (v: boolean) => void;
  reset: () => void;
}

const defaults = {
  workspaceTab: "canvas" as WorkspaceTab,
  activeScreenId: null as string | null,
  selectedNodeId: null as string | null,
  devicePreset: "mobile" as DevicePreset,
  canvasZoom: 1,
  showCanvasGrid: true,
  historyPanelOpen: false,
};

export const useBuilderStore = create<BuilderState>((set) => ({
  ...defaults,
  setWorkspaceTab: (workspaceTab) => set({ workspaceTab }),
  setActiveScreenId: (activeScreenId) => set({ activeScreenId }),
  setSelectedNodeId: (selectedNodeId) => set({ selectedNodeId }),
  setDevicePreset: (devicePreset) => set({ devicePreset }),
  setCanvasZoom: (canvasZoom) => set({ canvasZoom: Math.min(2, Math.max(0.5, canvasZoom)) }),
  setShowCanvasGrid: (showCanvasGrid) => set({ showCanvasGrid }),
  setHistoryPanelOpen: (historyPanelOpen) => set({ historyPanelOpen }),
  reset: () => set({ ...defaults }),
}));
