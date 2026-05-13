import type { Edge, Node } from "@xyflow/react"

/** Node palette pairs from `context/ui-context.md` (fill + label color). */
export const NODE_COLORS = [
  { id: "neutral", fill: "#1F1F1F", label: "#EDEDED" },
  { id: "blue", fill: "#10233D", label: "#52A8FF" },
  { id: "purple", fill: "#2E1938", label: "#BF7AF0" },
  { id: "orange", fill: "#331B00", label: "#FF990A" },
  { id: "red", fill: "#3C1618", label: "#FF6166" },
  { id: "pink", fill: "#3A1726", label: "#F75F8F" },
  { id: "green", fill: "#0F2E18", label: "#62C073" },
  { id: "teal", fill: "#062822", label: "#0AC7B4" },
] as const

export type NodeColorSpec = (typeof NODE_COLORS)[number]

export const DEFAULT_NODE_FILL = NODE_COLORS[0].fill

/** Supported canvas node shapes (rendering comes later). */
export const NODE_SHAPES = [
  "rectangle",
  "diamond",
  "circle",
  "pill",
  "cylinder",
  "hexagon",
] as const

export type NodeShape = (typeof NODE_SHAPES)[number]

/** Default edge stroke — `context/ui-context.md` edge style. */
export const EDGE_DEFAULT_STROKE = "#f8fafc"

export type CanvasNodeData = {
  label: string
  /** Node fill hex (typically one of `NODE_COLORS`). */
  color: string
  shape: NodeShape
}

export type CanvasNode = Node<CanvasNodeData, "canvasNode">

export type CanvasEdge = Edge<Record<string, never>, "canvasEdge">
