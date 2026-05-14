import type { JsonObject } from "@liveblocks/client"
import type { Liveblocks } from "@liveblocks/node"
import type { MutableFlow } from "@liveblocks/react-flow/node"

import type { CanvasEdge, CanvasNode } from "@/types/canvas"
import {
  AI_STATUS_FEED_ID,
  aiStatusFeedMessageDataSchema,
} from "@/types/tasks"

import {
  AI_DESIGN_STATUS_EVENT,
  DESIGN_AGENT_LIVEBLOCKS_USER_ID,
  DESIGN_AGENT_USER_INFO,
  type AiDesignStatusPhase,
} from "@/lib/design-agent/constants"
import type { DesignAgentAction } from "@/lib/design-agent/design-plan"

async function ensureAiStatusFeed(
  client: Liveblocks,
  roomId: string
): Promise<void> {
  try {
    await client.createFeed({
      roomId,
      feedId: AI_STATUS_FEED_ID,
      metadata: { name: AI_STATUS_FEED_ID },
    })
  } catch {
    /* feed may already exist */
  }
}

export async function broadcastAiDesignStatus(
  client: Liveblocks,
  roomId: string,
  partial: {
    message: string
    phase: AiDesignStatusPhase
    runId?: string
  }
) {
  await ensureAiStatusFeed(client, roomId)

  await client.broadcastEvent(roomId, {
    type: AI_DESIGN_STATUS_EVENT,
    message: partial.message,
    phase: partial.phase,
    ...(partial.runId !== undefined ? { runId: partial.runId } : {}),
  })

  const feedPayload = aiStatusFeedMessageDataSchema.safeParse({
    phase: partial.phase,
    text: partial.message,
    scope: "design",
    ...(partial.runId !== undefined ? { runId: partial.runId } : {}),
  })

  if (!feedPayload.success) {
    return
  }

  try {
    await client.createFeedMessage({
      roomId,
      feedId: AI_STATUS_FEED_ID,
      data: feedPayload.data as unknown as JsonObject,
    })
  } catch {
    /* non-fatal: Room UI still receives broadcast */
  }
}

export async function setDesignAgentPresence(
  client: Liveblocks,
  roomId: string,
  opts: {
    cursor: { x: number; y: number } | null
    thinking: boolean
    ttlSec?: number
  }
) {
  await client.setPresence(roomId, {
    userId: DESIGN_AGENT_LIVEBLOCKS_USER_ID,
    data: {
      cursor: opts.cursor,
      thinking: opts.thinking,
    },
    userInfo: {
      name: DESIGN_AGENT_USER_INFO.name,
      avatar: DESIGN_AGENT_USER_INFO.avatar,
      color: DESIGN_AGENT_USER_INFO.color,
    },
    ttl: opts.ttlSec ?? 55,
  })
}

export function cursorHintForAction(
  flow: MutableFlow<CanvasNode, CanvasEdge>,
  action: DesignAgentAction
): { x: number; y: number } | null {
  switch (action.op) {
    case "addNode":
      return {
        x: action.x + (action.width ?? 132) / 2,
        y: action.y + (action.height ?? 52) / 2,
      }
    case "moveNode":
      return { x: action.x + 64, y: action.y + 28 }
    case "resizeNode": {
      const n = flow.getNode(action.id)
      if (!n) return null
      const px = n.position.x + action.width / 2
      const py = n.position.y + action.height / 2
      return { x: px, y: py }
    }
    case "updateNodeData":
    case "deleteNode": {
      const n = flow.getNode(action.id)
      if (!n) return { x: 320, y: 240 }
      const w = n.width ?? 132
      const h = n.height ?? 52
      return { x: n.position.x + w / 2, y: n.position.y + h / 2 }
    }
    case "addEdge": {
      const n = flow.getNode(action.source)
      if (!n) return { x: 320, y: 240 }
      const w = n.width ?? 132
      const h = n.height ?? 52
      return { x: n.position.x + w / 2, y: n.position.y + h / 2 }
    }
    case "deleteEdge":
      return { x: 320, y: 240 }
    default:
      return { x: 360, y: 220 }
  }
}

export function delayMs(ms: number) {
  return new Promise<void>((resolve) => {
    setTimeout(resolve, ms)
  })
}
