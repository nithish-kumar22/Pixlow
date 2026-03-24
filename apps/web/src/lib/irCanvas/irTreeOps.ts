import type { LayoutNode } from "@pixlow/ir";

export const CAN_HAVE_CHILDREN = new Set<LayoutNode["type"]>([
  "View",
  "ScrollView",
  "SafeAreaView",
  "FlatList",
]);

export function randomId(prefix: string): string {
  const u =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : `${Math.random()}`;
  return `${prefix}_${String(u).replace(/[^a-zA-Z0-9_\\-]/g, "")}`;
}

export function getChildren(node: LayoutNode): LayoutNode[] {
  return (node.children ?? []) as LayoutNode[];
}

export function getNodeById(root: LayoutNode, id: string): LayoutNode | null {
  if (root.id === id) return root;
  for (const c of getChildren(root)) {
    const found = getNodeById(c, id);
    if (found) return found;
  }
  return null;
}

export function updateNodeById(
  root: LayoutNode,
  id: string,
  updater: (n: LayoutNode) => LayoutNode
): LayoutNode {
  if (root.id === id) return updater(root);
  const children = getChildren(root);
  if (children.length === 0) return root;
  return {
    ...root,
    children: children.map((c) => updateNodeById(c, id, updater)),
  };
}

export function updateChildrenByParentId(
  root: LayoutNode,
  parentId: string,
  update: (children: LayoutNode[]) => LayoutNode[]
): LayoutNode {
  if (root.id === parentId) {
    return {
      ...root,
      children: update(getChildren(root)),
    };
  }
  const children = getChildren(root);
  if (children.length === 0) return root;
  return {
    ...root,
    children: children.map((c) => updateChildrenByParentId(c, parentId, update)),
  };
}

export function moveItem<T>(arr: T[], fromIndex: number, toIndex: number): T[] {
  if (fromIndex === toIndex) return arr;
  const next = [...arr];
  const [item] = next.splice(fromIndex, 1);
  next.splice(toIndex, 0, item);
  return next;
}

export function createDefaultNode(type: LayoutNode["type"]): LayoutNode {
  const id = randomId(type.toLowerCase());
  const base: Omit<LayoutNode, "id" | "type"> = {
    props: {},
    style: {},
    children: [],
    events: undefined,
  };

  switch (type) {
    case "View":
      return { id, type, ...base, style: { flex: 1, padding: 16 } };
    case "ScrollView":
      return { id, type, ...base, style: { flex: 1, padding: 16 } };
    case "SafeAreaView":
      return { id, type, ...base, style: { flex: 1, padding: 16 } };
    case "Text":
      return {
        id,
        type,
        ...base,
        props: { content: "Hello" },
        style: { fontSize: 16, fontWeight: "bold", color: "#111827" },
      };
    case "Button":
      return {
        id,
        type,
        ...base,
        props: { label: "Button" },
        style: {
          paddingVertical: 12,
          paddingHorizontal: 16,
          backgroundColor: "#6366f1",
          borderRadius: 10,
          alignItems: "center",
        },
        events: { onPress: { action: "navigate" } },
      };
    case "TextInput":
      return {
        id,
        type,
        ...base,
        props: { placeholder: "Enter text", value: "" },
        style: {
          borderWidth: 1,
          borderColor: "#e5e7eb",
          borderRadius: 10,
          padding: 12,
          color: "#111827",
        },
      };
    case "Image":
      return {
        id,
        type,
        ...base,
        props: { source: "https://via.placeholder.com/120" },
        style: { width: 120, height: 120, borderRadius: 10 },
      };
    case "FlatList":
      return {
        id,
        type,
        ...base,
        props: { data: [], keyExtractor: "id" },
        style: { flex: 1 },
      };
    default:
      return { id, type, ...base } as LayoutNode;
  }
}
