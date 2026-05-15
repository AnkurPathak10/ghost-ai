import {
  DEFAULT_NODE_FILL,
  type NodeShape,
} from "@/types/canvas"

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

let shapeDropCounter = 0

export function nextCanvasShapeNodeId(shape: NodeShape): string {
  shapeDropCounter += 1
  return `${shape}-${Date.now()}-${shapeDropCounter}`
}

export const DEFAULT_NEW_NODE_COLOR = DEFAULT_NODE_FILL
