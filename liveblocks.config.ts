import type { LiveblocksFlow } from "@liveblocks/react-flow"

import type { CanvasEdge, CanvasNode } from "@/types/canvas"

// Liveblocks app typings — https://liveblocks.io/docs/api-reference/liveblocks-react#Typing-your-data
declare global {
  interface Liveblocks {
    Presence: {
      cursor: { x: number; y: number } | null
      isThinking: boolean
    }

    Storage: {
      /** React Flow document — `@liveblocks/react-flow` default storage key */
      flow: LiveblocksFlow<CanvasNode, CanvasEdge>
    }

    UserMeta: {
      id: string
      info: {
        name: string
        avatar: string
        /** Cursor / caret color (hex), deterministic per user on the server */
        color: string
      }
    }

    RoomEvent: Record<string, never>
    ThreadMetadata: Record<string, never>
    RoomInfo: Record<string, never>
  }
}

export {}
