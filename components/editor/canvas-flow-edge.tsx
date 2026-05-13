"use client"

import {
  BaseEdge,
  EdgeLabelRenderer,
  getSmoothStepPath,
  useReactFlow,
  type EdgeProps,
} from "@xyflow/react"
import {
  memo,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type MouseEvent as ReactMouseEvent,
} from "react"

import { cn } from "@/lib/utils"
import { EDGE_DEFAULT_STROKE, type CanvasEdge, type CanvasNode } from "@/types/canvas"

function labelText(label: CanvasEdge["label"]): string {
  return typeof label === "string" ? label : ""
}

function CanvasFlowEdge(props: EdgeProps<CanvasEdge>) {
  const {
    id,
    label,
    sourceX,
    sourceY,
    targetX,
    targetY,
    sourcePosition,
    targetPosition,
    markerEnd,
    style,
    selected,
  } = props

  const { updateEdge } = useReactFlow<CanvasNode, CanvasEdge>()
  const [hovered, setHovered] = useState(false)
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(() => labelText(label))
  const inputRef = useRef<HTMLInputElement>(null)
  const hoverClearRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const hoverStart = useCallback(() => {
    if (hoverClearRef.current) {
      clearTimeout(hoverClearRef.current)
      hoverClearRef.current = null
    }
    setHovered(true)
  }, [])

  const hoverEnd = useCallback(() => {
    if (hoverClearRef.current) clearTimeout(hoverClearRef.current)
    hoverClearRef.current = setTimeout(() => {
      setHovered(false)
      hoverClearRef.current = null
    }, 60)
  }, [])

  const emphasize = Boolean(selected || hovered)

  useEffect(
    () => () => {
      if (hoverClearRef.current) clearTimeout(hoverClearRef.current)
    },
    []
  )

  useEffect(() => {
    if (!editing) return
    const raf = requestAnimationFrame(() => {
      const el = inputRef.current
      if (el) {
        el.focus()
        el.select()
      }
    })
    return () => cancelAnimationFrame(raf)
  }, [editing])

  const [path, labelX, labelY] = useMemo(
    () =>
      getSmoothStepPath({
        sourceX,
        sourceY,
        sourcePosition,
        targetX,
        targetY,
        targetPosition,
        borderRadius: 6,
        offset: 16,
      }),
    [
      sourceX,
      sourceY,
      sourcePosition,
      targetX,
      targetY,
      targetPosition,
    ]
  )

  const commit = useCallback(() => {
    const next = draft.trim()
    updateEdge(id, {
      label: next.length ? next : undefined,
    })
  }, [draft, id, updateEdge])

  const finishEditing = useCallback(() => {
    commit()
    setEditing(false)
  }, [commit])

  const openEdit = useCallback(
    (e: ReactMouseEvent) => {
      e.stopPropagation()
      e.preventDefault()
      setDraft(labelText(label))
      setEditing(true)
    },
    [label]
  )

  const saved = labelText(label)
  const showLabelUi = editing || saved.length > 0 || emphasize

  return (
    <>
      <g
        onMouseEnter={hoverStart}
        onMouseLeave={hoverEnd}
        onDoubleClick={openEdit}
      >
        <BaseEdge
          path={path}
          markerEnd={markerEnd}
          interactionWidth={28}
          style={{
            stroke: EDGE_DEFAULT_STROKE,
            strokeWidth: 1.5,
            strokeLinecap: "round",
            strokeLinejoin: "round",
            ...style,
            opacity: emphasize ? 0.95 : 0.38,
          }}
        />
      </g>

      {showLabelUi ? (
        <EdgeLabelRenderer>
          <div
            className={cn(
              "nodrag nopan pointer-events-auto absolute origin-center max-w-[min(20rem,calc(100vw-4rem))] text-center select-none text-xs leading-tight text-copy-muted"
            )}
            style={{
              transform: `translate(${labelX}px,${labelY}px) translate(-50%, -50%)`,
            }}
            onMouseEnter={hoverStart}
            onMouseLeave={hoverEnd}
            onPointerDownCapture={(e) => e.stopPropagation()}
            onMouseDownCapture={(e) => e.stopPropagation()}
          >
            {editing ? (
              <input
                ref={inputRef}
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                spellCheck={false}
                aria-label="Edge label"
                className={cn(
                  "min-h-7 min-w-8 max-w-[min(18rem,calc(100vw-6rem))] rounded-full border border-surface-border px-3 py-1 text-xs",
                  "field-sizing-content bg-bg-elevated/95 shadow-sm outline-none ring-2 ring-accent-primary/55",
                  "text-copy-primary placeholder:text-copy-muted/50"
                )}
                placeholder="Label…"
                onBlur={finishEditing}
                onDoubleClick={(e) => {
                  e.stopPropagation()
                }}
                onPointerDown={(e) => e.stopPropagation()}
                onMouseDown={(e) => e.stopPropagation()}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault()
                    e.stopPropagation()
                    finishEditing()
                  } else if (e.key === "Escape") {
                    e.preventDefault()
                    e.stopPropagation()
                    finishEditing()
                  }
                }}
                size={Math.max(String(draft).length || 1, 1)}
              />
            ) : (
              <button
                type="button"
                className={cn(
                  "max-w-[min(18rem,calc(100vw-6rem))] truncate rounded-full border border-surface-border/70 bg-bg-elevated/90 px-2.5 py-1 shadow-sm backdrop-blur-sm",
                  "text-copy-secondary transition-colors hover:bg-bg-elevated"
                )}
                onDoubleClick={openEdit}
                onPointerDown={(e) => e.stopPropagation()}
                onMouseDown={(e) => e.stopPropagation()}
              >
                {saved.length ? (
                  <span className="font-medium text-copy-primary">{saved}</span>
                ) : emphasize ? (
                  <span className="opacity-[0.42] italic">
                    Double-click to label…
                  </span>
                ) : null}
              </button>
            )}
          </div>
        </EdgeLabelRenderer>
      ) : null}
    </>
  )
}

export const MemoCanvasFlowEdge = memo(CanvasFlowEdge)
