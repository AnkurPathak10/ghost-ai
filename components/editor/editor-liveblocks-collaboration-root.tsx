"use client"

import { LiveblocksError, LiveMap, LiveObject } from "@liveblocks/client"
import {
  LiveblocksProvider,
  RoomProvider,
  useErrorListener,
} from "@liveblocks/react/suspense"

import {
  DESIGN_AGENT_LIVEBLOCKS_USER_ID,
  DESIGN_AGENT_USER_INFO,
} from "@/lib/design-agent/constants"
import { useCallback, useEffect, useState, type ReactNode } from "react"

/**
 * Liveblocks core injects `#liveblocks-badge` on `document.body` when the server
 * sends `meta.showBrand` (typical on free tier). CSS alone can lose to injection
 * timing; remove the node whenever it appears.
 */
function RemoveLiveblocksBrandBadge() {
  useEffect(() => {
    const remove = () => {
      document.getElementById("liveblocks-badge")?.remove()
    }
    remove()
    const observer = new MutationObserver(remove)
    observer.observe(document.body, { childList: true })
    return () => observer.disconnect()
  }, [])
  return null
}

export function EditorLiveblocksCollaborationRoot({
  roomId,
  children,
}: {
  roomId: string
  children: ReactNode
}) {
  return (
    <LiveblocksProvider
      authEndpoint="/api/liveblocks-auth"
      resolveUsers={async ({ userIds }) =>
        userIds.map((id) => {
          if (id === DESIGN_AGENT_LIVEBLOCKS_USER_ID) {
            return {
              name: DESIGN_AGENT_USER_INFO.name,
              avatar: DESIGN_AGENT_USER_INFO.avatar,
              color: DESIGN_AGENT_USER_INFO.color,
            }
          }
          return undefined
        })
      }
    >
      <RemoveLiveblocksBrandBadge />
      <RoomProvider
        id={roomId}
        initialPresence={{ cursor: null, thinking: false }}
        initialStorage={() => ({
          flow: new LiveObject({
            nodes: new LiveMap(),
            edges: new LiveMap(),
          }),
        })}
      >
        <EditorLiveblocksRoomShell>{children}</EditorLiveblocksRoomShell>
      </RoomProvider>
    </LiveblocksProvider>
  )
}

function EditorLiveblocksRoomShell({ children }: { children: ReactNode }) {
  const [connectionError, setConnectionError] = useState<string | null>(null)

  useErrorListener(
    useCallback((error) => {
      const message =
        error instanceof LiveblocksError
          ? error.message
          : "Could not connect to collaboration."
      setConnectionError(message)
    }, [])
  )

  if (connectionError !== null) {
    return (
      <div className="flex min-h-[calc(100vh-3.5rem)] w-full flex-col items-center justify-center gap-2 bg-base px-6 text-center">
        <p className="text-sm font-medium text-copy-primary">
          Liveblocks connection error
        </p>
        <p className="max-w-sm text-xs text-copy-muted">{connectionError}</p>
      </div>
    )
  }

  return children
}
