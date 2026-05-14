import { Liveblocks } from "@liveblocks/node"

/** Creates a Liveblocks Node client (usable from Trigger.dev tasks and Next.js). */
export function createLiveblocksClient(): Liveblocks {
  const secret = process.env.LIVEBLOCKS_SECRET_KEY
  if (typeof secret !== "string" || secret.trim() === "") {
    throw new Error("LIVEBLOCKS_SECRET_KEY is not set")
  }
  return new Liveblocks({ secret })
}
