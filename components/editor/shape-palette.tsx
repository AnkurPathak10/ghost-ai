"use client"

import {
  Circle,
  Cylinder,
  Diamond,
  Hexagon,
  Pill,
  RectangleHorizontal,
} from "lucide-react"
import { useCallback, useState, type DragEvent } from "react"

import { CanvasNodeSurface } from "@/components/editor/canvas-node-surface"
import { cn } from "@/lib/utils"
import {
  buildShapeDragPayload,
  CANVAS_SHAPE_DRAG_MIME,
  DEFAULT_NEW_NODE_COLOR,
  serializeShapeDragPayload,
} from "@/lib/canvas-shape-drag"
import type { NodeShape } from "@/types/canvas"

/** Invisible pixel — hides default drag image so the custom ghost can follow the cursor. */
const TRANSPARENT_GIF =
  "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7"

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

function ShapeDragButton({
  shape,
  label,
  Icon,
  onPaletteDragStart,
}: (typeof SHAPES)[number] & {
  onPaletteDragStart: (
    e: DragEvent<HTMLButtonElement>,
    shape: NodeShape
  ) => void
}) {
  return (
    <button
      type="button"
      draggable
      onDragStart={(e) => onPaletteDragStart(e, shape)}
      aria-label={`Drag ${label} onto canvas`}
      title={label}
      className={cn(
        "flex size-10 shrink-0 cursor-grab items-center justify-center rounded-xl",
        "border border-transparent bg-subtle text-copy-secondary",
        "transition-[color,background-color,border-color,box-shadow]",
        "hover:border-surface-border hover:bg-elevated hover:text-copy-primary",
        "active:cursor-grabbing"
      )}
    >
      <Icon className="size-5" strokeWidth={1.75} aria-hidden />
    </button>
  )
}

export function ShapePalette() {
  const [ghost, setGhost] = useState<DragGhostState | null>(null)

  const onPaletteDragStart = useCallback(
    (e: DragEvent<HTMLButtonElement>, shape: NodeShape) => {
      const payload = buildShapeDragPayload(shape)
      e.dataTransfer.effectAllowed = "copy"
      e.dataTransfer.setData(
        CANVAS_SHAPE_DRAG_MIME,
        serializeShapeDragPayload(payload)
      )

      const img = new Image()
      img.src = TRANSPARENT_GIF
      e.dataTransfer.setDragImage(img, 0, 0)

      setGhost({
        shape: payload.shape,
        width: payload.width,
        height: payload.height,
        x: e.clientX,
        y: e.clientY,
      })

      const onDrag = (ev: globalThis.DragEvent) => {
        if (ev.clientX !== 0 || ev.clientY !== 0) {
          setGhost((g) =>
            g ? { ...g, x: ev.clientX, y: ev.clientY } : null
          )
        }
      }
      const onEnd = () => {
        document.removeEventListener("drag", onDrag)
        document.removeEventListener("dragend", onEnd, true)
        setGhost(null)
      }
      document.addEventListener("drag", onDrag)
      document.addEventListener("dragend", onEnd, true)
    },
    []
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
          "pointer-events-auto absolute bottom-6 left-1/2 z-10 -translate-x-1/2",
          "flex items-center gap-1 rounded-full border border-surface-border",
          "bg-surface/95 px-2 py-1.5 shadow-lg backdrop-blur-sm"
        )}
        aria-label="Shape palette"
      >
        {SHAPES.map((entry) => (
          <ShapeDragButton
            key={entry.shape}
            {...entry}
            onPaletteDragStart={onPaletteDragStart}
          />
        ))}
      </div>
    </>
  )
}
