"use client"

import { UserButton } from "@clerk/nextjs"
import {
  AlertCircle,
  Check,
  LayoutTemplate,
  Loader2,
  MoreVertical,
  PanelLeftClose,
  PanelLeftOpen,
  Share2,
} from "lucide-react"
import { useCallback, useEffect, useRef, useState } from "react"

import { useEditorWorkspace } from "@/components/editor/editor-workspace-provider"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

export interface EditorNavbarProps {
  sidebarOpen: boolean
  onSidebarToggle: () => void
  className?: string
}

type CanvasSaveStatus = ReturnType<
  typeof useEditorWorkspace
>["canvasSaveStatus"]

function CanvasSaveIndicator({
  status,
  compact = false,
}: {
  status: CanvasSaveStatus
  compact?: boolean
}) {
  const label =
    status === "saving"
      ? "Saving…"
      : status === "error"
        ? "Save failed"
        : "Saved"

  if (compact) {
    return (
      <div
        className={cn(
          "flex items-center gap-1 text-xs font-medium",
          status === "error" ? "text-state-error" : "text-copy-secondary"
        )}
        aria-live="polite"
        aria-label={
          status === "saving"
            ? "Saving canvas"
            : status === "error"
              ? "Canvas save failed"
              : "Canvas saved"
        }
      >
        {status === "saving" ? (
          <Loader2 className="size-3.5 shrink-0 animate-spin" aria-hidden />
        ) : status === "error" ? (
          <AlertCircle className="size-3.5 shrink-0" aria-hidden />
        ) : (
          <Check className="size-3.5 shrink-0 text-state-success" aria-hidden />
        )}
        <span>{label}</span>
      </div>
    )
  }

  return (
    <Button
      type="button"
      variant="ghost"
      size="lg"
      className={cn(
        "h-9 gap-2 rounded-xl border border-surface-border bg-elevated px-3.5 font-medium text-copy-primary",
        "[&_svg]:text-copy-secondary [&_svg]:opacity-90",
        "hover:bg-subtle hover:text-copy-primary [&_svg]:hover:opacity-100",
        status === "error" &&
          "border-state-error/40 bg-elevated text-state-error [&_svg]:text-state-error"
      )}
      aria-live="polite"
      disabled={status === "saving"}
      aria-label={
        status === "saving"
          ? "Saving canvas"
          : status === "error"
            ? "Canvas save failed"
            : "Canvas save status"
      }
    >
      {status === "saving" ? (
        <>
          <Loader2 className="size-4 animate-spin" aria-hidden />
          Saving…
        </>
      ) : status === "error" ? (
        <>
          <AlertCircle className="size-4" aria-hidden />
          Save failed
        </>
      ) : (
        <>
          <Check className="size-4 text-state-success" aria-hidden />
          Saved
        </>
      )}
    </Button>
  )
}

function NavbarOverflowMenu({
  onTemplates,
  onShare,
}: {
  onTemplates: () => void
  onShare: () => void
}) {
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)

  const close = useCallback(() => setOpen(false), [])

  useEffect(() => {
    if (!open) return
    const onPointerDown = (ev: PointerEvent) => {
      if (rootRef.current?.contains(ev.target as Node)) return
      close()
    }
    const onKeyDown = (ev: KeyboardEvent) => {
      if (ev.key === "Escape") close()
    }
    document.addEventListener("pointerdown", onPointerDown)
    document.addEventListener("keydown", onKeyDown)
    return () => {
      document.removeEventListener("pointerdown", onPointerDown)
      document.removeEventListener("keydown", onKeyDown)
    }
  }, [open, close])

  return (
    <div ref={rootRef} className="relative md:hidden">
      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        className="text-copy-secondary"
        aria-expanded={open}
        aria-haspopup="menu"
        aria-label="Workspace menu"
        onClick={() => setOpen((v) => !v)}
      >
        <MoreVertical className="size-5" aria-hidden />
      </Button>
      {open ? (
        <div
          role="menu"
          className={cn(
            "absolute top-full right-0 z-50 mt-1 min-w-44 rounded-xl border border-surface-border",
            "bg-elevated p-1 shadow-lg"
          )}
        >
          <button
            type="button"
            role="menuitem"
            className={cn(
              "flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm",
              "text-copy-primary hover:bg-subtle"
            )}
            onClick={() => {
              onTemplates()
              close()
            }}
          >
            <LayoutTemplate className="size-4 text-copy-secondary" aria-hidden />
            Templates
          </button>
          <button
            type="button"
            role="menuitem"
            className={cn(
              "flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm",
              "text-copy-primary hover:bg-subtle"
            )}
            onClick={() => {
              onShare()
              close()
            }}
          >
            <Share2 className="size-4 text-copy-secondary" aria-hidden />
            Share
          </button>
        </div>
      ) : null}
    </div>
  )
}

export function EditorNavbar({
  sidebarOpen,
  onSidebarToggle,
  className,
}: EditorNavbarProps) {
  const {
    workspaceProject,
    openShareDialog,
    openStarterTemplatesDialog,
    canvasSaveStatus,
  } = useEditorWorkspace()

  return (
    <header
      className={cn(
        "fixed top-0 right-0 left-0 z-40 flex h-14 shrink-0 items-stretch border-b border-surface-border bg-surface",
        className
      )}
    >
      <div className="relative flex h-full w-full items-center gap-2 px-2 sm:px-3">
        <div className="relative z-10 flex shrink-0 items-center gap-2">
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            className="text-copy-secondary"
            aria-expanded={sidebarOpen}
            aria-label={
              sidebarOpen ? "Close project sidebar" : "Open project sidebar"
            }
            onClick={onSidebarToggle}
          >
            {sidebarOpen ? (
              <PanelLeftClose className="h-5 w-5" aria-hidden />
            ) : (
              <PanelLeftOpen className="h-5 w-5" aria-hidden />
            )}
          </Button>
          {workspaceProject ? (
            <div className="md:hidden">
              <CanvasSaveIndicator status={canvasSaveStatus} compact />
            </div>
          ) : null}
        </div>

        {workspaceProject ? (
          <div
            className={cn(
              "pointer-events-none absolute inset-x-0 flex justify-center px-28",
              "md:pointer-events-auto md:static md:inset-auto md:min-w-0 md:flex-1 md:px-0"
            )}
          >
            <p className="max-w-full truncate text-center text-sm text-copy-primary">
              <span className="font-medium">{workspaceProject.name}</span>
              <span className="text-copy-muted"> / </span>
              <span className="text-copy-secondary">Workspace</span>
            </p>
          </div>
        ) : (
          <div className="min-w-0 flex-1" />
        )}

        <div
          className="relative z-10 ml-auto flex shrink-0 items-center gap-2"
        >
          {workspaceProject ? (
            <>
              <NavbarOverflowMenu
                onTemplates={openStarterTemplatesDialog}
                onShare={openShareDialog}
              />
              <div className="hidden items-center gap-2 md:flex">
                <Button
                  type="button"
                  variant="ghost"
                  size="lg"
                  className={cn(
                    "h-9 gap-2 rounded-xl border border-surface-border bg-elevated px-3.5 font-medium text-copy-primary",
                    "[&_svg]:text-copy-secondary [&_svg]:opacity-90",
                    "hover:bg-subtle hover:text-copy-primary [&_svg]:hover:opacity-100"
                  )}
                  aria-label="Import starter template"
                  onClick={openStarterTemplatesDialog}
                >
                  <LayoutTemplate className="size-4" aria-hidden />
                  Templates
                </Button>
                <CanvasSaveIndicator status={canvasSaveStatus} />
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
              </div>
            </>
          ) : null}
          <UserButton />
        </div>
      </div>
    </header>
  )
}
