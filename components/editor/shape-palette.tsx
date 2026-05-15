"use client"

import {
  Circle,
  Cylinder,
  Diamond,
  Hexagon,
  Pill,
  RectangleHorizontal,
} from "lucide-react"
import { useCallback, useRef, useState, type PointerEvent as ReactPointerEvent } from "react"

import { CanvasNodeSurface } from "@/components/editor/canvas-node-surface"
import { cn } from "@/lib/utils"
import {
  buildShapeDragPayload,
  DEFAULT_NEW_NODE_COLOR,
  type CanvasShapeDragPayload,
} from "@/lib/canvas-shape-drag"
import type { NodeShape } from "@/types/canvas"

const SHAPES: { shape: NodeShape; label: string; Icon: typeof Circle }[] = [
  { shape: "rectangle", label: "Rectangle", Icon: RectangleHorizontal },
  { shape: "diamond", label: "Diamond", Icon: Diamond },
  { shape: "circle", label: "Circle", Icon: Circle },
  { shape: "pill", label: "Pill", Icon: Pill },
  { shape: "cylinder", label: "Cylinder", Icon: Cylinder },
  { shape: "hexagon", label: "Hexagon", Icon: Hexagon },
]

type DragGhostState = {
  shape: NodeShape
  width: number
  height: number
  x: number
  y: number
}

type ShapePaletteProps = {
  onPlaceShape: (
    payload: CanvasShapeDragPayload,
    clientX: number,
    clientY: number
  ) => void
}

function ShapeDragButton({
  shape,
  label,
  Icon,
  onPointerShapeDown,
}: (typeof SHAPES)[number] & {
  onPointerShapeDown: (
    e: ReactPointerEvent<HTMLButtonElement>,
    shape: NodeShape
  ) => void
}) {
  return (
    <button
      type="button"
      aria-label={`Drag ${label} onto canvas`}
      title={label}
      className={cn(
        "flex size-10 shrink-0 touch-none cursor-grab items-center justify-center rounded-xl",
        "border border-transparent bg-subtle text-copy-secondary",
        "transition-[color,background-color,border-color,box-shadow]",
        "hover:border-surface-border hover:bg-elevated hover:text-copy-primary",
        "active:cursor-grabbing"
      )}
      onPointerDown={(e) => onPointerShapeDown(e, shape)}
    >
      <Icon className="size-5" strokeWidth={1.75} aria-hidden />
    </button>
  )
}

export function ShapePalette({ onPlaceShape }: ShapePaletteProps) {
  const [ghost, setGhost] = useState<DragGhostState | null>(null)

  const dragRef = useRef<{
    pointerId: number
    payload: CanvasShapeDragPayload
    target: HTMLButtonElement
    lastClientX: number
    lastClientY: number
    cleanupWindow: () => void
  } | null>(null)

  const endDrag = useCallback(
    (e: globalThis.PointerEvent, place: boolean) => {
      const drag = dragRef.current
      if (!drag || drag.pointerId !== e.pointerId) {
        return
      }
      drag.cleanupWindow()
      dragRef.current = null
      try {
        drag.target.releasePointerCapture(e.pointerId)
      } catch {
        /* already released */
      }
      setGhost(null)
      if (!place) {
        return
      }
      const unreliable = e.clientX === 0 && e.clientY === 0
      const x = unreliable ? drag.lastClientX : e.clientX
      const y = unreliable ? drag.lastClientY : e.clientY
      onPlaceShape(drag.payload, x, y)
    },
    [onPlaceShape]
  )

  const onPointerShapeDown = useCallback(
    (e: ReactPointerEvent<HTMLButtonElement>, shape: NodeShape) => {
      if (e.button !== 0 || !e.isPrimary) {
        return
      }
      e.preventDefault()
      e.stopPropagation()
      const payload = buildShapeDragPayload(shape)
      const button = e.currentTarget
      button.setPointerCapture(e.pointerId)

      const onWindowMove = (ev: globalThis.PointerEvent) => {
        if (ev.pointerId !== e.pointerId) {
          return
        }
        if (ev.clientX !== 0 || ev.clientY !== 0) {
          const d = dragRef.current
          if (d) {
            d.lastClientX = ev.clientX
            d.lastClientY = ev.clientY
          }
          setGhost((g) =>
            g ? { ...g, x: ev.clientX, y: ev.clientY } : null
          )
        }
      }

      const onWindowUp = (ev: globalThis.PointerEvent) => {
        if (ev.pointerId !== e.pointerId) {
          return
        }
        endDrag(ev, true)
      }

      const onWindowCancel = (ev: globalThis.PointerEvent) => {
        if (ev.pointerId !== e.pointerId) {
          return
        }
        endDrag(ev, false)
      }

      const opts = { capture: true } as const
      window.addEventListener("pointermove", onWindowMove, opts)
      window.addEventListener("pointerup", onWindowUp, opts)
      window.addEventListener("pointercancel", onWindowCancel, opts)

      dragRef.current = {
        pointerId: e.pointerId,
        payload,
        target: button,
        lastClientX: e.clientX,
        lastClientY: e.clientY,
        cleanupWindow: () => {
          window.removeEventListener("pointermove", onWindowMove, opts)
          window.removeEventListener("pointerup", onWindowUp, opts)
          window.removeEventListener("pointercancel", onWindowCancel, opts)
        },
      }

      setGhost({
        shape: payload.shape,
        width: payload.width,
        height: payload.height,
        x: e.clientX,
        y: e.clientY,
      })
    },
    [endDrag]
  )

  return (
    <>
      {ghost !== null ? (
        <div
          className="pointer-events-none fixed z-[9999] opacity-90"
          style={{
            left: ghost.x,
            top: ghost.y,
            transform: "translate(-50%, -50%)",
          }}
          aria-hidden
        >
          <CanvasNodeSurface
            shape={ghost.shape}
            width={ghost.width}
            height={ghost.height}
            fill={DEFAULT_NEW_NODE_COLOR}
            selected={false}
          />
        </div>
      ) : null}
      <div
        className={cn(
          "pointer-events-auto fixed bottom-6 left-1/2 z-10 -translate-x-1/2",
          "flex items-center gap-1 rounded-full border border-surface-border",
          "bg-surface/95 px-2 py-1.5 shadow-lg backdrop-blur-sm"
        )}
        aria-label="Shape palette"
      >
        {SHAPES.map((entry) => (
          <ShapeDragButton
            key={entry.shape}
            {...entry}
            onPointerShapeDown={onPointerShapeDown}
          />
        ))}
      </div>
    </>
  )
}
