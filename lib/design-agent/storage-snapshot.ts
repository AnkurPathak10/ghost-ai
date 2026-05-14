import type { CanvasEdge, CanvasNode } from "@/types/canvas"

/** Pull nodes/edges arrays from `getStorageDocument(roomId, "json")` shape. */
export function snapshotFromLiveblocksJson(doc: unknown): {
  nodes: CanvasNode[]
  edges: CanvasEdge[]
} {
  if (!doc || typeof doc !== "object") {
    return { nodes: [], edges: [] }
  }
  const root = doc as Record<string, unknown>
  const flow = root.flow
  if (!flow || typeof flow !== "object") {
    return { nodes: [], edges: [] }
  }
  const f = flow as Record<string, unknown>
  return {
    nodes: mapRecordOrArrayToNodes(f.nodes),
    edges: mapRecordOrArrayToEdges(f.edges),
  }
}

function mapRecordOrArrayToNodes(raw: unknown): CanvasNode[] {
  if (!raw) return []
  if (Array.isArray(raw)) {
    return raw.filter(isCanvasNodeLike) as CanvasNode[]
  }
  if (typeof raw === "object") {
    return Object.values(raw).filter(isCanvasNodeLike) as CanvasNode[]
  }
  return []
}

function mapRecordOrArrayToEdges(raw: unknown): CanvasEdge[] {
  if (!raw) return []
  if (Array.isArray(raw)) {
    return raw.filter(isCanvasEdgeLike) as CanvasEdge[]
  }
  if (typeof raw === "object") {
    return Object.values(raw).filter(isCanvasEdgeLike) as CanvasEdge[]
  }
  return []
}

function isCanvasNodeLike(v: unknown): boolean {
  if (!v || typeof v !== "object") return false
  const n = v as Record<string, unknown>
  return (
    typeof n.id === "string" &&
    n.type === "canvasNode" &&
    typeof n.position === "object" &&
    n.position !== null &&
    typeof (n.position as Record<string, unknown>).x === "number" &&
    typeof (n.position as Record<string, unknown>).y === "number"
  )
}

function isCanvasEdgeLike(v: unknown): boolean {
  if (!v || typeof v !== "object") return false
  const e = v as Record<string, unknown>
  return (
    typeof e.id === "string" &&
    e.type === "canvasEdge" &&
    typeof e.source === "string" &&
    typeof e.target === "string"
  )
}
