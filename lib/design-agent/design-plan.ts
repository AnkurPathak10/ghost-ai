import type { MutableFlow } from "@liveblocks/react-flow/node"
import { z } from "zod"

import {
  EDGE_DEFAULT_STROKE,
  NODE_COLORS,
  type CanvasEdge,
  type CanvasNode,
  type NodeShape,
} from "@/types/canvas"

const PALETTE_IDS = [
  "neutral",
  "blue",
  "purple",
  "orange",
  "red",
  "pink",
  "green",
  "teal",
] as const

const SHAPE_IDS = [
  "rectangle",
  "diamond",
  "circle",
  "pill",
  "cylinder",
  "hexagon",
] as const satisfies readonly NodeShape[]

/** Palette token ids (never hex) — shared by design-agent tools and canvas apply. */
export const paletteSchema = z.enum(PALETTE_IDS)

/** Allowed node shapes — shared by design-agent tools and canvas apply. */
export const shapeSchema = z.enum(SHAPE_IDS)

export const addNodeToolSchema = z.object({
  id: z.string().min(1).describe("Stable kebab-case node id, e.g. svc-auth"),
  label: z.string().describe("Short label shown on the node"),
  shape: shapeSchema,
  color: paletteSchema
    .optional()
    .describe("Palette id; default neutral when omitted"),
  x: z.number().describe("Flow X position"),
  y: z.number().describe("Flow Y position"),
  width: z.number().min(96).max(480).optional(),
  height: z.number().min(48).max(320).optional(),
})

export const moveNodeToolSchema = z.object({
  id: z.string().min(1),
  x: z.number(),
  y: z.number(),
})

export const resizeNodeToolSchema = z.object({
  id: z.string().min(1),
  width: z.number().min(96).max(520),
  height: z.number().min(48).max(360),
})

export const updateNodeDataToolSchema = z.object({
  id: z.string().min(1),
  label: z.string().optional(),
  color: paletteSchema.optional(),
  shape: shapeSchema.optional(),
})

export const deleteNodeToolSchema = z.object({
  id: z.string().min(1),
})

export const addEdgeToolSchema = z.object({
  id: z.string().min(1).describe("Stable edge id, e.g. e-auth-db"),
  source: z.string().min(1),
  target: z.string().min(1),
  sourceHandle: z
    .string()
    .optional()
    .describe("Default ghost-bottom when omitted"),
  targetHandle: z.string().optional().describe("Default ghost-top when omitted"),
})

export const deleteEdgeToolSchema = z.object({
  id: z.string().min(1),
})

export const finishDesignPlanToolSchema = z.object({
  summary: z
    .string()
    .describe(
      "Brief summary of the architecture you modeled for other collaborators"
    ),
})

export type DesignAgentAction =
  | ({ op: "addNode" } & z.infer<typeof addNodeToolSchema>)
  | ({ op: "moveNode" } & z.infer<typeof moveNodeToolSchema>)
  | ({ op: "resizeNode" } & z.infer<typeof resizeNodeToolSchema>)
  | ({ op: "updateNodeData" } & z.infer<typeof updateNodeDataToolSchema>)
  | ({ op: "deleteNode" } & z.infer<typeof deleteNodeToolSchema>)
  | ({ op: "addEdge" } & z.infer<typeof addEdgeToolSchema>)
  | ({ op: "deleteEdge" } & z.infer<typeof deleteEdgeToolSchema>)

export type DesignAgentPlan = {
  summary: string
  actions: DesignAgentAction[]
}

export function sortDesignActions(actions: DesignAgentAction[]): DesignAgentAction[] {
  const rank = (op: DesignAgentAction["op"]) => {
    switch (op) {
      case "deleteEdge":
        return 0
      case "deleteNode":
        return 1
      case "updateNodeData":
        return 2
      case "moveNode":
        return 3
      case "resizeNode":
        return 4
      case "addNode":
        return 5
      case "addEdge":
        return 6
      default:
        return 99
    }
  }
  return [...actions].sort((a, b) => rank(a.op) - rank(b.op))
}

function palettePair(id: z.infer<typeof paletteSchema>) {
  const row = NODE_COLORS.find((c) => c.id === id)
  return row ?? NODE_COLORS[0]
}

/** Apply one validated action to the collaborative flow document. */
export function applyDesignAgentAction(
  flow: MutableFlow<CanvasNode, CanvasEdge>,
  action: DesignAgentAction
): void {
  switch (action.op) {
    case "addNode": {
      const pair = palettePair(action.color ?? "neutral")
      const width = action.width ?? 132
      const height = action.height ?? 52
      const node: CanvasNode = {
        id: action.id,
        type: "canvasNode",
        position: { x: action.x, y: action.y },
        width,
        height,
        data: {
          label: action.label,
          color: pair.fill,
          labelColor: pair.label,
          shape: action.shape,
        },
      }
      flow.addNode(node)
      break
    }
    case "moveNode": {
      flow.updateNode(action.id, (n) => ({
        ...n,
        position: { x: action.x, y: action.y },
      }))
      break
    }
    case "resizeNode": {
      flow.updateNode(action.id, (n) => ({
        ...n,
        width: action.width,
        height: action.height,
      }))
      break
    }
    case "updateNodeData": {
      const patch: Partial<CanvasNode["data"]> = {}
      if (action.label !== undefined) patch.label = action.label
      if (action.shape !== undefined) patch.shape = action.shape
      if (action.color !== undefined) {
        const pair = palettePair(action.color)
        patch.color = pair.fill
        patch.labelColor = pair.label
      }
      if (Object.keys(patch).length > 0) {
        flow.updateNodeData(action.id, patch)
      }
      break
    }
    case "deleteNode": {
      const toRemove = flow
        .edges.filter((e) => e.source === action.id || e.target === action.id)
        .map((e) => e.id)
      if (toRemove.length > 0) {
        flow.removeEdges(toRemove)
      }
      flow.removeNode(action.id)
      break
    }
    case "addEdge": {
      const edge: CanvasEdge = {
        id: action.id,
        type: "canvasEdge",
        source: action.source,
        target: action.target,
        sourceHandle: action.sourceHandle ?? "ghost-bottom",
        targetHandle: action.targetHandle ?? "ghost-top",
        markerEnd: {
          type: "arrowclosed",
          color: EDGE_DEFAULT_STROKE,
          width: 20,
          height: 20,
        },
        style: {
          stroke: EDGE_DEFAULT_STROKE,
          strokeWidth: 1.5,
          strokeLinecap: "round",
          strokeLinejoin: "round",
        },
      }
      flow.addEdge(edge)
      break
    }
    case "deleteEdge": {
      flow.removeEdge(action.id)
      break
    }
  }
}
