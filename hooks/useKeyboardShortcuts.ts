"use client"

import type { Edge, Node, ReactFlowInstance } from "@xyflow/react"
import { useEffect } from "react"

function isEditableFieldTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false
  if (target.isContentEditable) return true
  const tag = target.tagName
  if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return true
  if (target.closest("[contenteditable='true']")) return true
  return false
}

/** Duration (ms) for keyboard-triggered viewport zoom transitions. */
const KEY_ZOOM_MS = 220

type UseKeyboardShortcutsParams<
  NodeType extends Node = Node,
  EdgeType extends Edge = Edge,
> = {
  reactFlow: ReactFlowInstance<NodeType, EdgeType>
  onUndo: () => void
  onRedo: () => void
}

/**
 * Global canvas shortcuts: zoom (+/=, -), undo/redo (mod+Z, mod+Shift+Z, mod+Y).
 * Skips handling while focus is in inputs, textareas, selects, or contenteditable regions.
 */
export function useKeyboardShortcuts<
  NodeType extends Node = Node,
  EdgeType extends Edge = Edge,
>({
  reactFlow,
  onUndo,
  onRedo,
}: UseKeyboardShortcutsParams<NodeType, EdgeType>) {
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (isEditableFieldTarget(e.target)) return

      const mod = e.metaKey || e.ctrlKey

      if (!mod && (e.key === "+" || e.key === "=")) {
        e.preventDefault()
        void reactFlow.zoomIn({ duration: KEY_ZOOM_MS })
        return
      }
      if (!mod && (e.key === "-" || e.key === "−")) {
        e.preventDefault()
        void reactFlow.zoomOut({ duration: KEY_ZOOM_MS })
        return
      }

      if (mod && e.key.toLowerCase() === "z" && !e.shiftKey) {
        e.preventDefault()
        onUndo()
        return
      }
      if (mod && e.key.toLowerCase() === "z" && e.shiftKey) {
        e.preventDefault()
        onRedo()
        return
      }
      if (mod && e.key.toLowerCase() === "y") {
        e.preventDefault()
        onRedo()
        return
      }
    }

    window.addEventListener("keydown", onKeyDown)
    return () => window.removeEventListener("keydown", onKeyDown)
  }, [reactFlow, onUndo, onRedo])
}
