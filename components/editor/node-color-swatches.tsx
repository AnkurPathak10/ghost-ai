"use client"

import { useReactFlow } from "@xyflow/react"
import { memo, useCallback } from "react"

import { cn } from "@/lib/utils"
import {
  NODE_COLORS,
  type CanvasEdge,
  type CanvasNode,
} from "@/types/canvas"

function glowFromAccent(accentHex: string, alpha: number): string {
  const m = /^#?([0-9a-f]{6})$/i.exec(accentHex.trim())
  if (!m) return `rgba(255, 255, 255, ${alpha})`
  const n = parseInt(m[1], 16)
  const r = (n >> 16) & 255
  const g = (n >> 8) & 255
  const b = n & 255
  return `rgba(${r}, ${g}, ${b}, ${alpha})`
}

type NodeColorSwatchesProps = {
  nodeId: string
  activeFill: string
}

export const NodeColorSwatches = memo(function NodeColorSwatches({
  nodeId,
  activeFill,
}: NodeColorSwatchesProps) {
  const { updateNodeData } = useReactFlow<CanvasNode, CanvasEdge>()

  const pick = useCallback(
    (fill: string, label: string) => {
      updateNodeData(nodeId, { color: fill, labelColor: label })
    },
    [nodeId, updateNodeData]
  )

  return (
    <div
      className={cn(
        "nodrag nopan pointer-events-auto flex items-center gap-1 rounded-full border border-surface-border",
        "bg-surface/95 px-1.5 py-1 shadow-lg backdrop-blur-sm"
      )}
      onPointerDown={(e) => e.stopPropagation()}
    >
      {NODE_COLORS.map((spec) => {
        const isActive = spec.fill === activeFill
        const activeRing = `0 0 0 2px ${spec.label}, 0 0 0 3px var(--color-bg-base)`
        return (
          <button
            key={spec.id}
            type="button"
            title={spec.id}
            aria-label={`Use ${spec.id} theme`}
            aria-pressed={isActive}
            onPointerDown={(e) => e.stopPropagation()}
            onClick={() => pick(spec.fill, spec.label)}
            className={cn(
              "size-7 shrink-0 rounded-full border border-white/25 outline-none transition-[transform,box-shadow]",
              "hover:scale-105 focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 focus-visible:ring-offset-base",
              isActive ? "scale-105" : "hover:brightness-110"
            )}
            style={{
              backgroundColor: spec.fill,
              boxShadow: isActive
                ? activeRing
                : undefined,
            }}
            onMouseEnter={(e) => {
              if (!isActive) {
                e.currentTarget.style.boxShadow = `0 0 10px 2px ${glowFromAccent(spec.label, 0.45)}`
              }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.boxShadow = isActive ? activeRing : ""
            }}
          />
        )
      })}
    </div>
  )
})
