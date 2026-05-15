"use client"

import { useRealtimeRun } from "@trigger.dev/react-hooks"
import { useLiveblocksFlow } from "@liveblocks/react-flow"
import { Download, Eye, Loader2 } from "lucide-react"
import ReactMarkdown from "react-markdown"
import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react"

import { Button, buttonVariants } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  liveblocksCanvasEdgeSync,
  liveblocksCanvasNodeSync,
} from "@/lib/canvas-liveblocks-flow-sync"
import { cn } from "@/lib/utils"
import type { SpecGenerationApiBody } from "@/lib/spec-generation/spec-generation-schemas"
import type { CanvasEdge, CanvasNode } from "@/types/canvas"

export type AiWorkspaceSpecsPanelProps = {
  projectId: string
  chatHistory: SpecGenerationApiBody["chatHistory"]
}

type SpecListItem = {
  id: string
  createdAt: string
  filename: string
}

function specDownloadPath(projectId: string, specId: string): string {
  return `/api/projects/${encodeURIComponent(projectId)}/specs/${encodeURIComponent(specId)}/download`
}

const specsTimeFormatter =
  typeof Intl !== "undefined"
    ? new Intl.DateTimeFormat(undefined, {
        timeStyle: "short",
        dateStyle: "short",
      })
    : null

function summarizeSpecRunCompletion(run: {
  status?: string
  output?: unknown
  finishedAt?: Date | string
}): { ok: boolean; message: string } {
  const status =
    typeof run?.status === "string" ? run.status.toUpperCase() : ""
  if (
    status === "FAILED" ||
    status === "CRASHED" ||
    status === "CANCELED" ||
    status === "SYSTEM_FAILURE"
  ) {
    return {
      ok: false,
      message: "Spec generation did not finish successfully. Try again shortly.",
    }
  }
  const raw = run?.output
  const out =
    typeof raw === "object" && raw !== null && "ok" in raw
      ? (raw as { ok?: boolean; error?: string })
      : null
  if (out?.ok === true) {
    return { ok: true, message: "Spec saved. It will appear in the list below." }
  }
  if (out?.ok === false && typeof out.error === "string" && out.error.trim()) {
    return { ok: false, message: out.error.trim() }
  }
  return { ok: true, message: "Spec generation finished." }
}

export function AiWorkspaceSpecsPanel({
  projectId,
  chatHistory,
}: AiWorkspaceSpecsPanelProps) {
  const { nodes, edges, isLoading: flowLoading } = useLiveblocksFlow<
    CanvasNode,
    CanvasEdge
  >({
    suspense: false,
    nodes: { initial: [], sync: liveblocksCanvasNodeSync },
    edges: { initial: [], sync: liveblocksCanvasEdgeSync },
  })

  const [specs, setSpecs] = useState<SpecListItem[]>([])
  const [listLoading, setListLoading] = useState(true)
  const [listError, setListError] = useState<string | null>(null)

  const [generateBusy, setGenerateBusy] = useState(false)
  const [generateMessage, setGenerateMessage] = useState<string | null>(null)

  const [specRunId, setSpecRunId] = useState<string | null>(null)
  const [specPublicToken, setSpecPublicToken] = useState<string | null>(null)
  const specFinalizedRef = useRef<Set<string>>(new Set())

  const [preview, setPreview] = useState<SpecListItem | null>(null)
  const [previewBody, setPreviewBody] = useState<string | null>(null)
  const [previewLoading, setPreviewLoading] = useState(false)
  const [previewError, setPreviewError] = useState<string | null>(null)

  const loadSpecs = useCallback(async () => {
    setListError(null)
    setListLoading(true)
    try {
      const res = await fetch(`/api/projects/${encodeURIComponent(projectId)}/specs`)
      const body = (await res.json().catch(() => ({}))) as {
        specs?: SpecListItem[]
        error?: string
      }
      if (!res.ok) {
        setListError(body.error ?? `Could not load specs (${res.status}).`)
        setSpecs([])
        return
      }
      setSpecs(Array.isArray(body.specs) ? body.specs : [])
    } catch {
      setListError("Network error while loading specs.")
      setSpecs([])
    } finally {
      setListLoading(false)
    }
  }, [projectId])

  useEffect(() => {
    const t = window.setTimeout(() => {
      void loadSpecs()
    }, 0)
    return () => window.clearTimeout(t)
  }, [loadSpecs])

  const specRealtimeEnabled =
    typeof specRunId === "string" &&
    specRunId.length > 0 &&
    typeof specPublicToken === "string" &&
    specPublicToken.length > 0

  const { run: specTriggerRun } = useRealtimeRun(specRunId ?? undefined, {
    accessToken: specPublicToken ?? undefined,
    enabled: specRealtimeEnabled,
  })

  useEffect(() => {
    if (!specRunId || !specPublicToken) return
    if (specTriggerRun?.id !== specRunId || !specTriggerRun.finishedAt) return
    if (specFinalizedRef.current.has(specRunId)) return
    specFinalizedRef.current.add(specRunId)

    const { ok, message } = summarizeSpecRunCompletion(specTriggerRun)
    setGenerateMessage(message)
    if (ok) {
      window.setTimeout(() => {
        void loadSpecs()
      }, 0)
    }

    setSpecRunId(null)
    setSpecPublicToken(null)
  }, [
    loadSpecs,
    specPublicToken,
    specRunId,
    specTriggerRun,
  ])

  useEffect(() => {
    if (!preview) {
      return
    }

    const ac = new AbortController()
    let cancelled = false

    const timer = window.setTimeout(() => {
      if (cancelled) return
      setPreviewBody(null)
      setPreviewLoading(true)
      setPreviewError(null)

      ;(async () => {
        try {
          const res = await fetch(specDownloadPath(projectId, preview.id), {
            signal: ac.signal,
          })
          if (!res.ok) {
            const errBody = (await res.json().catch(() => ({}))) as {
              error?: string
            }
            if (!cancelled) {
              setPreviewError(
                errBody.error ?? `Could not load preview (${res.status}).`
              )
            }
            return
          }
          const text = await res.text()
          if (!cancelled) setPreviewBody(text)
        } catch (e) {
          if (!cancelled && e instanceof DOMException && e.name === "AbortError") {
            return
          }
          if (!cancelled) {
            setPreviewError("Could not load spec content.")
          }
        } finally {
          if (!cancelled) setPreviewLoading(false)
        }
      })()
    }, 0)

    return () => {
      cancelled = true
      window.clearTimeout(timer)
      ac.abort()
    }
  }, [preview, projectId])

  const onGenerate = useCallback(async () => {
    if (generateBusy || flowLoading || nodes === null || edges === null) return

    setGenerateBusy(true)
    setGenerateMessage(null)
    try {
      const res = await fetch("/api/ai/spec", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          roomId: projectId,
          chatHistory,
          nodes,
          edges,
        }),
      })

      const startBody = (await res.json().catch(() => ({}))) as {
        error?: string
        runId?: string
      }

      if (!res.ok) {
        setGenerateMessage(
          startBody.error ?? `Could not start spec generation (${res.status}).`
        )
        return
      }

      const rid =
        typeof startBody.runId === "string" ? startBody.runId.trim() : ""
      if (rid === "") {
        setGenerateMessage("No run id returned from the server.")
        return
      }

      const tokenRes = await fetch("/api/ai/spec/token", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ runId: rid }),
      })
      const tokenBody = (await tokenRes.json().catch(() => ({}))) as {
        token?: string
        error?: string
      }

      if (!tokenRes.ok || typeof tokenBody.token !== "string") {
        setGenerateMessage(
          tokenBody.error ??
            "Generation started but realtime updates are unavailable."
        )
        return
      }

      specFinalizedRef.current.delete(rid)
      setSpecRunId(rid)
      setSpecPublicToken(tokenBody.token)
    } catch {
      setGenerateMessage("Network error while starting spec generation.")
    } finally {
      setGenerateBusy(false)
    }
  }, [chatHistory, edges, generateBusy, flowLoading, nodes, projectId])

  const generateWaiting =
    specRealtimeEnabled &&
    specTriggerRun &&
    specTriggerRun.id === specRunId &&
    !specTriggerRun.finishedAt

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-4">
      <Button
        type="button"
        className="w-full shrink-0 gap-2 bg-accent text-white hover:bg-accent/90 sm:w-auto"
        disabled={
          generateBusy ||
          generateWaiting ||
          flowLoading ||
          nodes === null ||
          edges === null
        }
        onClick={() => void onGenerate()}
      >
        {generateBusy || generateWaiting ? (
          <>
            <Loader2 className="size-4 shrink-0 animate-spin" aria-hidden />
            Generating…
          </>
        ) : (
          "Generate Spec"
        )}
      </Button>

      {generateMessage ? (
        <p
          className={cn(
            "text-xs leading-relaxed",
            generateMessage.includes("did not") ||
              generateMessage.startsWith("Could not") ||
              generateMessage.includes("Network")
              ? "text-state-error"
              : "text-copy-muted"
          )}
          role="status"
        >
          {generateMessage}
        </p>
      ) : null}

      <div className="flex min-h-0 flex-1 flex-col gap-2">
        <p className="text-xs font-medium text-copy-secondary">
          Saved specs for this project
        </p>
        <ScrollArea className="min-h-0 max-h-[min(24rem,calc(100vh-22rem))] rounded-xl border border-surface-border bg-elevated/40">
          <div className="p-2">
            {listLoading ? (
              <div className="flex items-center gap-2 px-2 py-4 text-xs text-muted-text">
                <Loader2 className="size-3.5 shrink-0 animate-spin" aria-hidden />
                Loading specs…
              </div>
            ) : listError ? (
              <div
                className="rounded-lg border border-state-error/30 bg-state-error/10 px-3 py-2 text-xs text-copy-primary"
                role="alert"
              >
                {listError}
              </div>
            ) : specs.length === 0 ? (
              <p className="px-2 py-4 text-xs text-muted-text">
                No specs yet. Generate one from this canvas when you&apos;re ready.
              </p>
            ) : (
              <ul className="flex flex-col gap-0.5">
                {specs.map((s) => {
                  const t = specsTimeFormatter
                    ? specsTimeFormatter.format(new Date(s.createdAt))
                    : ""
                  const href = specDownloadPath(projectId, s.id)
                  return (
                    <li key={s.id}>
                      <div className="flex items-stretch gap-1 rounded-xl border border-transparent hover:border-surface-border hover:bg-base/70">
                        <button
                          type="button"
                          className={cn(
                            "min-w-0 flex-1 px-2.5 py-2 text-left text-xs outline-none",
                            "focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                          )}
                          onClick={() => setPreview(s)}
                          aria-label={`Preview ${s.filename}`}
                        >
                          <span className="block truncate font-medium text-primary-text">
                            {s.filename}
                          </span>
                          <span className="mt-0.5 block tabular-nums text-[0.6875rem] text-muted-text">
                            {t}
                          </span>
                        </button>
                        <div className="flex shrink-0 flex-col justify-center gap-0.5 pr-1 py-1">
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon-sm"
                            className="size-8 text-copy-muted hover:text-accent-text"
                            aria-label={`Preview ${s.filename}`}
                            onClick={(e) => {
                              e.stopPropagation()
                              setPreview(s)
                            }}
                          >
                            <Eye className="size-4" aria-hidden />
                          </Button>
                          <a
                            href={href}
                            download={s.filename}
                            className={cn(
                              buttonVariants({
                                variant: "ghost",
                                size: "icon-sm",
                              }),
                              "size-8 text-copy-muted hover:text-accent-text"
                            )}
                            aria-label={`Download ${s.filename}`}
                          >
                            <Download className="size-4" aria-hidden />
                          </a>
                        </div>
                      </div>
                    </li>
                  )
                })}
              </ul>
            )}
          </div>
        </ScrollArea>
      </div>

      <Dialog
        open={preview !== null}
        onOpenChange={(open) => {
          if (!open) {
            setPreview(null)
            setPreviewBody(null)
            setPreviewLoading(false)
            setPreviewError(null)
          }
        }}
      >
        <DialogContent
          showCloseButton
          className="flex h-[min(85vh,40rem)] w-[min(92vw,48rem)] max-w-[min(92vw,48rem)] flex-col gap-0 overflow-hidden rounded-3xl bg-elevated p-0 ring-surface-border sm:max-w-[min(92vw,48rem)]"
        >
          <DialogHeader className="shrink-0 border-b border-surface-border px-6 py-4">
            <DialogTitle className="truncate pr-8 font-medium text-primary-text">
              {preview?.filename ?? "Spec preview"}
            </DialogTitle>
          </DialogHeader>
          <div className="min-h-0 flex-1 overflow-x-hidden overflow-y-auto px-6">
            <div className="min-w-0 max-w-full py-4 pb-6">
              {previewLoading ? (
                <div className="flex items-center gap-2 py-8 text-sm text-muted-text">
                  <Loader2 className="size-4 shrink-0 animate-spin" aria-hidden />
                  Loading Markdown…
                </div>
              ) : previewError ? (
                <p className="py-6 text-sm text-state-error" role="alert">
                  {previewError}
                </p>
              ) : previewBody !== null ? (
                <MarkdownPreview markdown={previewBody} />
              ) : null}
            </div>
          </div>
          <DialogFooter className="mx-0 mb-0 shrink-0 rounded-none border-t border-surface-border bg-elevated px-6 py-3">
            <div className="flex w-full flex-wrap items-center gap-2 sm:justify-between">
              {preview ? (
                <a
                  href={specDownloadPath(projectId, preview.id)}
                  download={preview.filename}
                  className={cn(
                    buttonVariants({
                      variant: "outline",
                      size: "sm",
                    }),
                    "inline-flex shrink-0 gap-1.5 border-surface-border text-copy-primary [&_svg]:size-3.5"
                  )}
                >
                  <Download aria-hidden />
                  Download
                </a>
              ) : (
                <span />
              )}
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  setPreview(null)
                  setPreviewBody(null)
                  setPreviewLoading(false)
                  setPreviewError(null)
                }}
              >
                Close
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function MarkdownPreview({ markdown }: { markdown: string }) {
  return (
    <div className="min-w-0 max-w-full break-words text-sm leading-relaxed text-copy-primary [overflow-wrap:anywhere]">
      <ReactMarkdown
        components={{
          h1: ({ children }) => (
            <h1 className="mb-3 mt-1 max-w-full break-words text-xl font-semibold tracking-tight text-primary-text">
              {children}
            </h1>
          ),
          h2: ({ children }) => (
            <h2 className="mb-2 mt-6 max-w-full break-words text-lg font-semibold text-primary-text first:mt-1">
              {children}
            </h2>
          ),
          h3: ({ children }) => (
            <h3 className="mb-1.5 mt-5 max-w-full break-words font-semibold text-primary-text first:mt-0">
              {children}
            </h3>
          ),
          p: ({ children }) => (
            <p className="mb-3 max-w-full break-words whitespace-pre-wrap text-copy-secondary [overflow-wrap:anywhere]">
              {children}
            </p>
          ),
          ul: ({ children }) => (
            <ul className="mb-3 ml-5 list-disc space-y-1 text-copy-secondary">{children}</ul>
          ),
          ol: ({ children }) => (
            <ol className="mb-3 ml-5 list-decimal space-y-1 text-copy-secondary">{children}</ol>
          ),
          li: ({ children }) => <li className="leading-relaxed">{children}</li>,
          strong: ({ children }) => (
            <strong className="font-semibold text-primary-text">{children}</strong>
          ),
          a: ({ children, ...props }) => (
            <a
              {...props}
              className="text-accent-text underline underline-offset-2 hover:opacity-90"
              target="_blank"
              rel="noreferrer noopener"
            >
              {children}
            </a>
          ),
          code: ({ className: codeClassName, children, ...props }) => {
            const inline = typeof codeClassName !== "string" || !codeClassName.includes("language-")
            if (inline) {
              return (
                <code
                  {...props}
                  className={cn(
                    "rounded px-1 py-0.5 font-mono text-[0.8125rem] bg-subtle text-primary-text",
                    codeClassName
                  )}
                >
                  {children}
                </code>
              )
            }
            return (
              <code {...props} className={cn("font-mono text-[0.8125rem]", codeClassName)}>
                {children}
              </code>
            )
          },
          pre: ({ children }) => (
            <pre className="mb-4 max-w-full overflow-x-auto rounded-xl border border-surface-border bg-base p-4 font-mono text-[0.8125rem] text-copy-secondary">
              {children}
            </pre>
          ),
          blockquote: ({ children }) => (
            <blockquote className="mb-3 border-l-2 border-brand pl-3 text-copy-muted italic">
              {children}
            </blockquote>
          ),
        }}
      >
        {markdown}
      </ReactMarkdown>
    </div>
  )
}
