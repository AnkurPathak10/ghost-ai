import "server-only"

import { createLiveblocksClient } from "@/lib/liveblocks-node-client"

const globalForLiveblocks = globalThis as unknown as {
  liveblocks?: ReturnType<typeof createLiveblocksClient>
}

/** Distinct, readable cursor colors for multiplayer overlays */
const CURSOR_COLOR_PALETTE = [
  "#22d3ee",
  "#a78bfa",
  "#34d399",
  "#fbbf24",
  "#fb7185",
  "#38bdf8",
  "#c084fc",
  "#4ade80",
  "#f472b6",
  "#2dd4bf",
  "#818cf8",
  "#facc15",
] as const

export function getLiveblocks(): ReturnType<typeof createLiveblocksClient> {
  if (!globalForLiveblocks.liveblocks) {
    globalForLiveblocks.liveblocks = createLiveblocksClient()
  }
  return globalForLiveblocks.liveblocks
}

/** Stable hex color from `userId` for cursors and presence UI */
export function cursorColorForUserId(userId: string): string {
  let h = 0
  for (let i = 0; i < userId.length; i++) {
    h = (Math.imul(31, h) + userId.charCodeAt(i)) >>> 0
  }
  return CURSOR_COLOR_PALETTE[h % CURSOR_COLOR_PALETTE.length]
}
