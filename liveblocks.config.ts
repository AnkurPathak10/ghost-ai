import type { LiveblocksFlow } from "@liveblocks/react-flow"

import type { AiDesignStatusEventPayload } from "@/lib/design-agent/constants"
import type { CanvasEdge, CanvasNode } from "@/types/canvas"
import type {
  AiChatFeedMessageData,
  AiStatusFeedMessageData,
} from "@/types/tasks"

// Liveblocks app typings — https://liveblocks.io/docs/api-reference/liveblocks-react#Typing-your-data
declare global {
  interface Liveblocks {
    Presence: {
      cursor: { x: number; y: number } | null
      thinking: boolean
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

    RoomEvent: AiDesignStatusEventPayload

    /**
     * `data` shape for Liveblocks room feed messages (`ai-status-feed`, `ai-chat`; see `types/tasks.ts`).
     */
    FeedMessageData: AiStatusFeedMessageData | AiChatFeedMessageData

    ThreadMetadata: Record<string, never>
    RoomInfo: Record<string, never>
  }
}

export {}
