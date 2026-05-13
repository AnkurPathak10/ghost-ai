"use client"

import { Bot, Sparkles } from "lucide-react"

import { CollaborativeCanvas } from "@/components/editor/collaborative-canvas"
import { useEditorWorkspace } from "@/components/editor/editor-workspace-provider"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { cn } from "@/lib/utils"

export function EditorWorkspaceViewport({ roomId }: { roomId: string }) {
  const { aiSidebarOpen } = useEditorWorkspace()

  return (
    <div className="flex min-h-[calc(100vh-3.5rem)] w-full overflow-hidden bg-base">
      <div className="relative flex min-w-0 flex-1 flex-col bg-base">
        <CollaborativeCanvas roomId={roomId} />
      </div>
      <aside
        aria-hidden={!aiSidebarOpen}
        className={cn(
          "shrink-0 border-l border-surface-border bg-subtle transition-[width,opacity] duration-200 ease-out",
          aiSidebarOpen
            ? "w-[min(100%,24rem)] opacity-100 sm:w-96"
            : "w-0 overflow-hidden border-transparent opacity-0"
        )}
      >
        <div className="flex h-full min-h-[calc(100vh-3.5rem)] w-[min(100vw,24rem)] flex-col sm:w-96">
          <div className="shrink-0 border-b border-surface-border px-5 py-4">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-lg font-semibold leading-snug tracking-tight text-copy-primary">
                AI Chatbox
              </h2>
              <Sparkles
                className="size-5 shrink-0 text-accent-ai-text"
                strokeWidth={1.75}
                aria-hidden
              />
            </div>
          </div>
          <ScrollArea className="min-h-0 flex-1">
            <div className="flex flex-col gap-3 p-5 pb-8">
              <Card size="sm" className="border-surface-border bg-surface/80">
                <CardHeader className="pb-0">
                  <CardTitle className="text-sm font-semibold text-copy-primary">
                    Chat surface pending
                  </CardTitle>
                  <CardDescription className="text-xs text-copy-muted">
                    Messaging and generation are intentionally out of scope for
                    this shell.
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-3">
                  <div className="flex gap-3 rounded-xl border border-surface-border bg-base/80 px-3 py-3">
                    <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-elevated text-copy-muted">
                      <Bot className="size-5" aria-hidden />
                    </div>
                    <p className="text-left text-xs leading-relaxed text-copy-secondary">
                      The composer, threads, and run status widgets will attach
                      here once the realtime stack is wired.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </ScrollArea>
          <div className="shrink-0 border-t border-surface-border bg-base/60 p-5 pt-4">
            <Card size="sm" className="border-surface-border bg-surface/80">
              <CardHeader>
                <p className="text-[0.6875rem] font-medium tracking-[0.16em] text-copy-muted uppercase">
                  Future hooks
                </p>
                <CardTitle className="text-sm font-semibold text-copy-primary">
                  Prompt composer + task status
                </CardTitle>
                <CardDescription className="text-xs text-copy-muted">
                  A durable prompt bar and Trigger.dev run indicators will slot
                  under this header when backend tasks are ready.
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>
      </aside>
    </div>
  )
}
