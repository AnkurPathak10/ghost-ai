/** Stable Liveblocks `userId` for ephemeral AI presence (must match `resolveUsers` + auth-less agent). */
export const DESIGN_AGENT_LIVEBLOCKS_USER_ID = "ghost-ai-design-agent" as const

/** Cursor / avatar metadata for the design agent (indigo AI accent from UI context). */
export const DESIGN_AGENT_USER_INFO = {
  name: "Ghost AI",
  avatar: "",
  color: "#6457f9",
} as const

export const AI_DESIGN_STATUS_EVENT = "ai-design-status" as const

export type AiDesignStatusPhase = "start" | "processing" | "complete" | "error"

export type AiDesignStatusEventPayload = {
  type: typeof AI_DESIGN_STATUS_EVENT
  message: string
  phase: AiDesignStatusPhase
  /** Trigger.dev run id when started from a task */
  runId?: string
}
