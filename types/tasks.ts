import { z } from "zod"

/** Liveblocks room feed id for shared AI status (see Feature 24). */
export const AI_STATUS_FEED_ID = "ai-status-feed" as const

/** Liveblocks room feed id for collaborative sidebar chat (see Feature 25). */
export const AI_CHAT_FEED_ID = "ai-chat" as const

export const aiChatFeedRoleSchema = z.enum(["user", "assistant", "system"])

/** Payload stored as each Liveblocks feed message `data` for {@link AI_CHAT_FEED_ID}. */
export const aiChatFeedMessageDataSchema = z.object({
  sender: z.string().min(1).max(200),
  role: aiChatFeedRoleSchema,
  content: z.string().min(1).max(16_000),
  timestamp: z.number().int(),
})

export type AiChatFeedMessageData = z.infer<typeof aiChatFeedMessageDataSchema>

export function parseAiChatFeedMessageData(
  raw: unknown
):
  | { ok: true; data: AiChatFeedMessageData }
  | { ok: false; error: z.ZodError } {
  const parsed = aiChatFeedMessageDataSchema.safeParse(raw)
  if (!parsed.success) {
    return { ok: false, error: parsed.error }
  }
  return { ok: true, data: parsed.data }
}

export const aiStatusPhaseSchema = z.enum([
  "start",
  "processing",
  "complete",
  "error",
])

export const aiGenerationScopeSchema = z.enum(["design", "spec"])

/** Payload stored as each Liveblocks feed message `data` for {@link AI_STATUS_FEED_ID}. */
export const aiStatusFeedMessageDataSchema = z
  .object({
    phase: aiStatusPhaseSchema,
    scope: aiGenerationScopeSchema.optional(),
    text: z.string().optional(),
    message: z.string().optional(),
    runId: z.string().optional(),
  })
  .transform(({ phase, scope, text, message, runId }) => ({
    phase,
    scope,
    text: text ?? message,
    runId,
  }))

export type AiStatusFeedMessageData = z.infer<
  typeof aiStatusFeedMessageDataSchema
>

export function parseAiStatusFeedMessageData(
  raw: unknown
):
  | { ok: true; data: AiStatusFeedMessageData }
  | { ok: false; error: z.ZodError } {
  const parsed = aiStatusFeedMessageDataSchema.safeParse(raw)
  if (!parsed.success) {
    return { ok: false, error: parsed.error }
  }
  return { ok: true, data: parsed.data }
}

export function isAiGenerationActive(
  data: AiStatusFeedMessageData | null
): boolean {
  if (!data) return false
  return data.phase === "start" || data.phase === "processing"
}
