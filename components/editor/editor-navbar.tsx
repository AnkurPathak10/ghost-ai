"use client"

import { PanelLeftClose, PanelLeftOpen } from "lucide-react"

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
  return (
    <header
      className={cn(
        "fixed top-0 right-0 left-0 z-40 flex h-14 shrink-0 items-stretch border-b border-surface-border bg-surface",
        className
      )}
    >
      <div className="flex w-full items-center px-2 sm:px-3">
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
        <div className="min-w-0 flex-1" />
        <div className="flex shrink-0 items-center justify-end" aria-hidden />
      </div>
    </header>
  )
}
