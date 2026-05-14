"use client"

import { useOthersMapped } from "@liveblocks/react/suspense"
import { useStore } from "@xyflow/react"
import { Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"

type PeerCursorPayload = {
  cursor: { x: number; y: number } | null
  name?: string | null
  color?: string | null
  thinking?: boolean
}

function PeerCursorItem({
  cursor,
  name,
  color,
  thinking,
  transform,
}: Omit<PeerCursorPayload, "cursor"> & {
  cursor: { x: number; y: number }
  transform: [number, number, number]
}) {
  const [panX, panY, zoom] = transform
  const x = cursor.x * zoom + panX
  const y = cursor.y * zoom + panY
  const fill =
    typeof color === "string" && color.length > 0 ? color : "var(--color-border-default)"
  const label = name?.trim() || "Collaborator"

  return (
    <div
      className="pointer-events-none absolute left-0 top-0"
      style={{ transform: `translate(${x}px, ${y}px)` }}
    >
      <div className="relative -translate-x-0.5 -translate-y-0.5">
        <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden className="drop-shadow-sm">
          <path
            d="M0.5 0.5 L0.5 12.5 L9.5 7.5 Z"
            fill={fill}
            stroke="rgba(0,0,0,0.35)"
            strokeWidth="0.9"
            strokeLinejoin="round"
          />
        </svg>
        <div
          className={cn(
            "absolute left-3 top-3 flex max-w-36 items-center gap-1 rounded-md border px-1 py-0.5",
            "text-[0.6875rem] font-medium leading-tight shadow-sm",
            "bg-(--color-surface)/95 text-copy-primary backdrop-blur-sm"
          )}
          style={{ borderColor: fill }}
        >
          {thinking ? (
            <Loader2
              className="size-3 shrink-0 animate-spin text-copy-secondary"
              aria-hidden
            />
          ) : null}
          <span className="min-w-0 flex-1 truncate">{label}</span>
        </div>
      </div>
    </div>
  )
}

export function CanvasPeerCursors() {
  const transform = useStore((s) => s.transform)
  const rows = useOthersMapped((other) => ({
    cursor: other.presence.cursor,
    name: other.info?.name,
    color: other.info?.color,
    thinking: other.presence.thinking,
  }))

  return (
    <div className="pointer-events-none absolute inset-0 z-5 overflow-hidden" aria-hidden>
      {rows.map(([connectionId, row]) =>
        row.cursor ? (
          <PeerCursorItem
            key={connectionId}
            cursor={row.cursor}
            name={row.name}
            color={row.color}
            thinking={row.thinking}
            transform={transform}
          />
        ) : null
      )}
    </div>
  )
}
