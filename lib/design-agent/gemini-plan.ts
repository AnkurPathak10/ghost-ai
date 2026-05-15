import { generateText, stepCountIs, tool } from "ai"

import { getOpenRouterChatModel } from "@/lib/ai/openrouter"
import type { CanvasEdge, CanvasNode } from "@/types/canvas"

import {
  addEdgeToolSchema,
  addNodeToolSchema,
  deleteEdgeToolSchema,
  deleteNodeToolSchema,
  finishDesignPlanToolSchema,
  moveNodeToolSchema,
  resizeNodeToolSchema,
  type DesignAgentAction,
  type DesignAgentPlan,
  updateNodeDataToolSchema,
} from "@/lib/design-agent/design-plan"

function buildUserPrompt(input: {
  prompt: string
  nodes: CanvasNode[]
  edges: CanvasEdge[]
}): string {
  const snapshot = {
    nodes: input.nodes.map((n) => ({
      id: n.id,
      position: n.position,
      width: n.width,
      height: n.height,
      data: n.data,
    })),
    edges: input.edges.map((e) => ({
      id: e.id,
      source: e.source,
      target: e.target,
      sourceHandle: e.sourceHandle,
      targetHandle: e.targetHandle,
      label: typeof e.label === "string" ? e.label : undefined,
    })),
  }

  return `User request:\n"""${input.prompt}"""\n\nCurrent canvas JSON:\n${JSON.stringify(snapshot, null, 2)}\n\nEdit the diagram by calling the canvas tools. Use stable kebab-case ids for new nodes and edges (e.g. "svc-auth", "e-auth-db"). Prefer grid spacing of about 140–180px between sibling nodes. Default edge handles: ghost-bottom → ghost-top unless side routing is clearer.

Palette ids for colors only (never hex): neutral, blue, purple, orange, red, pink, green, teal.

Shapes: rectangle, diamond, circle, pill, cylinder, hexagon — match role (services: rectangle/pill, storage: cylinder, decisions: diamond, external: circle).

Keep labels short (≤ 40 chars). To replace the whole diagram, delete edges then nodes before adding new ones.

When done, you MUST call finishDesignPlan with a short summary.`
}

const SYSTEM = `You are Ghost AI's system architect. You MUST use the provided tools to describe canvas edits — do not answer with a giant JSON blob.
Call tools in a sensible order (deletes before adds that replace content; add nodes before edges that reference them).
Use only palette ids for colors, never raw hex. After all tools for this request, call finishDesignPlan exactly once.`

/**
 * Plans canvas edits via OpenRouter (OpenAI-compatible API) tool calls.
 * Pattern aligns with AI SDK multi-step tool loops; see https://ai-sdk.dev/docs/ai-sdk-core/generating-structured-data
 */
export async function generateDesignAgentPlan(input: {
  prompt: string
  nodes: CanvasNode[]
  edges: CanvasEdge[]
}): Promise<DesignAgentPlan> {
  const actions: DesignAgentAction[] = []
  const finishState = { summary: "" }

  const record = (a: DesignAgentAction) => {
    actions.push(a)
    return { ok: true as const }
  }

  const result = await generateText({
    model: getOpenRouterChatModel(),
    system: SYSTEM,
    prompt: buildUserPrompt(input),
    tools: {
      addNode: tool({
        description:
          "Add a collaborative canvas node at (x,y) with shape and optional palette color.",
        inputSchema: addNodeToolSchema,
        execute: async (i) => record({ op: "addNode", ...i }),
      }),
      moveNode: tool({
        description: "Move an existing node by id to a new flow position.",
        inputSchema: moveNodeToolSchema,
        execute: async (i) => record({ op: "moveNode", ...i }),
      }),
      resizeNode: tool({
        description: "Resize an existing node's width and height.",
        inputSchema: resizeNodeToolSchema,
        execute: async (i) => record({ op: "resizeNode", ...i }),
      }),
      updateNodeData: tool({
        description:
          "Update label, palette color, and/or shape on an existing node.",
        inputSchema: updateNodeDataToolSchema,
        execute: async (i) => record({ op: "updateNodeData", ...i }),
      }),
      deleteNode: tool({
        description:
          "Remove a node by id (connected edges should be deleted first or will be removed when applying deletes).",
        inputSchema: deleteNodeToolSchema,
        execute: async (i) => record({ op: "deleteNode", ...i }),
      }),
      addEdge: tool({
        description:
          "Connect two node ids with a canvas edge; use ghost-bottom → ghost-top by default.",
        inputSchema: addEdgeToolSchema,
        execute: async (i) => record({ op: "addEdge", ...i }),
      }),
      deleteEdge: tool({
        description: "Remove an edge by id.",
        inputSchema: deleteEdgeToolSchema,
        execute: async (i) => record({ op: "deleteEdge", ...i }),
      }),
      finishDesignPlan: tool({
        description:
          "Final step: submit a brief summary after all canvas tool calls for this request.",
        inputSchema: finishDesignPlanToolSchema,
        execute: async (payload) => {
          finishState.summary = payload.summary
          return { ok: true as const }
        },
      }),
    },
    stopWhen: stepCountIs(48),
  })

  const planSummary =
    finishState.summary.trim() ||
    result.text?.trim() ||
    "Applied canvas updates from tool calls."

  return {
    summary: planSummary,
    actions,
  }
}
