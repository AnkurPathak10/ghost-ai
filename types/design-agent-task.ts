/** Client-safe mirror of `trigger/design-agent.ts` payloads and return shape — keep in sync with the task implementation. */

export type DesignAgentTaskPayload = {
  prompt: string
  roomId: string
}

export type DesignAgentTaskOutput =
  | {
      ok: true
      summary: string
      applied: number
    }
  | {
      ok: false
      error: string
    }
