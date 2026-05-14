import { mutateFlow } from "@liveblocks/react-flow/node"
import { logger, task } from "@trigger.dev/sdk/v3"

import {
  applyDesignAgentAction,
  sortDesignActions,
} from "../lib/design-agent/design-plan"
import { generateDesignAgentPlan } from "../lib/design-agent/gemini-plan"
import {
  broadcastAiDesignStatus,
  cursorHintForAction,
  delayMs,
  setDesignAgentPresence,
} from "../lib/design-agent/liveblocks-agent-presence"
import { snapshotFromLiveblocksJson } from "../lib/design-agent/storage-snapshot"
import { createLiveblocksClient } from "../lib/liveblocks-node-client"
import { DESIGN_AGENT_TASK_ID } from "../lib/trigger-task-ids"
import type { CanvasEdge, CanvasNode } from "../types/canvas"

export type DesignAgentPayload = {
  prompt: string
  roomId: string
}

async function finishPresence(
  client: ReturnType<typeof createLiveblocksClient>,
  roomId: string
) {
  await setDesignAgentPresence(client, roomId, {
    cursor: null,
    thinking: false,
    ttlSec: 5,
  })
}

/** Gemini-backed design agent: plans canvas edits, applies via Liveblocks `mutateFlow`, broadcasts status + ephemeral presence. */
export const designAgentTask = task({
  id: DESIGN_AGENT_TASK_ID,
  run: async (payload: DesignAgentPayload, { ctx }) => {
    const roomId = payload.roomId.trim()
    const runId = ctx.run.id
    const liveblocks = createLiveblocksClient()

    const emit = async (
      message: string,
      phase: "start" | "processing" | "complete" | "error"
    ) => {
      await broadcastAiDesignStatus(liveblocks, roomId, {
        message,
        phase,
        runId,
      })
    }

    try {
      await emit("Starting AI architect…", "start")
      await setDesignAgentPresence(liveblocks, roomId, {
        cursor: { x: 240, y: 160 },
        thinking: true,
        ttlSec: 90,
      })

      const rawDoc = await liveblocks.getStorageDocument(roomId, "json")
      const { nodes: snapNodes, edges: snapEdges } =
        snapshotFromLiveblocksJson(rawDoc)

      await emit("Interpreting your prompt with Gemini…", "processing")

      const plan = await generateDesignAgentPlan({
        prompt: payload.prompt,
        nodes: snapNodes,
        edges: snapEdges,
      })

      logger.info("design-agent plan", {
        summary: plan.summary,
        actionCount: plan.actions.length,
        roomId,
        runId,
      })

      await emit(plan.summary || "Applying layout updates…", "processing")

      const sorted = sortDesignActions(plan.actions)

      await mutateFlow<CanvasNode, CanvasEdge>(
        { client: liveblocks, roomId },
        async (flow) => {
          let i = 0
          for (const action of sorted) {
            applyDesignAgentAction(flow, action)
            const hint = cursorHintForAction(flow, action)
            await setDesignAgentPresence(liveblocks, roomId, {
              cursor: hint,
              thinking: true,
              ttlSec: 90,
            })
            i += 1
            if (i % 3 === 0 || sorted.length <= 6) {
              await emit(
                `Applying changes (${i}/${sorted.length})…`,
                "processing"
              )
            }
            await delayMs(sorted.length > 12 ? 80 : 140)
          }
        }
      )

      await emit("Design update complete.", "complete")
      await finishPresence(liveblocks, roomId)

      return {
        ok: true as const,
        summary: plan.summary,
        applied: sorted.length,
      }
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Design agent failed unexpectedly."
      logger.error("design-agent failed", {
        error: message,
        roomId,
        runId,
      })
      try {
        await emit(`Something went wrong: ${message}`, "error")
      } catch {
        /* ignore secondary failures */
      }
      try {
        await finishPresence(liveblocks, roomId)
      } catch {
        /* ignore */
      }
      return {
        ok: false as const,
        error: message,
      }
    }
  },
})
