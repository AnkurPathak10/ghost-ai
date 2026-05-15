"use client"

import {
  useCanRedo,
  useCanUndo,
  useRedo,
  useUndo,
} from "@liveblocks/react/suspense"
import { useReactFlow } from "@xyflow/react"
import { Minus, Plus, Redo2, Scan, Undo2 } from "lucide-react"
import { useCallback, type ReactNode } from "react"

import { useKeyboardShortcuts } from "@/hooks/useKeyboardShortcuts"
import { cn } from "@/lib/utils"
import type { CanvasEdge, CanvasNode } from "@/types/canvas"

/** Smooth viewport transitions for zoom / fit (ms). */
const VIEW_ANIM_MS = 280

type IconCtrlProps = {
  label: string
  onClick: () => void
  disabled?: boolean
  children: ReactNode
}

function IconCtrl({ label, onClick, disabled, children }: IconCtrlProps) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      disabled={disabled}
      onClick={onClick}
      className={cn(
        "flex size-9 shrink-0 items-center justify-center rounded-full",
        "text-copy-secondary transition-[color,opacity,background-color]",
        "hover:bg-elevated hover:text-copy-primary",
        "disabled:pointer-events-none disabled:opacity-35"
      )}
    >
      {children}
    </button>
  )
}

export function CanvasViewportControls() {
  const reactFlow = useReactFlow<CanvasNode, CanvasEdge>()
  const undo = useUndo()
  const redo = useRedo()
  const canUndo = useCanUndo()
  const canRedo = useCanRedo()

  const onUndo = useCallback(() => {
    undo()
  }, [undo])

  const onRedo = useCallback(() => {
    redo()
  }, [redo])

  useKeyboardShortcuts({
    reactFlow,
    onUndo,
    onRedo,
  })

  const zoomOut = useCallback(() => {
    void reactFlow.zoomOut({ duration: VIEW_ANIM_MS })
  }, [reactFlow])

  const zoomIn = useCallback(() => {
    void reactFlow.zoomIn({ duration: VIEW_ANIM_MS })
  }, [reactFlow])

  const fitView = useCallback(() => {
    void reactFlow.fitView({ padding: 0.2, duration: VIEW_ANIM_MS })
  }, [reactFlow])

  return (
    <div
      className={cn(
        "pointer-events-auto fixed z-20",
        "bottom-6 left-4 flex flex-col items-center gap-0.5 rounded-2xl border border-surface-border",
        "bg-surface/95 px-1.5 py-1.5 shadow-lg backdrop-blur-sm",
        "sm:left-6"
      )}
      role="toolbar"
      aria-label="Canvas view"
    >
      <div className="flex flex-col items-center gap-0">
        <IconCtrl label="Zoom out" onClick={zoomOut}>
          <Minus className="size-4" strokeWidth={2} aria-hidden />
        </IconCtrl>
        <IconCtrl label="Fit view" onClick={fitView}>
          <Scan className="size-4" strokeWidth={2} aria-hidden />
        </IconCtrl>
        <IconCtrl label="Zoom in" onClick={zoomIn}>
          <Plus className="size-4" strokeWidth={2} aria-hidden />
        </IconCtrl>
      </div>

      <div
        className="my-0.5 h-px w-6 shrink-0 bg-surface-border/70"
        aria-hidden
      />

      <div className="flex flex-col items-center gap-0">
        <IconCtrl label="Undo" onClick={onUndo} disabled={!canUndo}>
          <Undo2 className="size-4" strokeWidth={2} aria-hidden />
        </IconCtrl>
        <IconCtrl label="Redo" onClick={onRedo} disabled={!canRedo}>
          <Redo2 className="size-4" strokeWidth={2} aria-hidden />
        </IconCtrl>
      </div>
    </div>
  )
}
