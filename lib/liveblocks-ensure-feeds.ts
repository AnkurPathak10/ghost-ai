import "server-only"

import type { Liveblocks } from "@liveblocks/node"

import { AI_CHAT_FEED_ID, AI_STATUS_FEED_ID } from "@/types/tasks"

/** Best-effort: create default editor feeds once per room (idempotent — ignore duplicates). */
export async function ensureDefaultEditorFeeds(
  client: Liveblocks,
  roomId: string
): Promise<void> {
  for (const feedId of [AI_STATUS_FEED_ID, AI_CHAT_FEED_ID] as const) {
    try {
      await client.createFeed({
        roomId,
        feedId,
        metadata: { name: feedId },
      })
    } catch {
      /* already exists — first-class case */
    }
  }
}
