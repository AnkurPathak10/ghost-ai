/**
 * Liveblocks ↔ React Flow sync for canvas storage.
 *
 * Default `@liveblocks/react-flow` node config omits `data`; without an explicit
 * `data` sync mode, labels/colors/shapes may not round-trip and the client can
 * receive nodes with missing `data` (blank canvas / render failures).
 *
 * Keep this aligned with every `mutateFlow(...)` call in Trigger tasks.
 */
export const liveblocksCanvasNodeSync = {
  "*": { data: true as const },
} as const

export const liveblocksCanvasEdgeSync = {
  "*": {},
} as const
