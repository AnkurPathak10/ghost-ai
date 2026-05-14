"use client"

import { useUser } from "@clerk/nextjs"
import { useOthers } from "@liveblocks/react/suspense"
import { useMemo } from "react"

import { cn } from "@/lib/utils"

const AVATAR_CLASS = "size-8 shrink-0 rounded-full object-cover"

function initialsFromName(name: string): string {
  const parts = name
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
  if (parts.length === 0) return "?"
  return parts.map((p) => p[0]?.toUpperCase() ?? "").join("") || "?"
}

type Collaborator = {
  id: string
  name: string
  imageUrl: string | null
}

export function CanvasPresenceBar() {
  const { user, isLoaded: clerkLoaded } = useUser()
  const clerkId = user?.id ?? null
  const others = useOthers()

  const collaborators = useMemo(() => {
    const map = new Map<string, Collaborator>()
    for (const o of others) {
      if (!o.id) continue
      if (clerkId !== null && o.id === clerkId) continue
      if (map.has(o.id)) continue
      const name = o.info?.name?.trim() || "Collaborator"
      map.set(o.id, {
        id: o.id,
        name,
        imageUrl: o.info?.avatar?.trim() ? o.info.avatar : null,
      })
    }
    return [...map.values()].sort((a, b) => a.name.localeCompare(b.name))
  }, [others, clerkId])

  const visible = collaborators.slice(0, 5)
  const overflow = collaborators.length - visible.length

  if (!clerkLoaded) {
    return (
      <div
        className="pointer-events-none absolute top-3 right-3 z-20 flex h-8 w-8 items-center justify-center rounded-full bg-elevated/80"
        aria-hidden
      />
    )
  }

  if (collaborators.length === 0) {
    return null
  }

  return (
    <div className="pointer-events-none absolute top-3 right-3 z-20 flex items-center gap-2">
      <div className="flex items-center">
        {visible.map((c, i) => (
          <div
            key={c.id}
            className={cn(
              "relative rounded-full ring-2 ring-(--color-base)",
              i > 0 && "-ml-2"
            )}
            style={{ zIndex: i + 1 }}
            title={c.name}
          >
            {c.imageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={c.imageUrl}
                alt=""
                className={AVATAR_CLASS}
                draggable={false}
              />
            ) : (
              <div
                className={cn(
                  AVATAR_CLASS,
                  "flex items-center justify-center bg-elevated text-[0.6875rem] font-semibold text-copy-secondary"
                )}
              >
                {initialsFromName(c.name)}
              </div>
            )}
          </div>
        ))}
        {overflow > 0 ? (
          <div
            className={cn(
              "relative -ml-2 flex size-8 items-center justify-center rounded-full",
              "bg-elevated text-[0.6875rem] font-semibold text-copy-secondary",
              "ring-2 ring-(--color-base)"
            )}
            style={{ zIndex: visible.length + 1 }}
            title={`${overflow} more`}
          >
            +{overflow}
          </div>
        ) : null}
      </div>
    </div>
  )
}
