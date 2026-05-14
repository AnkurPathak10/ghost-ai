"use client"

import { useEffect, useLayoutEffect, useMemo, useRef } from "react"

import type { CanvasEdge, CanvasNode } from "@/types/canvas"

export type CanvasSaveStatus = "idle" | "saving" | "saved" | "error"

/**
 * Debounced autosave of the canvas to `PUT /api/projects/[projectId]/canvas`.
 * Call `onStatusChange` with saving / saved / error; `idle` after a short
 * delay following a successful save.
 */
export function useCanvasAutosave(options: {
  projectId: string
  nodes: CanvasNode[]
  edges: CanvasEdge[]
  debounceMs: number
  enabled: boolean
  onStatusChange: (status: CanvasSaveStatus) => void
}): void {
  const { projectId, nodes, edges, debounceMs, enabled, onStatusChange } =
    options

  const snapshot = useMemo(
    () => JSON.stringify({ nodes, edges }),
    [nodes, edges]
  )

  const onStatusChangeRef = useRef(onStatusChange)

  useLayoutEffect(() => {
    onStatusChangeRef.current = onStatusChange
  }, [onStatusChange])

  useEffect(() => {
    if (!enabled) {
      return
    }

    let cancelled = false
    let idleAfterSavedTimer: number | undefined

    const debounceTimer = window.setTimeout(async () => {
      onStatusChangeRef.current("saving")
      try {
        const res = await fetch(`/api/projects/${projectId}/canvas`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: snapshot,
        })
        if (!res.ok) {
          throw new Error(`save failed: ${res.status}`)
        }
        if (cancelled) {
          return
        }
        onStatusChangeRef.current("saved")
        idleAfterSavedTimer = window.setTimeout(() => {
          if (!cancelled) {
            onStatusChangeRef.current("idle")
          }
        }, 2000)
      } catch {
        if (!cancelled) {
          onStatusChangeRef.current("error")
        }
      }
    }, debounceMs)

    return () => {
      cancelled = true
      clearTimeout(debounceTimer)
      if (idleAfterSavedTimer !== undefined) {
        clearTimeout(idleAfterSavedTimer)
      }
    }
  }, [debounceMs, enabled, projectId, snapshot])
}
