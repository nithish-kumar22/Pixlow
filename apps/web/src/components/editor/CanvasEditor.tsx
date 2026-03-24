"use client";

import { useMemo, type CSSProperties } from "react";
import type { LayoutNode, AppIR } from "@pixlow/ir";
import { catalogReactNative } from "@pixlow/ir";
import { DndContext, DragEndEvent, useDraggable, useDroppable, closestCenter } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { SortableContext, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { useIRStore } from "@/stores/irStore";
import { useBuilderStore } from "@/stores/builderStore";
import { ensureValidIRForCanvas } from "@/lib/irCanvas/canvasToIR";
import {
  CAN_HAVE_CHILDREN,
  createDefaultNode,
  getChildren,
  getNodeById,
  updateChildrenByParentId,
  moveItem,
} from "@/lib/irCanvas/irTreeOps";

type ActivePaletteDrag = {
  source: "palette";
  componentType: LayoutNode["type"];
};

type ActiveNodeDrag = {
  source: "node";
  nodeId: string;
  fromParentId: string;
  screenId: string;
};

function PaletteItem({ componentType }: { componentType: LayoutNode["type"] }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: `palette:${componentType}`,
    data: { source: "palette", componentType } satisfies ActivePaletteDrag,
  });

  const style: CSSProperties = {
    transform: transform ? CSS.Transform.toString(transform) : undefined,
    opacity: isDragging ? 0.6 : 1,
  };

  const merged: CSSProperties = {
    ...style,
    borderColor: "var(--builder-border)",
    backgroundColor: "var(--builder-bg)",
    color: "var(--builder-text)",
  };

  return (
    <div
      ref={setNodeRef}
      style={merged}
      className="cursor-grab rounded border px-2 py-2 text-xs active:cursor-grabbing"
      {...listeners}
      {...attributes}
    >
      {componentType}
    </div>
  );
}

type TreeNodeProps = {
  node: LayoutNode;
  depth: number;
  screenId: string;
  sortableEnabled: boolean;
  parentId: string | null;
  selectedNodeId: string | null;
  onSelect: (id: string) => void;
};

function TreeNode({
  node,
  depth,
  screenId,
  sortableEnabled,
  parentId,
  selectedNodeId,
  onSelect,
}: TreeNodeProps) {
  const canDrop = CAN_HAVE_CHILDREN.has(node.type);
  const { setNodeRef: setDroppableNodeRef } = useDroppable({
    id: node.id,
    disabled: !canDrop,
  });

  const sortableData: ActiveNodeDrag = {
    source: "node",
    nodeId: node.id,
    fromParentId: parentId ?? node.id,
    screenId,
  };

  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: node.id,
    data: sortableData satisfies ActiveNodeDrag,
    disabled: !sortableEnabled,
  });

  const combinedRef = (el: HTMLElement | null) => {
    setDroppableNodeRef(el);
    setNodeRef(el);
  };

  const selected = node.id === selectedNodeId;

  const nodeStyle: CSSProperties = {
    transform: transform ? CSS.Transform.toString(transform) : undefined,
    transition,
    opacity: isDragging ? 0.5 : 1,
    marginLeft: depth * 12,
    borderColor: selected ? "var(--builder-accent)" : "var(--builder-border)",
    backgroundColor: "var(--builder-bg)",
    boxShadow: selected ? "0 0 0 2px color-mix(in srgb, var(--builder-accent) 40%, transparent)" : undefined,
  };

  const children = getChildren(node);

  return (
    <div
      ref={combinedRef}
      style={nodeStyle}
      className={`rounded-md border px-2 py-1 text-xs ${canDrop ? "border-dashed" : "border-solid"}`}
      data-nodeid={node.id}
    >
      <div className="flex items-center gap-2">
        {sortableEnabled && (
          <button
            type="button"
            aria-label={`Drag ${node.type}`}
            onClick={(e) => e.stopPropagation()}
            className="rounded px-1.5 py-0.5 text-[10px]"
            style={{
              backgroundColor: "var(--builder-surface-elevated)",
              color: "var(--builder-text-muted)",
            }}
            {...attributes}
            {...listeners}
          >
            Drag
          </button>
        )}
        <button type="button" onClick={() => onSelect(node.id)} className="flex-1 text-left">
          <div className="font-medium" style={{ color: "var(--builder-text)" }}>
            {node.type}
            {node.type === "Text" && typeof node.props.content === "string"
              ? `: ${(node.props.content as string).slice(0, 24)}`
              : ""}
            {node.type === "Button" && typeof node.props.label === "string"
              ? `: ${(node.props.label as string).slice(0, 24)}`
              : ""}
            {node.type === "TextInput" && typeof node.props.placeholder === "string"
              ? `: ${(node.props.placeholder as string).slice(0, 24)}`
              : ""}
          </div>
        </button>
      </div>

      {canDrop && (
        <div className="mt-2">
          {children.length > 0 ? (
            <SortableContext items={children.map((c) => c.id)} strategy={verticalListSortingStrategy}>
              <div className="flex flex-col gap-2">
                {children
                  .filter(Boolean)
                  .slice(0, node.type === "FlatList" ? 1 : undefined)
                  .map((child) => (
                    <TreeNode
                      key={child.id}
                      node={child}
                      depth={depth + 1}
                      screenId={screenId}
                      parentId={node.id}
                      sortableEnabled
                      selectedNodeId={selectedNodeId}
                      onSelect={onSelect}
                    />
                  ))}
              </div>
            </SortableContext>
          ) : (
            <div
              className="rounded px-2 py-1 text-[11px]"
              style={{ backgroundColor: "var(--builder-surface)", color: "var(--builder-text-muted)" }}
            >
              Drop components here
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export function CanvasEditor() {
  const { ir, setIR } = useIRStore();
  const activeScreenId = useBuilderStore((s) => s.activeScreenId);
  const selectedNodeId = useBuilderStore((s) => s.selectedNodeId);
  const setSelectedNodeId = useBuilderStore((s) => s.setSelectedNodeId);

  const componentPalette = useMemo(() => catalogReactNative.map((e) => e.id), []);

  const effectiveActiveScreenId = useMemo(() => {
    if (!ir || ir.screens.length === 0) return null;
    if (activeScreenId && ir.screens.some((s) => s.id === activeScreenId)) return activeScreenId;
    return ir.screens[0]!.id;
  }, [ir, activeScreenId]);

  const activeScreen = useMemo(() => {
    if (!ir || !effectiveActiveScreenId) return null;
    return ir.screens.find((s) => s.id === effectiveActiveScreenId) ?? null;
  }, [ir, effectiveActiveScreenId]);

  const effectiveSelectedNodeId = useMemo(() => {
    if (!activeScreen) return null;
    if (selectedNodeId && getNodeById(activeScreen.layout, selectedNodeId)) return selectedNodeId;
    return activeScreen.layout.id;
  }, [activeScreen, selectedNodeId]);

  const commitStructuralUpdate = (next: AppIR) => {
    const validated = ensureValidIRForCanvas(next);
    setIR(validated, { recordHistory: true });
  };

  const updateLayout = (updater: (layout: LayoutNode) => LayoutNode) => {
    if (!ir || !activeScreen) return;
    const nextScreens = ir.screens.map((s) => (s.id === activeScreen.id ? { ...s, layout: updater(s.layout) } : s));
    setIR({ ...ir, screens: nextScreens }, { recordHistory: true });
  };

  const handleDragEnd = (event: DragEndEvent) => {
    if (!ir || !activeScreen) return;
    const { active, over } = event;
    if (!over) return;

    const overId = String(over.id);
    const activeData = active.data.current as unknown as ActivePaletteDrag | ActiveNodeDrag | null;
    if (!activeData) return;

    const root = activeScreen.layout;

    if (activeData && "source" in activeData && activeData.source === "palette") {
      const componentType = activeData.componentType;
      const targetNode = getNodeById(root, overId);
      if (!targetNode || !CAN_HAVE_CHILDREN.has(targetNode.type)) return;

      const newNode = createDefaultNode(componentType);

      const updatedLayout = updateChildrenByParentId(root, targetNode.id, (children) => {
        if (targetNode.type === "FlatList") return [newNode];
        return [...children, newNode];
      });

      const nextIr: AppIR = {
        ...ir,
        screens: ir.screens.map((s) => (s.id === activeScreen.id ? { ...s, layout: updatedLayout } : s)),
      };

      commitStructuralUpdate(nextIr);
      setSelectedNodeId(newNode.id);
      return;
    }

    if (activeData && "source" in activeData && activeData.source === "node") {
      const draggedNodeId = activeData.nodeId;
      const fromParentId = activeData.fromParentId;
      const targetId = overId;

      if (draggedNodeId === targetId) return;

      const fromParentNode = getNodeById(root, fromParentId);
      const targetNode = getNodeById(root, targetId);

      if (!fromParentNode || !targetNode) return;

      const siblings = getChildren(fromParentNode);
      const draggedIndex = siblings.findIndex((c) => c.id === draggedNodeId);
      const targetIndex = siblings.findIndex((c) => c.id === targetId);

      if (targetIndex !== -1) {
        if (draggedIndex === -1) return;
        const nextChildren = moveItem(siblings, draggedIndex, targetIndex);
        const updatedLayout = updateChildrenByParentId(root, fromParentId, () => nextChildren);
        const nextIr: AppIR = {
          ...ir,
          screens: ir.screens.map((s) => (s.id === activeScreen.id ? { ...s, layout: updatedLayout } : s)),
        };
        commitStructuralUpdate(nextIr);
        return;
      }

      if (!CAN_HAVE_CHILDREN.has(targetNode.type)) return;

      const draggedNode = getNodeById(root, draggedNodeId);
      if (!draggedNode) return;

      const removedLayout = updateChildrenByParentId(root, fromParentId, (children) =>
        children.filter((c) => c.id !== draggedNodeId)
      );

      const updatedLayout2 = updateChildrenByParentId(removedLayout, targetNode.id, (children) => {
        if (targetNode.type === "FlatList") return [draggedNode];
        return [...children, draggedNode];
      });

      const movedNode = getNodeById(updatedLayout2, draggedNodeId);
      if (!movedNode) return;

      const nextIr: AppIR = {
        ...ir,
        screens: ir.screens.map((s) => (s.id === activeScreen.id ? { ...s, layout: updatedLayout2 } : s)),
      };
      commitStructuralUpdate(nextIr);
      setSelectedNodeId(draggedNodeId);
    }
  };

  if (!ir) {
    return (
      <div
        className="flex min-h-[200px] items-center justify-center p-4 text-sm"
        style={{ color: "var(--builder-text-muted)" }}
      >
        Generate an app (or restore a version) to start editing.
      </div>
    );
  }

  if (!activeScreen?.layout) {
    return null;
  }

  return (
    <div className="flex h-full min-h-0 flex-col gap-2 p-2">
      <DndContext collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <div className="flex min-h-0 flex-1 gap-2">
          <div
            className="w-44 shrink-0 overflow-y-auto rounded-lg border p-2"
            style={{ borderColor: "var(--builder-border)", backgroundColor: "var(--builder-bg)" }}
          >
            <div className="mb-2 text-xs font-semibold" style={{ color: "var(--builder-text)" }}>
              Palette
            </div>
            <div className="flex flex-col gap-2">
              {componentPalette.map((t) => (
                <PaletteItem key={t} componentType={t as LayoutNode["type"]} />
              ))}
            </div>
            <p className="mt-2 text-[10px]" style={{ color: "var(--builder-text-muted)" }}>
              Drag onto a node that accepts children.
            </p>
          </div>

          <div className="min-h-0 min-w-0 flex-1 overflow-auto rounded-lg border p-2" style={{ borderColor: "var(--builder-border)" }}>
            <TreeNode
              node={activeScreen.layout}
              depth={0}
              screenId={activeScreen.id}
              sortableEnabled={false}
              parentId={null}
              selectedNodeId={effectiveSelectedNodeId}
              onSelect={(id) => setSelectedNodeId(id)}
            />
          </div>
        </div>
      </DndContext>
    </div>
  );
}
