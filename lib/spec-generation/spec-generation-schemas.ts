import { z } from "zod"

import { NODE_SHAPES, type NodeShape } from "@/types/canvas"
import { aiChatFeedMessageDataSchema } from "@/types/tasks"

const nodeShapeTuple = NODE_SHAPES as unknown as [NodeShape, ...NodeShape[]]

const canvasNodeSchema = z
  .object({
    id: z.string().min(1),
    type: z.literal("canvasNode"),
    position: z.object({
      x: z.number(),
      y: z.number(),
    }),
    data: z.object({
      label: z.string(),
      color: z.string(),
      labelColor: z.string().optional(),
      shape: z.enum(nodeShapeTuple),
    }),
    width: z.number().optional(),
    height: z.number().optional(),
  })
  .passthrough()

const canvasEdgeSchema = z
  .object({
    id: z.string().min(1),
    type: z.literal("canvasEdge"),
    source: z.string().min(1),
    target: z.string().min(1),
    sourceHandle: z.string().nullable().optional(),
    targetHandle: z.string().nullable().optional(),
    label: z.string().optional(),
  })
  .passthrough()

/** Body for `POST /api/ai/spec` (no `projectId` — resolved server-side from `roomId`). */
export const specGenerationApiBodySchema = z.object({
  roomId: z.string().min(1).max(512),
  chatHistory: z.array(aiChatFeedMessageDataSchema).max(200),
  nodes: z.array(canvasNodeSchema).max(600),
  edges: z.array(canvasEdgeSchema).max(800),
})

export type SpecGenerationApiBody = z.infer<typeof specGenerationApiBodySchema>

/** Payload passed to the `generate-spec` Trigger.dev task. */
export const generateSpecTaskPayloadSchema = specGenerationApiBodySchema.extend({
  projectId: z.string().min(1).max(512),
})

export type GenerateSpecTaskPayload = z.infer<typeof generateSpecTaskPayloadSchema>
