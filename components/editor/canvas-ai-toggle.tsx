"use client"

import { Sparkles } from "lucide-react"

import { useEditorWorkspace } from "@/components/editor/editor-workspace-provider"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

/** Opens the AI workspace sidebar from the canvas (all breakpoints). */
export function CanvasAiToggle() {
  const { aiSidebarOpen, toggleAiSidebar } = useEditorWorkspace()

  return (
    <div
      className={cn(
        "pointer-events-auto fixed z-20",
        /* Below fixed editor navbar (h-14); top-right of canvas */
        "top-16 right-4 sm:right-6"
      )}
    >
      <Button
        type="button"
        variant="ghost"
        size="lg"
        className={cn(
          "h-10 gap-2 rounded-2xl px-4 font-medium shadow-lg backdrop-blur-sm",
          aiSidebarOpen
            ? "border border-transparent bg-accent-ai text-(--color-base) hover:bg-accent-ai/90 [&_svg]:text-(--color-base)"
            : "border border-accent-ai-text/35 bg-surface/95 text-accent-ai-text hover:border-accent-ai-text/55 hover:bg-elevated [&_svg]:text-accent-ai-text"
        )}
        aria-pressed={aiSidebarOpen}
        aria-expanded={aiSidebarOpen}
        aria-label={
          aiSidebarOpen ? "Hide AI workspace" : "Open AI workspace"
        }
        onClick={toggleAiSidebar}
      >
        <Sparkles className="size-4" aria-hidden />
        AI
      </Button>
    </div>
  )
}
