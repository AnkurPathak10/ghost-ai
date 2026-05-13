import {
  DEFAULT_NODE_FILL,
  NODE_SHAPES,
  type NodeShape,
} from "@/types/canvas"

/** MIME type for HTML5 drag payloads from the shape palette. */
export const CANVAS_SHAPE_DRAG_MIME = "application/x-ghost-canvas-shape"

export type CanvasShapeDragPayload = {
  shape: NodeShape
  width: number
  height: number
}

const DEFAULT_SIZES: Record<NodeShape, { width: number; height: number }> = {
  rectangle: { width: 176, height: 96 },
  circle: { width: 112, height: 112 },
  diamond: { width: 144, height: 144 },
  pill: { width: 192, height: 72 },
  cylinder: { width: 136, height: 104 },
  hexagon: { width: 136, height: 120 },
}

export function getDefaultShapeSize(shape: NodeShape): {
  width: number
  height: number
} {
  return DEFAULT_SIZES[shape]
}

export function buildShapeDragPayload(shape: NodeShape): CanvasShapeDragPayload {
  const { width, height } = getDefaultShapeSize(shape)
  return { shape, width, height }
}

export function serializeShapeDragPayload(
  payload: CanvasShapeDragPayload
): string {
  return JSON.stringify(payload)
}

export function parseShapeDragPayload(
  raw: string
): CanvasShapeDragPayload | null {
  try {
    const v = JSON.parse(raw) as unknown
    if (!v || typeof v !== "object") return null
    const rec = v as Record<string, unknown>
    const shape = rec.shape
    const width = rec.width
    const height = rec.height
    if (
      typeof shape !== "string" ||
      !NODE_SHAPES.includes(shape as NodeShape)
    ) {
      return null
    }
    if (typeof width !== "number" || typeof height !== "number") {
      return null
    }
    return { shape: shape as NodeShape, width, height }
  } catch {
    return null
  }
}

let shapeDropCounter = 0

export function nextCanvasShapeNodeId(shape: NodeShape): string {
  shapeDropCounter += 1
  return `${shape}-${Date.now()}-${shapeDropCounter}`
}

export const DEFAULT_NEW_NODE_COLOR = DEFAULT_NODE_FILL
