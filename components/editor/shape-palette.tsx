"use client"

import {
  Circle,
  Cylinder,
  Diamond,
  Hexagon,
  Pill,
  RectangleHorizontal,
} from "lucide-react"
import type { DragEvent } from "react"

import { cn } from "@/lib/utils"
import {
  buildShapeDragPayload,
  CANVAS_SHAPE_DRAG_MIME,
  serializeShapeDragPayload,
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

function ShapeDragButton({ shape, label, Icon }: (typeof SHAPES)[number]) {
  function onDragStart(e: DragEvent<HTMLButtonElement>) {
    const payload = buildShapeDragPayload(shape)
    e.dataTransfer.effectAllowed = "copy"
    e.dataTransfer.setData(
      CANVAS_SHAPE_DRAG_MIME,
      serializeShapeDragPayload(payload)
    )
  }

  return (
    <button
      type="button"
      draggable
      onDragStart={onDragStart}
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
  return (
    <div
      className={cn(
        "pointer-events-auto absolute bottom-6 left-1/2 z-10 -translate-x-1/2",
        "flex items-center gap-1 rounded-full border border-surface-border",
        "bg-surface/95 px-2 py-1.5 shadow-lg backdrop-blur-sm"
      )}
      aria-label="Shape palette"
    >
      {SHAPES.map((entry) => (
        <ShapeDragButton key={entry.shape} {...entry} />
      ))}
    </div>
  )
}
