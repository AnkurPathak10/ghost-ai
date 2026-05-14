"use client"

import { useUser } from "@clerk/nextjs"
import type { JsonObject } from "@liveblocks/client"
import {
  useCreateFeed,
  useCreateFeedMessage,
  useFeedMessages,
  useStatus,
  useUpdateMyPresence,
} from "@liveblocks/react"
import { useRealtimeRun } from "@trigger.dev/react-hooks"
import {
  Bot,
  Download,
  FileText,
  Loader2,
  SendHorizontal,
  X,
} from "lucide-react"
import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties } from "react"

import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { cn } from "@/lib/utils"
import {
  AI_CHAT_FEED_ID,
  AI_STATUS_FEED_ID,
  aiChatFeedMessageDataSchema,
  isAiGenerationActive,
  parseAiChatFeedMessageData,
  parseAiStatusFeedMessageData,
  type AiChatFeedMessageData,
  type AiStatusFeedMessageData,
} from "@/types/tasks"
import type { DesignAgentTaskOutput } from "@/types/design-agent-task"
import { NODE_COLORS } from "@/types/canvas"

const STARTER_PROMPTS = [
  "Design an e-commerce backend",
  "Create a chat app architecture",
  "Build a CI/CD pipeline",
] as const

export interface AiWorkspaceSidebarProps {
  onClose: () => void
  /** Liveblocks room id / Prisma project id for design runs */
  projectId: string
  className?: string
}

function selectLatestValidatedFeedStatus(
  messages: readonly { id: string; createdAt: number; data: unknown }[]
): AiStatusFeedMessageData | null {
  const sorted = [...messages].sort((a, b) => b.createdAt - a.createdAt)
  for (const m of sorted) {
    const parsed = parseAiStatusFeedMessageData(m.data)
    if (parsed.ok) return parsed.data
  }
  return null
}

const chatTimeFormatter =
  typeof Intl !== "undefined"
    ? new Intl.DateTimeFormat(undefined, {
        timeStyle: "short",
        dateStyle: "short",
      })
    : null

const CANVAS_GREEN = NODE_COLORS.find((n) => n.id === "green") ?? NODE_COLORS[0]

const AI_ASSISTANT_SENDER = "Ghost AI"

function summarizeDesignRunCompletion(
  run:
    | { status?: string; output?: unknown; finishedAt?: Date | string }
    | undefined
): string {
  const status =
    typeof run?.status === "string" ? run.status.toUpperCase() : ""
  if (
    status === "FAILED" ||
    status === "CRASHED" ||
    status === "CANCELED" ||
    status === "SYSTEM_FAILURE"
  ) {
    return "The design agent run did not finish successfully. Try again shortly."
  }
  const raw = run?.output
  const out =
    typeof raw === "object" &&
    raw !== null &&
    "ok" in raw
      ? (raw as DesignAgentTaskOutput)
      : null
  if (out?.ok === true) {
    const summary = typeof out.summary === "string" ? out.summary.trim() : ""
    return summary.length > 0 ? summary : "Design updates were applied to the canvas."
  }
  if (out?.ok === false && typeof out.error === "string" && out.error.trim()) {
    return `Something went wrong: ${out.error.trim()}`
  }
  return "Design run finished."
}

export function AiWorkspaceSidebar(props: AiWorkspaceSidebarProps) {
  const roomStatus = useStatus()
  if (roomStatus !== "connected") {
    return (
      <AiWorkspaceSidebarRoomConnecting {...props} roomStatus={roomStatus} />
    )
  }
  return <AiWorkspaceSidebarRoomReady {...props} />
}

function AiWorkspaceSidebarRoomConnecting({
  onClose,
  className,
  roomStatus,
}: AiWorkspaceSidebarProps & {
  roomStatus: ReturnType<typeof useStatus>
}) {
  const statusMessage = useMemo(() => {
    switch (roomStatus) {
      case "initial":
        return "Preparing live collaboration…"
      case "connecting":
        return "Connecting to the shared room…"
      case "reconnecting":
        return "Reconnecting…"
      case "disconnected":
        return "Not connected to the Liveblocks room. Check your network and try again."
      default:
        return "Waiting for the room connection…"
    }
  }, [roomStatus])

  return (
    <div className={cn("flex min-h-0 flex-1 flex-col", className)}>
      <div className="shrink-0 border-b border-surface-border px-5 py-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex min-w-0 items-start gap-3">
            <div
              className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-subtle text-accent-text"
              aria-hidden
            >
              <Bot className="size-4" strokeWidth={1.75} />
            </div>
            <div className="min-w-0">
              <h2 className="text-lg font-semibold leading-snug tracking-tight text-primary-text">
                AI Workspace
              </h2>
              <p className="mt-0.5 text-sm leading-snug text-muted-text">
                Collaborate with Ghost AI
              </p>
            </div>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            className="shrink-0 text-copy-secondary"
            aria-label="Close AI sidebar"
            onClick={onClose}
          >
            <X className="h-5 w-5" aria-hidden />
          </Button>
        </div>
      </div>
      <div className="flex min-h-[12rem] flex-1 flex-col items-center justify-center gap-3 px-6 py-10 text-center">
        <Loader2 className="size-8 shrink-0 animate-spin text-accent-text" aria-hidden />
        <p className="max-w-xs text-sm text-muted-text">{statusMessage}</p>
        <p className="max-w-sm text-xs leading-relaxed text-copy-muted">
          The collaboration websocket must be up before room feeds load. If the chat
          showed a fetch timeout before, it was usually this race — waiting briefly here
          avoids it.
        </p>
      </div>
    </div>
  )
}

function AiWorkspaceSidebarRoomReady({
  onClose,
  projectId,
  className,
}: AiWorkspaceSidebarProps) {
  const { user } = useUser()
  const [draft, setDraft] = useState("")
  const [designRunPostBusy, setDesignRunPostBusy] = useState(false)
  const [chatSendError, setChatSendError] = useState<string | null>(null)
  const [designRunId, setDesignRunId] = useState<string | null>(null)
  const [designPublicToken, setDesignPublicToken] = useState<string | null>(null)
  const chatEndRef = useRef<HTMLDivElement>(null)

  const createFeed = useCreateFeed()
  const createFeedMessage = useCreateFeedMessage()
  const updateMyPresence = useUpdateMyPresence()
  const pendingRunRef = useRef<string | null>(null)
  /** Prevents duplicate final chat messages when both realtime + fallback fire. */
  const finalizedRunIdsRef = useRef<Set<string>>(new Set())

  const feedState = useFeedMessages(AI_STATUS_FEED_ID, { limit: 100 })
  const chatFeedState = useFeedMessages(AI_CHAT_FEED_ID, { limit: 200 })

  const latestStatus = useMemo(() => {
    if (feedState.isLoading || feedState.error) {
      return null
    }
    return selectLatestValidatedFeedStatus(feedState.messages)
  }, [feedState])

  const validatedChatEntries = useMemo(() => {
    if (chatFeedState.isLoading || chatFeedState.error) {
      return []
    }
    const out: Array<{
      id: string
      createdAt: number
      data: AiChatFeedMessageData
    }> = []
    for (const m of chatFeedState.messages) {
      const parsed = parseAiChatFeedMessageData(m.data)
      if (parsed.ok) {
        out.push({ id: m.id, createdAt: m.createdAt, data: parsed.data })
      }
    }
    return out.sort((a, b) => a.createdAt - b.createdAt)
  }, [chatFeedState])

  const realtimeEnabled =
    typeof designRunId === "string" &&
    designRunId.length > 0 &&
    typeof designPublicToken === "string" &&
    designPublicToken.length > 0

  const { run: triggerRun, error: triggerRunRealtimeError } = useRealtimeRun(
    designRunId ?? undefined,
    {
      accessToken: designPublicToken ?? undefined,
      enabled: realtimeEnabled,
    }
  )

  const triggerRunRef = useRef(triggerRun)
  useEffect(() => {
    triggerRunRef.current = triggerRun
  }, [triggerRun])

  const isTrackedDesignRunExecuting =
    realtimeEnabled &&
    !(
      triggerRun?.id === designRunId && Boolean(triggerRun?.finishedAt)
    )

  const generationShared = Boolean(latestStatus && isAiGenerationActive(latestStatus))

  /** Input muted while ours or anyone's AI run is in progress — canvas/presence parity (Feature 24). */
  const inputLocked =
    designRunPostBusy || generationShared || isTrackedDesignRunExecuting

  const sendShowsSpinner =
    designRunPostBusy || isTrackedDesignRunExecuting || generationShared

  const compactDesignStatusVisible = isTrackedDesignRunExecuting && designRunPostBusy === false

  const compactStatusMessage = useMemo(() => {
    if (!compactDesignStatusVisible || !designRunId) return null
    const s = latestStatus
    if (
      typeof s?.runId === "string" &&
      s.runId !== designRunId &&
      isAiGenerationActive(s)
    ) {
      return "Ghost AI is working on another run in this room…"
    }
    const text = typeof s?.text === "string" ? s.text.trim() : ""
    if (text.length > 0) return text
    if (s?.phase === "start") return "Starting AI architect…"
    if (s?.phase === "processing") return "Applying design changes…"
    return "Listening for design run updates…"
  }, [
    compactDesignStatusVisible,
    designRunId,
    latestStatus,
  ])

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      for (const feedId of [AI_STATUS_FEED_ID, AI_CHAT_FEED_ID] as const) {
        try {
          await createFeed(feedId, {
            metadata: { name: feedId },
          })
        } catch {
          /* already created */
        }
        if (cancelled) return
      }
    })()
    return () => {
      cancelled = true
    }
  }, [createFeed])

  useEffect(() => {
    if (!latestStatus) return
    if (latestStatus.phase !== "complete" && latestStatus.phase !== "error") {
      return
    }
    const rid = latestStatus.runId
    if (
      rid !== undefined &&
      pendingRunRef.current !== null &&
      rid === pendingRunRef.current
    ) {
      updateMyPresence({ thinking: false })
      pendingRunRef.current = null
    }
  }, [latestStatus, updateMyPresence])

  const displayName = useMemo(() => {
    const u = user
    if (!u) return "You"
    const primary = u.fullName?.trim()
    if (primary) return primary
    const first = u.firstName?.trim()
    const last = u.lastName?.trim()
    const both = [first, last].filter(Boolean).join(" ")
    if (both) return both
    const email = u.primaryEmailAddress?.emailAddress
    if (email) return email
    return "You"
  }, [user])

  const pushArchitectChatPayload = useCallback(
    async (entry: Omit<AiChatFeedMessageData, never>) => {
      const payload = aiChatFeedMessageDataSchema.safeParse({
        sender: entry.sender,
        role: entry.role,
        content: entry.content,
        timestamp: entry.timestamp,
      })
      if (!payload.success) return false
      await createFeedMessage(
        AI_CHAT_FEED_ID,
        payload.data as unknown as JsonObject
      )
      return true
    },
    [createFeedMessage]
  )

  const clearDesignRealtimeSession = useCallback(() => {
    setDesignRunId(null)
    setDesignPublicToken(null)
  }, [])

  /** Final realtime failure (no typed finish) — delayed to avoid races with subscription. */
  useEffect(() => {
    const rid = designRunId
    const token = designPublicToken
    const err = triggerRunRealtimeError
    if (
      rid === null ||
      token === null ||
      err === undefined ||
      err.message.length === 0
    )
      return
    let disposed = false
    const deadline = window.setTimeout(() => {
      if (disposed) return
      const current = triggerRunRef.current
      if (
        current?.id === rid &&
        Boolean(current.finishedAt)
      )
        return
      if (finalizedRunIdsRef.current.has(rid)) return
      finalizedRunIdsRef.current.add(rid)

      ;(async () => {
        const message = `Couldn't stay connected to Trigger.dev for this run (${err.message}). The job may still complete on the server — watch the canvas and shared AI status feed.`
        try {
          await pushArchitectChatPayload({
            sender: AI_ASSISTANT_SENDER,
            role: "assistant",
            content: message,
            timestamp: Date.now(),
          })
        } finally {
          clearDesignRealtimeSession()
          updateMyPresence({ thinking: false })
          pendingRunRef.current = null
        }
      })()
    }, 3000)

    return () => {
      disposed = true
      window.clearTimeout(deadline)
    }
  }, [
    clearDesignRealtimeSession,
    designPublicToken,
    designRunId,
    pushArchitectChatPayload,
    triggerRunRealtimeError,
    updateMyPresence,
  ])

  useEffect(() => {
    if (!designRunId || !designPublicToken) return
    if (
      triggerRun?.id !== designRunId ||
      !Boolean(triggerRun?.finishedAt)
    )
      return
    if (finalizedRunIdsRef.current.has(designRunId)) return

    finalizedRunIdsRef.current.add(designRunId)
    const copy = summarizeDesignRunCompletion(triggerRun)

    ;(async () => {
      try {
        await pushArchitectChatPayload({
          sender: AI_ASSISTANT_SENDER,
          role: "assistant",
          content: copy,
          timestamp: Date.now(),
        })
      } finally {
        updateMyPresence({ thinking: false })
        pendingRunRef.current = null
        clearDesignRealtimeSession()
      }
    })()
  }, [
    clearDesignRealtimeSession,
    designPublicToken,
    designRunId,
    pushArchitectChatPayload,
    triggerRun?.finishedAt,
    triggerRun?.id,
    triggerRun,
    updateMyPresence,
  ])

  const submitArchitectPrompt = useCallback(
    async (prompt: string, options?: { clearDraft?: boolean }) => {
      const trimmed = prompt.trim()
      if (!trimmed || inputLocked) return

      setDesignRunPostBusy(true)
      setChatSendError(null)
      try {
        const userParsed = aiChatFeedMessageDataSchema.safeParse({
          sender: displayName,
          role: "user" as const,
          content: trimmed,
          timestamp: Date.now(),
        })
        if (!userParsed.success) {
          setChatSendError("Could not validate your message.")
          return
        }
        try {
          const posted = await pushArchitectChatPayload(userParsed.data)
          if (!posted) {
            setChatSendError("Room chat rejected that message.")
            return
          }
        } catch {
          setChatSendError(
            "Could not post your message — check connection and retry."
          )
          return
        }

        const res = await fetch("/api/ai/design", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            prompt: trimmed,
            roomId: projectId,
            projectId,
          }),
        })

        const startBody = (await res.json().catch(() => ({}))) as {
          error?: string
          runId?: string
        }

        if (!res.ok) {
          await pushArchitectChatPayload({
            sender: AI_ASSISTANT_SENDER,
            role: "assistant",
            content:
              startBody.error ??
              `Ghost AI couldn't start (${res.status}). Try again shortly.`,
            timestamp: Date.now(),
          })
          return
        }

        const rid =
          typeof startBody.runId === "string" ? startBody.runId.trim() : ""
        if (rid === "") {
          await pushArchitectChatPayload({
            sender: AI_ASSISTANT_SENDER,
            role: "assistant",
            content: "Ghost AI started but no run id was returned.",
            timestamp: Date.now(),
          })
          return
        }

        const tokenRes = await fetch("/api/ai/design/token", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ runId: rid }),
        })
        const tokenBody = (await tokenRes.json().catch(() => ({}))) as {
          token?: string
          error?: string
        }

        if (!tokenRes.ok || typeof tokenBody.token !== "string") {
          await pushArchitectChatPayload({
            sender: AI_ASSISTANT_SENDER,
            role: "assistant",
            content:
              tokenBody.error ??
              `Design run started (${rid.slice(0, 8)}…), but realtime access couldn't be minted.`,
            timestamp: Date.now(),
          })
          pendingRunRef.current = rid
          updateMyPresence({ thinking: true })
          return
        }

        pendingRunRef.current = rid
        updateMyPresence({ thinking: true })
        setDesignRunId(rid)
        setDesignPublicToken(tokenBody.token)
        finalizedRunIdsRef.current.delete(rid)

        if (options?.clearDraft) setDraft("")
      } catch {
        await pushArchitectChatPayload({
          sender: AI_ASSISTANT_SENDER,
          role: "assistant",
          content:
            "Network error while contacting Ghost AI — check your connection and retry.",
          timestamp: Date.now(),
        }).catch(() => undefined)
      } finally {
        setDesignRunPostBusy(false)
      }
    },
    [
      displayName,
      inputLocked,
      projectId,
      pushArchitectChatPayload,
      updateMyPresence,
    ]
  )

  const submitDraftDesign = useCallback(() => {
    void submitArchitectPrompt(draft, { clearDraft: true })
  }, [draft, submitArchitectPrompt])

  const userBubbleSurfaceStyle = useMemo(() => {
    const bg = CANVAS_GREEN.label
    return {
      backgroundColor: bg,
      borderColor: CANVAS_GREEN.fill,
      color: "var(--primary-foreground)",
    } satisfies CSSProperties
  }, [])

  const architectSendAccentStyle = useMemo(
    () =>
      ({
        backgroundColor: CANVAS_GREEN.label,
        color: "var(--primary-foreground)",
      }) satisfies CSSProperties,
    []
  )

  const submit = useCallback(() => {
    void submitDraftDesign()
  }, [submitDraftDesign])

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ block: "end" })
  }, [
    validatedChatEntries.length,
    latestStatus?.phase,
    feedState.isLoading,
    chatFeedState.isLoading,
  ])

  const accentSendEligible = draft.trim().length > 0 && !inputLocked

  return (
    <div className={cn("flex min-h-0 flex-1 flex-col", className)}>
      <div className="shrink-0 border-b border-surface-border px-5 py-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex min-w-0 items-start gap-3">
            <div
              className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-subtle text-accent-text"
              aria-hidden
            >
              <Bot className="size-4" strokeWidth={1.75} />
            </div>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-lg font-semibold leading-snug tracking-tight text-primary-text">
                  AI Workspace
                </h2>
                {generationShared ? (
                  <span
                    className="inline-flex items-center gap-1.5 rounded-full border border-surface-border bg-elevated px-2 py-0.5 text-[0.6875rem] font-medium text-accent-text"
                    role="status"
                    aria-live="polite"
                  >
                    <Loader2
                      className="size-3 shrink-0 animate-spin"
                      aria-hidden
                    />
                    AI working
                  </span>
                ) : null}
              </div>
              <p className="mt-0.5 text-sm leading-snug text-muted-text">
                Collaborate with Ghost AI
              </p>
            </div>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            className="shrink-0 text-copy-secondary"
            aria-label="Close AI sidebar"
            onClick={onClose}
          >
            <X className="h-5 w-5" aria-hidden />
          </Button>
        </div>
      </div>

      <Tabs defaultValue="architect" className="flex min-h-0 flex-1 flex-col gap-0">
        <div className="shrink-0 border-b border-surface-border px-5 pb-3">
          <TabsList className="w-full bg-subtle p-[3px]">
            <TabsTrigger
              value="architect"
              className="flex-1 text-muted-text data-active:bg-accent data-active:text-accent-foreground"
            >
              AI Architect
            </TabsTrigger>
            <TabsTrigger
              value="specs"
              className="flex-1 text-muted-text data-active:bg-accent data-active:text-accent-foreground"
            >
              Specs
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent
          value="architect"
          className="mt-0 flex min-h-0 flex-1 flex-col gap-0"
        >
          <ScrollArea className="min-h-0 flex-1">
            <div className="flex flex-col gap-3 p-5 pb-4">
              {chatFeedState.error ? (
                <div
                  className="rounded-xl border border-state-error/35 bg-state-error/10 px-3 py-2 text-xs text-copy-primary"
                  role="alert"
                >
                  <p className="font-medium">Could not load room chat.</p>
                  <p className="mt-1 text-copy-muted leading-relaxed">
                    {chatFeedState.error instanceof Error
                      ? chatFeedState.error.message
                      : String(chatFeedState.error)}
                  </p>
                  <p className="mt-2 text-copy-muted leading-relaxed">
                    If the message is “Feed messages fetch timeout”, the room socket
                    was not ready when feeds loaded — that case is guarded in this app
                    now. If it still appears, your Liveblocks project may not have Feeds
                    enabled or the secret key may not match the dashboard.
                  </p>
                </div>
              ) : null}
              {chatFeedState.isLoading && validatedChatEntries.length === 0 ? (
                <p className="text-xs text-muted-text">Loading room chat…</p>
              ) : null}
              {validatedChatEntries.length === 0 &&
              !chatFeedState.isLoading &&
              !chatFeedState.error ? (
                <div className="flex flex-col items-center gap-5 py-6 text-center">
                  <div
                    className="flex size-14 items-center justify-center rounded-2xl bg-subtle text-accent-text"
                    aria-hidden
                  >
                    <Bot className="size-8" strokeWidth={1.5} />
                  </div>
                  <div className="max-w-[20rem] space-y-2">
                    <p className="text-sm font-medium text-primary-text">
                      Start a design conversation
                    </p>
                    <p className="text-xs leading-relaxed text-muted-text">
                      Chat with everyone in this room — messages sync in real time. Use
                      the starters below to run Ghost AI on the shared canvas while
                      collaborators follow status and presence.
                    </p>
                  </div>
                  <div className="flex w-full max-w-md flex-wrap items-center justify-center gap-2">
                    {STARTER_PROMPTS.map((label) => (
                      <button
                        key={label}
                        type="button"
                        disabled={inputLocked}
                        className={cn(
                          "rounded-full border px-3 py-1.5 text-xs font-medium transition-opacity hover:opacity-95 disabled:opacity-40",
                          "bg-subtle disabled:pointer-events-none"
                        )}
                        style={{
                          borderColor: CANVAS_GREEN.label,
                          color: CANVAS_GREEN.label,
                          boxShadow: `0 0 0 1px color-mix(in srgb, ${CANVAS_GREEN.fill}, transparent 40%) inset`,
                        }}
                        onClick={() => void submitArchitectPrompt(label)}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </div>
              ) : null}
              {validatedChatEntries.length > 0 ? (
                <ul className="flex flex-col gap-3">
                  {validatedChatEntries.map(({ id, createdAt, data }) => {
                    const isUser = data.role === "user"
                    const timeLabel = chatTimeFormatter
                      ? chatTimeFormatter.format(createdAt)
                      : ""
                    return (
                      <li
                        key={id}
                        className={cn(
                          "flex w-full flex-col gap-0.5",
                          isUser ? "items-end" : "items-start"
                        )}
                      >
                        <div
                          className={cn(
                            "max-w-[min(100%,20rem)] rounded-2xl border-2 px-3 py-2.5 text-sm leading-relaxed",
                            !isUser && "border-surface-border bg-surface shadow-sm",
                            !isUser && "text-copy-primary"
                          )}
                          style={isUser ? { ...userBubbleSurfaceStyle } : undefined}
                        >
                          <div
                            className={cn(
                              "mb-1 flex flex-wrap items-baseline gap-x-1.5 gap-y-0 text-[0.6875rem] leading-tight",
                              isUser
                                ? "text-[rgba(8,8,9,0.78)]"
                                : "text-copy-muted"
                            )}
                          >
                            <span
                              className={cn(
                                "font-medium",
                                !isUser && "text-copy-secondary"
                              )}
                            >
                              {data.sender}
                            </span>
                            {timeLabel ? (
                              <span className="font-normal tabular-nums">{timeLabel}</span>
                            ) : null}
                          </div>
                          <p className="whitespace-pre-wrap">{data.content}</p>
                        </div>
                      </li>
                    )
                  })}
                  <div ref={chatEndRef} className="h-px w-full shrink-0" />
                </ul>
              ) : null}
            </div>
          </ScrollArea>

          <div className="shrink-0 border-t border-surface-border bg-base/80 p-4">
            {compactDesignStatusVisible && compactStatusMessage ? (
              <div
                className="mb-3 flex min-h-10 items-center gap-2.5 rounded-xl border px-3 py-2 text-xs shadow-inner"
                style={{
                  backgroundColor: CANVAS_GREEN.fill,
                  borderColor: `color-mix(in srgb, ${CANVAS_GREEN.label}, transparent 55%)`,
                }}
                role="status"
                aria-live="polite"
              >
                <span
                  aria-hidden
                  className="inline-flex size-2 shrink-0 rounded-full motion-safe:animate-pulse"
                  style={{
                    backgroundColor: CANVAS_GREEN.label,
                    boxShadow: `0 0 10px color-mix(in srgb, ${CANVAS_GREEN.label}, transparent 20%)`,
                  }}
                />
                <span className="min-w-0 flex-1 text-[0.8125rem] leading-snug text-copy-secondary">
                  {compactStatusMessage}
                </span>
              </div>
            ) : null}
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
              <Textarea
                value={draft}
                onChange={(e) => {
                  setDraft(e.target.value)
                  if (chatSendError) setChatSendError(null)
                }}
                placeholder="Ask about architecture, naming, or constraints…"
                rows={2}
                disabled={inputLocked}
                className="min-h-[72px] max-h-[160px] resize-none overflow-y-auto border-surface-border bg-elevated py-2.5 text-sm text-copy-primary placeholder:text-copy-muted focus-visible:border-ring sm:flex-1"
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault()
                    submit()
                  }
                }}
              />
              <Button
                type="button"
                className={cn(
                  "h-10 shrink-0 gap-2 disabled:opacity-45 sm:h-10 [&_svg]:shrink-0",
                  accentSendEligible && "border-transparent hover:brightness-105"
                )}
                style={
                  accentSendEligible ? architectSendAccentStyle : undefined
                }
                variant="outline"
                onClick={submit}
                disabled={inputLocked || draft.trim() === ""}
                aria-label="Send design prompt"
              >
                {sendShowsSpinner ? (
                  <Loader2 className="size-4 animate-spin" aria-hidden />
                ) : (
                  <SendHorizontal className="size-4" aria-hidden />
                )}
                Send
              </Button>
            </div>
            {chatSendError ? (
              <p className="mt-2 text-xs text-state-error" role="alert">
                {chatSendError}
              </p>
            ) : null}
          </div>
        </TabsContent>

        <TabsContent
          value="specs"
          className="mt-0 flex min-h-0 flex-1 flex-col p-5"
        >
          <div className="flex flex-col gap-4">
            <Button
              type="button"
              className="w-full gap-2 bg-accent text-white hover:bg-accent/90 sm:w-auto"
            >
              Generate Spec
            </Button>

            <div className="rounded-2xl border border-surface-border bg-elevated p-4">
              <div className="flex gap-3">
                <div
                  className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-subtle text-accent-text"
                  aria-hidden
                >
                  <FileText className="size-5" strokeWidth={1.75} />
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="font-semibold text-primary-text">
                    Service mesh ingress
                  </h3>
                  <p className="mt-1 text-sm leading-relaxed text-muted-text">
                    Defines north-south traffic, TLS termination at the edge, and
                    routing rules for internal services…
                  </p>
                </div>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="mt-4 w-full border-surface-border text-copy-muted sm:w-auto"
                disabled
              >
                <Download className="size-4" aria-hidden />
                Download
              </Button>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
