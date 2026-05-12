"use client"

import { UserButton } from "@clerk/nextjs"
import { PanelLeftClose, PanelLeftOpen, Share2, Sparkles } from "lucide-react"

import { useEditorWorkspace } from "@/components/editor/editor-workspace-provider"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

export interface EditorNavbarProps {
  sidebarOpen: boolean
  onSidebarToggle: () => void
  className?: string
}

export function EditorNavbar({
  sidebarOpen,
  onSidebarToggle,
  className,
}: EditorNavbarProps) {
  const {
    workspaceProject,
    aiSidebarOpen,
    toggleAiSidebar,
    openShareDialog,
  } = useEditorWorkspace()

  return (
    <header
      className={cn(
        "fixed top-0 right-0 left-0 z-40 flex h-14 shrink-0 items-stretch border-b border-surface-border bg-surface",
        className
      )}
    >
      <div className="grid w-full grid-cols-[auto_1fr_auto] items-center gap-3 px-2 sm:gap-4 sm:px-3">
        <div className="flex shrink-0 items-center justify-start">
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            className="text-copy-secondary"
            aria-expanded={sidebarOpen}
            aria-label={sidebarOpen ? "Close project sidebar" : "Open project sidebar"}
            onClick={onSidebarToggle}
          >
            {sidebarOpen ? (
              <PanelLeftClose className="h-5 w-5" aria-hidden />
            ) : (
              <PanelLeftOpen className="h-5 w-5" aria-hidden />
            )}
          </Button>
        </div>

        <div className="min-w-0 justify-self-center truncate text-center">
          {workspaceProject ? (
            <p className="truncate text-sm text-copy-primary">
              <span className="font-medium">{workspaceProject.name}</span>
              <span className="text-copy-muted"> / </span>
              <span className="text-copy-secondary">Workspace</span>
            </p>
          ) : null}
        </div>

        <div className="flex shrink-0 items-center justify-end gap-2">
          {workspaceProject ? (
            <>
              <Button
                type="button"
                variant="ghost"
                size="lg"
                className={cn(
                  "h-9 gap-2 rounded-xl border border-surface-border bg-elevated px-3.5 font-semibold text-copy-primary",
                  "[&_svg]:text-copy-primary [&_svg]:opacity-90",
                  "hover:bg-subtle hover:text-copy-primary [&_svg]:hover:opacity-100"
                )}
                aria-label="Open share dialog"
                onClick={openShareDialog}
              >
                <Share2 className="size-4" aria-hidden />
                Share
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="lg"
                className={cn(
                  "h-9 gap-2 rounded-xl px-3.5 font-medium",
                  aiSidebarOpen
                    ? "border border-transparent bg-accent-ai text-(--color-base) hover:bg-accent-ai/90 [&_svg]:text-(--color-base)"
                    : "border border-accent-ai-text/35 bg-subtle text-accent-ai-text hover:border-accent-ai-text/55 hover:bg-elevated [&_svg]:text-accent-ai-text"
                )}
                aria-pressed={aiSidebarOpen}
                aria-expanded={aiSidebarOpen}
                aria-label={
                  aiSidebarOpen ? "Hide AI Copilot panel" : "Show AI Copilot panel"
                }
                onClick={toggleAiSidebar}
              >
                <Sparkles className="size-4" aria-hidden />
                AI
              </Button>
            </>
          ) : null}
          <UserButton />
        </div>
      </div>
    </header>
  )
}
