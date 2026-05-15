# Progress Tracker

Update this file whenever the current phase, active feature, or implementation state changes.

## Current Phase

- Feature 29 (Spec UI integration — AI sidebar Specs tab) — complete

## Current Goal

- Next numbered feature spec after 29 (TBD)

## Infrastructure — Trigger.dev

- [x] `@trigger.dev/sdk@^4.4.6` dev dependency
- [x] Root `trigger.config.ts` — `project` from `TRIGGER_PROJECT_REF`, `runtime: "node"`, `dirs: ["trigger"]`, `maxDuration: 300`
- [x] `trigger/example-ping.ts` — minimal placeholder task (`example-ping`)
- [x] Scripts: `npm run trigger:dev`, `npm run trigger:deploy`
- [x] `.gitignore` — `.trigger`

**Local setup:** In `.env.local`, set `TRIGGER_PROJECT_REF` (e.g. `proj_kqixnczjzspllkwxvkeo`) and the dev **secret key** as `TRIGGER_SECRET_KEY` from the [Trigger.dev dashboard](https://cloud.trigger.dev). Run `npx trigger.dev@latest login` once if the CLI prompts for auth, then `npm run trigger:dev` alongside Next.js.

**Trigger.dev:** For `generate-spec`, set `BLOB_READ_WRITE_TOKEN` (and `DIRECT_DATABASE_URL` when Next.js uses Accelerate, same as `TaskRun`) on the Trigger environment so completed runs persist `ProjectSpec` + private blob uploads.

## Feature 03 — Auth (`context/feature-specs/03-auth.md`)

Completed tasks:

- [x] `ClerkProvider` in `app/layout.tsx` via `components/providers/clerk-root-provider.tsx` — `@clerk/ui` `dark` theme spread + `variables` overrides using `:root` / design tokens only (`var(--primary)`, `var(--background)`, etc.)
- [x] `proxy.ts` at project root — `clerkMiddleware` + `createRouteMatcher` for `/`, sign-in path, and sign-up path derived from `NEXT_PUBLIC_CLERK_SIGN_IN_URL` / `NEXT_PUBLIC_CLERK_SIGN_UP_URL` via `lib/auth-paths.ts`; all other routes `auth.protect()` by default
- [x] `/sign-in/[[...sign-in]]` and `/sign-up/[[...sign-up]]` — `SignIn` / `SignUp` + `AuthPageShell` (two-panel on `lg+`, form-only on small screens; minimal copy, no gradients/heroes/cards)
- [x] `app/page.tsx` — `auth()`: signed-in → `/editor`, signed-out → configurable sign-in path
- [x] `components/editor/editor-navbar.tsx` — Clerk `UserButton` (defaults; no custom internals teardown)
- [x] `@clerk/ui` dependency; `npm run build` and `npm run lint` pass

## Feature 02 — Editor Chrome (`context/feature-specs/02-editor.md`)

Completed tasks:

- [x] `components/editor/editor-navbar.tsx` — fixed `h-14` top bar, left / center / right layout, sidebar toggle with `PanelLeftOpen` / `PanelLeftClose` by state, right: Clerk `UserButton` (Feature 03), dark surface + subtle bottom border
- [x] `components/editor/project-sidebar.tsx` — floating overlay (`fixed`), does not reflow canvas, slides from left with transform + opacity transition, `isOpen` + `onClose`, header “Projects” + close button, shadcn `Tabs` for “My Projects” / “Shared” with empty placeholders, full-width secondary “New Project” + `Plus`
- [x] Dialog pattern — use `components/ui/dialog.tsx` with `DialogHeader` / `DialogTitle` / `DialogDescription` / `DialogFooter`; wired in Feature 04 (`components/editor/project-dialogs.tsx`).

Integration / verification:

- [x] `components/editor/editor-layout.tsx` + `app/editor/layout.tsx` — client `EditorLayout` composes `EditorNavbar` + `ProjectSidebar`; `page.tsx` renders route content only (`npm run lint`, `npm run build`, TypeScript clean)

## Completed

- Feature 01: Design System — shadcn for Tailwind v4 (CLI preset base-nova, `@base-ui/react` primitives). `components/ui/` includes Button, Card, Dialog, Input, Tabs, Textarea, ScrollArea. `lucide-react` installed. `lib/utils.ts` exposes `cn()`. `app/globals.css`: dark-only tokens from `context/ui-context.md` wired into shadcn semantic CSS variables; `html` uses `class="dark"`. Build and lint pass.

## In Progress

- None.

## Recent fixes (editor)

- **Liveblocks flow sync:** `lib/canvas-liveblocks-flow-sync.ts` — `useLiveblocksFlow` + Trigger `mutateFlow` now use `sync: { "*": { data: true } }` for nodes so `data` (labels, colors, shapes) round-trips; previously default LB config could drop `data`, yielding empty/broken nodes (AI Trigger “applied” but blank canvas).
- **Shape palette / Liveblocks race:** `CanvasShapePaletteBridge` stays inside `<ReactFlow>` for valid `screenToFlowPosition` / `domNode` (XYFlow). `@liveblocks/react-flow`'s `onNodesChange` is a no-op until `storage.get("flow")` exists while `setInitialStorage` runs in `useEffect`, so palette drops could run too early; `CollaborativeFlowCanvasInner` now runs `useLayoutEffect` + `useMutation` to seed `flow` (empty `LiveMap`s) before paint when missing. Palette drag uses `capture: true` window pointer listeners and falls back to last client coords when `pointerup` reports `(0,0)`. Palette placement retries until Liveblocks `storage.flow` exists and XYFlow `domNode` is set, hit-tests the `.react-flow__pane`, and defers work past a microtask so storage seeding can apply (fixes dev-only silent drops).
- **Canvas node:** safe defaults when `props.data` is missing.
- **Hydration:** REST seed defers ~320ms so Liveblocks storage can arrive before treating the canvas as empty.

## Next Up

- Next numbered feature spec after 29 (TBD).

## Feature 29 — Spec UI integration (`context/feature-specs/29-spec-ui-integration.md`)

Completed tasks:

- [x] `GET /api/projects/[projectId]/specs` — Clerk + `getProjectAccessibleToEditor`; lists `ProjectSpec` metadata (`id`, ISO `createdAt`, `filename`) for the project (no blob URLs); supports the Specs tab refresh after generation
- [x] `components/editor/ai-workspace-specs-panel.tsx` — compact scrollable list; preview `Dialog` + `ScrollArea`; Markdown via `react-markdown`; download links to existing download route; Generate Spec wires `POST /api/ai/spec` + token + `useRealtimeRun` completion → list refresh; preview content only held while the modal is open
- [x] `components/editor/editor-workspace-viewport.tsx` — single `ReactFlowProvider` wraps canvas + AI rail so `useLiveblocksFlow` can read live nodes/edges for spec generation
- [x] `components/editor/collaborative-canvas.tsx` — inner `ReactFlowProvider` removed (provider lifted to viewport)
- [x] `components/editor/ai-workspace-sidebar.tsx` — Specs tab renders `AiWorkspaceSpecsPanel` with room chat history passed for spec context
- [x] `npm run build` and `npm run lint` pass

## Feature 28 — Spec persistence & download (`context/feature-specs/28-spec-persistence-download.md`)

Completed tasks:

- [x] Prisma `ProjectSpec` — `id`, `projectId` → `Project`, `filePath` (blob URL), `createdAt`; `Project.projectSpecs` relation; migration `20260515064407_add_project_spec`
- [x] `trigger/generate-spec.ts` — private `put` at `specs/{projectId}/{specId}.md`; `getUnacceleratedPrisma().projectSpec.create` with blob URL; successful runs return `{ ok: true, markdown, specId }` and set metadata `specId`; clear errors when `BLOB_READ_WRITE_TOKEN` or direct DB client is missing
- [x] `GET /api/projects/[projectId]/specs/[specId]/download` — Clerk + `getProjectAccessibleToEditor`; `findFirst` ensures spec belongs to project; streams blob body as `text/markdown` attachment (`spec-{id}.md`); no public blob URL in JSON
- [x] `npm run build` and `npm run lint` pass

## Feature 27 — Spec generation flow (`context/feature-specs/27-spec-generation-flow.md`)

Completed tasks:

- [x] `POST /api/ai/spec` — Zod body (`roomId`, `chatHistory`, `nodes`, `edges`); Clerk + `getProjectAccessibleToEditor(roomId)` (no client `projectId`); `tasks.trigger` for `generate-spec` with server-resolved `projectId`; Prisma `TaskRun`; returns `{ runId }`; `503` without `TRIGGER_SECRET_KEY`
- [x] `POST /api/ai/spec/token` — JSON `{ runId }`; `TaskRun` ownership; `auth.createPublicToken` scoped to run + `generate-spec`; `expirationTime: "1h"`; returns `{ token }`
- [x] `trigger/generate-spec.ts` — Zod payload, Gemini via `@ai-sdk/google` + `generateText`, Markdown output (`ok` + `markdown` or `error`; Feature 28 adds Blob persistence, `specId`, and download API); `metadata` for phase/status; `lib/spec-generation/spec-generation-schemas.ts` + `GENERATE_SPEC_TASK_ID` in `lib/trigger-task-ids.ts`
- [x] `npm run build` passes

## Feature 26 — Design agent frontend (`context/feature-specs/26-design-agent-frontend.md`)

Completed tasks:

- [x] `types/design-agent-task.ts` — client-safe payload/output types aligned with `trigger/design-agent.ts` (for completion messaging without importing the task file client-side).
- [x] `components/editor/ai-workspace-sidebar.tsx` — Submit / starters append the user prompt to Liveblocks `ai-chat`, call `POST /api/ai/design`, mint `POST /api/ai/design/token`, subscribe with `useRealtimeRun(runId, { accessToken })`; input disabled + send spinner while a tracked run is executing or the room shows active AI generation; compact `ai-status-feed` strip above the composer only during a locally tracked run; assistant / error fallbacks post into `ai-chat`; user / AI bubble + send + starter chip styling uses the canvas green pair from `NODE_COLORS` / `ui-context` (no stray palette).
- [x] `app/api/ai/design/route.ts` + `token/route.ts` — TaskRun persistence uses `getUnacceleratedPrisma()`; with Accelerate, set `DIRECT_DATABASE_URL` to a direct `postgresql://` URL. `lib/prisma.ts` recreates the cached client when `DATABASE_URL` changes so dev HMR does not leave a stale client without `taskRun`.
- [x] `npm run build` passes

## Feature 25 — Sidebar chat feed (`context/feature-specs/25-sidebar-chat-feed.md`)

Completed tasks:

- [x] `types/tasks.ts` — `AI_CHAT_FEED_ID` (`ai-chat`); Zod `aiChatFeedMessageDataSchema` / `parseAiChatFeedMessageData` (sender, role, content, timestamp)
- [x] `liveblocks.config.ts` — `FeedMessageData` as union of status + chat payload types
- [x] `components/editor/ai-workspace-sidebar.tsx` — ensure `ai-chat` feed; `useFeedMessages` + `useCreateFeedMessage`; render validated messages with sender + time + content; send path validates feed payloads; shared AI progress via `ai-status-feed`; starter chips kick off design jobs (Feature 26: same flow appends prompts to chat + realtime run tracking).
- [x] `npm run build` passes

## Feature 24 — AI presence state (`context/feature-specs/24-ai-presence-state.md`)

Completed tasks:

- [x] `types/tasks.ts` — feed id constant `AI_STATUS_FEED_ID`; Zod `aiStatusFeedMessageDataSchema` (optional `text`, legacy `message`); helpers `parseAiStatusFeedMessageData`, `isAiGenerationActive`
- [x] `liveblocks.config.ts` — global `FeedMessageData` aligns with validated feed payloads
- [x] `lib/design-agent/liveblocks-agent-presence.ts` — ensure feed exists; `broadcastAiDesignStatus` appends validated `createFeedMessage` (`ai-status-feed`) after broadcast
- [x] `editor-liveblocks-collaboration-root.tsx` + `editor-workspace-viewport.tsx` — single `LiveblocksProvider` / `RoomProvider` wraps canvas column and AI sidebar for shared feed subscriptions
- [x] `collaborative-canvas.tsx` — room shell moved out; inner flow uses `useRoom().id` as project id
- [x] `ai-workspace-sidebar.tsx` — `useFeedMessages` / `useCreateFeed` on `ai-status-feed`; header status chip; latest validated status only; chat + starters disabled for whole room while generation active; send shows spinner; `thinking` presence cleared when terminal feed matches pending `runId`
- [x] `canvas-peer-cursors.tsx` — spinner beside name in badge when `presence.thinking`
- [x] `editor-workspace-provider.tsx` — removed duplicate `aiDesignFeed` workspace state
- [x] `npm run build` passes

## Feature 23 — Design agent logic (`context/feature-specs/23-design-agent-logic.md`)

Completed tasks:

- [x] `trigger/design-agent.ts` — planning via Gemini tool-loop (`generateText` + canvas tools in `gemini-plan.ts`); `Liveblocks.getStorageDocument` + `snapshotFromLiveblocksJson`; `mutateFlow` applies sorted actions; `broadcastEvent` + ephemeral `setPresence`; clears presence on completion/error
- [x] `lib/design-agent/*` — per-action Zod tool schemas + `applyDesignAgentAction`, `finishDesignPlan` tool for summary; presence/broadcast helpers; storage snapshot parser
- [x] `lib/liveblocks-node-client.ts` — shared `createLiveblocksClient()` for Next + Trigger (`lib/liveblocks-server.ts` uses it)
- [x] `liveblocks.config.ts` — `RoomEvent` typed as `AiDesignStatusEventPayload` (+ `FeedMessageData` in Feature 24)
- [x] `components/editor/collaborative-canvas.tsx` — canvas + flow hydration/autosave; room providers moved to Feature 24 `editor-liveblocks-collaboration-root.tsx`
- [x] `components/editor/editor-workspace-provider.tsx` — `aiArchitectMessages`; workspace reset on bind/clear (removed client-only design feed duplicate in Feature 24)
- [x] `components/editor/ai-workspace-sidebar.tsx` — `/api/ai/design` trigger path; sidebar subscribes to Liveblocks feed in Feature 24
- [x] `components/editor/canvas-peer-cursors.tsx` — live cursors + `presence.thinking` UX (badge spinner in Feature 24)- [x] `npm run build` passes

**Trigger.dev cloud:** set `GEMINI_API_KEY` and `LIVEBLOCKS_SECRET_KEY` (same values as local) on the Trigger environment so deployed tasks can call Gemini and Liveblocks.

## Feature 22 — Design agent API (`context/feature-specs/22-design-agent-api.md`)

Completed tasks:

- [x] `POST /api/ai/design` — JSON `{ prompt, roomId, projectId }`; Clerk identity + `getProjectAccessibleToEditor`; `tasks.trigger` for `design-agent`; Prisma `TaskRun`; returns `{ runId }`; `503` without `TRIGGER_SECRET_KEY`
- [x] Prisma `TaskRun` — `runId` (PK), `projectId` → `Project`, `userId`, `createdAt`; `@@index([userId, projectId])`; migration `20260514183212_add_task_run`
- [x] `POST /api/ai/design/token` — JSON `{ runId }`; ownership via `TaskRun` + current user; `auth.createPublicToken` scoped to run + task id; returns `{ token }`
- [x] `trigger/design-agent.ts` — task id `design-agent`; payload `{ prompt, roomId }`; logs via `logger.info`; no AI/canvas
- [x] `lib/trigger-task-ids.ts` — shared task id constant for routes + trigger file (relative import from trigger)
- [x] `proxy.ts` — `/api/ai(.*)` on public API matcher (handlers return JSON `401` like projects)
- [x] `npm run build` passes

## Feature 21 — Canvas autosave (`context/feature-specs/21-canvas-autosave.md`)

Completed tasks:

- [x] Prisma `Project.canvasJsonPath` — reused for Vercel Blob URL metadata (no schema migration)
- [x] `npm install @vercel/blob`
- [x] `PUT /api/projects/[projectId]/canvas` — JSON `{ nodes, edges }` → `put()` at `canvas/{projectId}.json`, update `canvasJsonPath`; owner/collaborator via `getProjectAccessibleToEditor`; requires `BLOB_READ_WRITE_TOKEN`
- [x] `GET /api/projects/[projectId]/canvas` — same access; empty blob field returns `{ nodes: [], edges: [] }`; fetches stored JSON from blob URL
- [x] `hooks/use-canvas-autosave.ts` — debounced (2s) save, status callbacks (`idle` \| `saving` \| `saved` \| `error`)
- [x] `components/editor/collaborative-canvas.tsx` — hydration once per project session (`hydrationDoneRef`); loads from GET only when Liveblocks room starts empty and snapshot exists; skips if room already has nodes/edges; `persistReady` gates autosave until hydration finishes
- [x] `components/editor/editor-workspace-provider.tsx` — `canvasSaveStatus` / `setCanvasSaveStatus`, reset with `clearWorkspaceChrome`
- [x] `components/editor/editor-navbar.tsx` — Save control showing Saving… / Saved / Save failed / idle (muted “Saved”)
- [x] `npm run build` passes

## Feature 20 — AI sidebar shell (`context/feature-specs/20-ai-sidebar-shell.md`)

Completed tasks:

- [x] `components/editor/ai-workspace-sidebar.tsx` — dedicated sidebar UI: header (`AI Workspace` / subtitle, bot icon, close); shadcn `Tabs` (`AI Architect` / `Specs`); Architect tab with `ScrollArea`, empty state, starter chips (`bg-subtle` / `text-accent-text`), local-only chat bubbles (user / assistant styles), auto-height `Textarea` (72–160px), Enter vs Shift+Enter, `bg-accent text-white` send; Specs tab with `Generate Spec` + static demo card (`bg-elevated`) and disabled download
- [x] `components/editor/editor-workspace-viewport.tsx` — composes sidebar; preserves width/opacity slide-in; parent-controlled `aiSidebarOpen` / `setAiSidebarOpen`; outer surface `bg-base/95`, `border-surface-border`, `shadow-lg`, `backdrop-blur-sm`
- [x] `app/globals.css` — `@theme` aliases `primary-text`, `muted-text`, `accent-text`, `brand-dim` for spec token class names
- [x] `npm run build` passes

## Feature 19 — Presence avatars + cursors (`context/feature-specs/19-presence-avatars-cursor.md`)

Completed tasks:

- [x] `liveblocks.config.ts` — `Presence`: `cursor`, `thinking` (rename from `isThinking`); `RoomProvider` `initialPresence` aligned
- [x] `components/editor/canvas-presence-bar.tsx` — top-right overlay on canvas only: overlapping collaborator stack (photo or initials, ring), +N overflow, divider only when collaborators exist, Clerk `UserButton` at `size-8`; excludes current user via Clerk `useUser` + Liveblocks `useOthers`
- [x] `components/editor/canvas-peer-cursors.tsx` — other users’ cursors in flow space with pointer + name badge; colors from `other.info.color`; `useOthersMapped` + `useStore` transform
- [x] `components/editor/collaborative-canvas.tsx` — `useUpdateMyPresence` + React Flow `onMouseMove` / `onMouseLeave`; optional `blur` clears cursor; removed default `Cursors` from `@liveblocks/react-flow` (custom layer + mouse handlers per spec); navbar unchanged
- [x] `npm run build` passes

## Feature 18 — Starter template (`context/feature-specs/18-starter-template.md`)

Completed tasks:

- [x] `components/editor/starter-templates.ts` — `CanvasTemplate`, `CANVAS_TEMPLATES` (microservices, CI/CD pipeline, event-driven), `tplNode` / `tplEdge` helpers, `NODE_COLORS`-backed fills + paired label colors, typed `CanvasNode` / `canvasEdge` edges with handle ids
- [x] `components/editor/starter-templates-modal.tsx` — dialog + grid; outlined Import; `TemplateDiagramPreview` uses `viewBox` SVG + `foreignObject` thumbnails
- [x] `components/editor/canvas-flow-node.tsx` — node shell respects `width`/`height` from data (removed `min-h-16` / `min-w-[128px]` that inflated the DOM box vs smaller template nodes, which misaligned labels, handles, and edges)
- [x] `components/editor/canvas-template-import-context.tsx` — register runner from room canvas; `StarterTemplatesModal` calls `importTemplate` + closes dialog
- [x] `components/editor/collaborative-canvas.tsx` — `setImportHandler`: remove all edges then nodes, add template nodes then edges (`structuredClone`), `fitView` with duration after import; wired inside Liveblocks flow
- [x] `components/editor/editor-workspace-provider.tsx` + `editor-layout.tsx` — `starterTemplatesDialogOpen` / `openStarterTemplatesDialog`; `CanvasTemplateImportProvider` wraps layout; `StarterTemplatesModal` mounted with `ShareDialog`
- [x] `components/editor/editor-navbar.tsx` — “Templates” (`LayoutTemplate`) opens modal when workspace is bound
- [x] `npm run build` passes

## Feature 17 — Canvas ergonomics (`context/feature-specs/17-canvas-ergonomics.md`)

Completed tasks:

- [x] Floating pill control bar — `components/editor/canvas-viewport-controls.tsx` (`CanvasViewportControls`): bottom-left (`z-20`), zoom group (out / fit / in) + thin divider + undo/redo; styling aligned with shape palette; above overlapping z-order vs `ShapePalette`
- [x] Zoom — `useReactFlow` `zoomIn` / `zoomOut` / `fitView` with `duration` (~280ms) for smooth viewport transitions
- [x] History — `useUndo` / `useRedo` / `useCanUndo` / `useCanRedo` from `@liveblocks/react/suspense`; buttons `disabled` when stack empty + `opacity-35` on disabled
- [x] `hooks/useKeyboardShortcuts.ts` — window `keydown`; `+`/`=` zoom in, `-` zoom out (with animation duration); `Cmd/Ctrl+Z` undo, `Cmd/Ctrl+Shift+Z` and `Cmd/Ctrl+Y` redo; skips shortcuts when target is input / textarea / select / contenteditable
- [x] MiniMap removed from `components/editor/collaborative-canvas.tsx`
- [x] `npm run build` passes

## Feature 16 — Edge behavior (`context/feature-specs/16-edge-behavior.md`)

Completed tasks:

- [x] Connection handles — all four sides (`Position` top/right/bottom/left) with overlapping target + source pairs and tiny offsets so both are usable; subtle white dots + dark border (`!border-neutral-950/90`), `nodrag`/`nopan`, hidden until `group-hover`; `components/editor/canvas-flow-node.tsx`
- [x] Default edge styling — light rounded stroke, arrow end marker, smooth-step connection line while dragging; `defaultEdgeOptions` + `connectionLineType` / `connectionLineStyle`; `components/editor/collaborative-canvas.tsx`
- [x] Custom edge — `getSmoothStepPath` right-angle routing + `BaseEdge`, dim at rest / brighter on hover + selection, wide `interactionWidth`; `components/editor/canvas-flow-edge.tsx` (`MemoCanvasFlowEdge`)
- [x] Inline labels — double-click edge to edit; label at `getSmoothStepPath` midpoint via `EdgeLabelRenderer` + returned `labelX`/`labelY`; growing pill input (`field-sizing-content`, `size`), blur/Enter/Escape commit via `updateEdge`; badge + faint hint when selected/hovered with no label; pointer capture + `nopan`/`nodrag` on label UI; labels stored on edge `label` field (Liveblocks-synced)
- [x] `npm run build` passes

## Feature 15 — Node color toolbar (`context/feature-specs/15-nodes-color-toolbar.md`)

Completed tasks:

- [x] Palette — continued `NODE_COLORS` pairs in `types/canvas.ts`; added optional `CanvasNodeData.labelColor`, `DEFAULT_NODE_LABEL`, and `resolveNodeColorPair()` for fill + paired label text
- [x] Floating toolbar — `@xyflow/react` `NodeToolbar` (`Position.Top`, offset 14) + `components/editor/node-color-swatches.tsx`: one swatch per theme, active double ring (accent + base offset), tight hover glow from swatch text color; `nodrag` / `nopan` + `stopPropagation` on pointer events
- [x] `updateNodeData` sets `color` + `labelColor`; node label / placeholder / textarea use `resolveNodeColorPair` for text color; new drops get `labelColor: DEFAULT_NODE_LABEL` in `collaborative-canvas.tsx`
- [x] No drag/drop, selection, or picker changes beyond scope
- [x] `npm run build` passes

## Feature 14 — Node editing (`context/feature-specs/14-node-editing.md`)

Completed tasks:

- [x] Resize — `@xyflow/react` `NodeResizer` in `components/editor/canvas-flow-node.tsx` when `selected`; `minWidth` / `minHeight` (96×48); subtle handles (elevated fill, `surface-border`) and dim resize lines; dimensions flow through existing `onNodesChange` / Liveblocks `dimensions` updates
- [x] Inline label — double-click label area opens a centered `textarea` over the same region (`inset-3`), `nodrag` + `nopan` and `stopPropagation` on pointer/mouse down; live `updateNodeData` / `patchLabel` while typing; empty state shows muted `Add label…`; blur + `Escape` closes editing; draft syncs from `data.label` when not editing (remote updates)
- [x] Shape panel, drag preview, drop/create, and `CanvasNodeSurface` unchanged per scope
- [x] `npm run build` passes

## Feature 13 — Node shape (`context/feature-specs/13-node-shape.md`)

Completed tasks:

- [x] Real shape rendering for `canvasNode` — `components/editor/canvas-node-surface.tsx` (`CanvasNodeSurface`): CSS for `rectangle`, `pill`, `circle`; SVG (scaled via `viewBox` + `preserveAspectRatio="none"`) for `diamond`, `hexagon`, `cylinder`; borders use `var(--color-border-default)` at rest and `var(--color-accent-primary)` when `selected`
- [x] Flow node composition — `components/editor/canvas-flow-node.tsx` (`MemoCanvasFlowNode`): surface + centered label + four-side handles; wired in `components/editor/collaborative-canvas.tsx` as `nodeTypes.canvasNode`
- [x] Shape drag ghost — `components/editor/shape-palette.tsx`: transparent `setDragImage`, document `drag` listener to follow cursor, `dragend` clears ghost; ghost reuses `CanvasNodeSurface` with same default size/fill as drop (`DEFAULT_NEW_NODE_COLOR` / `buildShapeDragPayload`); palette layout and drop/create flow unchanged
- [x] `npm run build` passes

## Feature 12 — Shape panel (`context/feature-specs/12-shape-panel.md`)

Completed tasks:

- [x] Bottom-center floating pill toolbar — `components/editor/shape-palette.tsx` (`ShapePalette`) + overlay in `components/editor/collaborative-canvas.tsx`
- [x] Draggable shape icons (rectangle, diamond, circle, pill, cylinder, hexagon) with HTML5 drag payload (shape + default width/height) — `lib/canvas-shape-drag.ts` MIME `application/x-ghost-canvas-shape`
- [x] `onDragOver` / `onDrop` on `ReactFlow` — `ReactFlowProvider` + `useReactFlow().screenToFlowPosition` for drop coordinates; centered placement via half width/height offset
- [x] New `canvasNode` instances via `onNodesChange([{ type: "add", item }])` (Liveblocks storage); ids `${shape}-${timestamp}-${counter}` via `nextCanvasShapeNodeId`
- [x] Custom node renderer — `CanvasNodePlaceholder`: bordered rectangle, centered label, respects dropped `width`/`height`; `data.shape` stored for later SVG shapes
- [x] `npm run build` passes

## Feature 11 — Base canvas (`context/feature-specs/11-base-canvas.md`)

Completed tasks:

- [x] `types/canvas.ts` — `NODE_COLORS`, `NODE_SHAPES`, `CanvasNodeData` (`label`, `color`, `shape`), types `CanvasNode` (`canvasNode`) / `CanvasEdge` (`canvasEdge`), `EDGE_DEFAULT_STROKE`
- [x] `liveblocks.config.ts` — `Storage.flow` typed as `LiveblocksFlow<CanvasNode, CanvasEdge>`
- [x] `components/editor/collaborative-canvas.tsx` — `LiveblocksProvider` (`/api/liveblocks-auth`), `RoomProvider` (project id, `initialPresence` with `cursor: null`, `initialStorage` empty `flow`), `ClientSideSuspense` loading state, `useErrorListener` connection error UI
- [x] React Flow — `useLiveblocksFlow` with `suspense: true`, empty `nodes` / `edges`, dot `Background`, `fitView`, `connectionMode={Loose}`, `canvasEdge` type (now custom `MemoCanvasFlowEdge`; was `SmoothStepEdge` in initial deliverable); live cursors via Feature 19 custom layer (initial build used `@liveblocks/react-flow` `Cursors`; MiniMap removed in Feature 17)
- [x] `app/editor/[projectId]/page.tsx` stays async server page; passes `roomId` into viewport
- [x] `components/editor/editor-workspace-viewport.tsx` — collaborative canvas in main column (AI rail unchanged)
- [x] `npm run build` passes

## Feature 10 — Liveblocks setup (`context/feature-specs/10-liveblocks-setup.md`)

Completed tasks:

- [x] Root `liveblocks.config.ts` — `Presence` (`cursor`, `thinking` since Feature 19; was `isThinking` in initial deliverable), `UserMeta.info` (`name`, `avatar`, `color` for cursor), typed `Storage` / events / metadata stubs
- [x] `lib/liveblocks-server.ts` — cached `Liveblocks` node client (`getLiveblocks`) + `cursorColorForUserId` palette helper
- [x] `POST /api/liveblocks-auth` — Clerk session via `getEditorClerkIdentity`, `getProjectAccessibleToEditor` (403), `upsertRoom` private room + `usersAccesses` for Clerk `userId`, `prepareSession` + `session.allow(room, ["room:write", "feeds:write"])` then `authorize` (Feeds require `feeds:write`; not covered by dashboard-only `identifyUser` defaults), ensures `ai-chat` + `ai-status-feed` via `ensureDefaultEditorFeeds`, userInfo name / avatar / color
- [x] `proxy.ts` — `/api/liveblocks-auth` on public API matcher (handler returns JSON `401`, same pattern as project APIs)
- [x] `@liveblocks/node` dependency aligned with client packages
- [x] `npm run build` passes

## Feature 09 — Share dialog (`context/feature-specs/09-share-dialog.md`)

Completed tasks:

- [x] `resolveProjectCollaboratorMembership` in `lib/project-access.ts` — owner-or-collaborator gate for collaborator routes (otherwise `404`)
- [x] `lib/collaborators/clerk-collaborator-profiles.ts` — batched Clerk `users.getUserList({ emailAddress })`; email → `{ displayName, imageUrl }` when a user exists, else fallback to email in UI
- [x] `GET /api/projects/[projectId]/collaborators` — `role` + enriched `collaborators` array
- [x] `POST /api/projects/[projectId]/collaborators` — owner-only invite by email; rejects self-invite via Clerk email list; `409` duplicate
- [x] `DELETE /api/projects/[projectId]/collaborators` — owner-only; JSON `{ email }`; `204` / `404`
- [x] `components/editor/share-dialog.tsx` — workspace share UI: copy link + `Copied!`, owner invite/remove, collaborator read-only list + footer note
- [x] `editor-workspace-provider.tsx` — `shareDialogOpen` / `openShareDialog`; reset on `clearWorkspaceChrome`
- [x] `editor-navbar.tsx` Share opens dialog; `editor-layout.tsx` mounts `ShareDialog`
- [x] `middleware` — `/api/projects(.*)` unchanged (covers nested collaborators routes)
- [x] `npm run lint` and `npm run build` pass

## Feature 08 — Editor workspace shell (`context/feature-specs/08-editor-workspace-shell.md`)

Completed tasks:

- [x] `lib/project-access.ts` — `getEditorClerkIdentity`, `getProjectAccessibleToEditor`, `resolveProjectCollaboratorMembership` (Feature 09)
- [x] `lib/editor/server-project-lists.ts` — reuses `getEditorClerkIdentity` (removed duplicate Clerk email derivation)
- [x] `components/editor/access-denied.tsx` — centered lock icon, short copy, link to `/editor`
- [x] `app/editor/[projectId]/page.tsx` — async server page: redirect unauthenticated → sign-in path; unauthorized / missing → `AccessDenied`; else `RegisterWorkspaceChrome` + `EditorWorkspaceViewport`
- [x] `components/editor/editor-workspace-provider.tsx` — workspace chrome + AI sidebar + share dialog state (`clearWorkspaceChrome` resets shell)
- [x] `components/editor/register-workspace-chrome.tsx` — client mount hook for navbar project context
- [x] `components/editor/editor-navbar.tsx` — `{name} / Workspace` breadcrumb; labeled Share + AI; Share wired in Feature 09
- [x] `components/editor/editor-workspace-viewport.tsx` — grid canvas shell (compass + copy) + AI Copilot rail with placeholder cards (`ScrollArea`, `Card`)
- [x] `components/editor/project-sidebar.tsx` + `lib/editor/editor-pathname.ts` — highlight current workspace row from pathname
- [x] `npm run lint` and `npm run build` pass

## Feature 07 — Wire editor home (`context/feature-specs/07-wire-editor-home.md`)

Completed tasks:

- [x] `lib/editor/server-project-lists.ts` — server-only `fetchEditorProjectLists()` using Prisma (owned by Clerk `userId`; shared via `ProjectCollaborator` email match + `currentUser()` primary email)
- [x] `app/editor/layout.tsx` — async layout loads lists and passes into `EditorLayout`
- [x] `hooks/use-project-dialogs.ts` — real `POST` / `PATCH` / `DELETE` to `/api/projects`, room ID = slug + suffix (preview + create payload), `router.refresh()`, delete redirects off active workspace
- [x] `app/api/projects/route.ts` — optional JSON `id` on create (validated; `409` on collision) so room ID aligns with `Project.id`
- [x] `lib/api/http.ts` — `jsonConflict` helper
- [x] `components/editor/editor-layout.tsx` + `editor-workspace-provider.tsx` — initial owned/shared props into hook
- [x] `components/editor/project-sidebar.tsx` — real lists, `Link` to `/editor/[projectId]`
- [x] `components/editor/project-dialogs.tsx` — room ID preview + mutation errors
- [x] `app/editor/[projectId]/page.tsx` — routed shell for post-create navigation (workspace UI + access in Feature 08)
- [x] `lib/editor/editor-project.ts`, `lib/editor/project-room-id.ts` — sidebar types + room id helpers; removed mock-only `lib/editor/mock-projects.ts`
- [x] `npm run build` passes

## Feature 04 — Project dialogs (`context/feature-specs/04-project-dialogs.md`)

Completed tasks:

- [x] Editor home (`components/editor/editor-home.tsx`) — heading, description, `New Project` + `Plus`; minimal layout, no cards; opens Create dialog
- [x] `hooks/use-project-dialogs.ts` — dialog state, form state (`createName`, `renameName`, `slugPreview`), `isLoading`; mock mutations only (short delay, no API)
- [x] `components/editor/editor-workspace-provider.tsx` + `EditorLayout` — provider wraps editor shell; `ProjectDialogs` mounted once
- [x] Create / Rename / Delete dialogs (`components/editor/project-dialogs.tsx`) — slug live preview; rename prefilled + current name in description + focus + Enter submits; delete destructive confirm, no input
- [x] `components/editor/project-sidebar.tsx` — mock lists (My vs Shared), rename/delete only for owned rows; `New Project` → Create dialog
- [x] `components/editor/mobile-sidebar-scrim.tsx` — mobile-only backdrop (`md:hidden`), tap closes sidebar; `z-25` under sidebar (`z-30`)
- [x] `lib/editor/project-slug.ts` — `slugifyPreview` (still used for room ID preview / Prisma ids); mock lists removed in Feature 07
- [x] `npm run lint` and `npm run build` pass

## Feature 05 — Prisma (`context/feature-specs/05-prisma.md`)

Completed tasks:

- [x] `prisma/models/project.prisma` — `Project` (ownerId, name, optional description, `ProjectStatus` DRAFT/ARCHIVED, optional `canvasJsonPath`, timestamps, indexes on `ownerId` and `createdAt`) and `ProjectCollaborator` (cascade delete from project, email, `createdAt`, `@@unique([projectId, email])`, indexes on `email` and `[projectId, createdAt]`)
- [x] `lib/prisma.ts` — cached singleton: `prisma+postgres://` / `prisma://` → Accelerate (`accelerateUrl` + `withAccelerate()`); otherwise `@prisma/adapter-pg` + `pg` `Pool`; dev global cache for hot reload
- [x] First migration `20260511173035_init` applied; `@prisma/extension-accelerate` dependency added; `npm run build` runs `prisma generate && next build`

## Feature 06 — Project APIs (`context/feature-specs/06-project-apis.md`)

Completed tasks:

- [x] `GET /api/projects` — list projects for `auth().userId` as `ownerId` (newest first); `401` if no user
- [x] `POST /api/projects` — create with Clerk `ownerId`; default `name` to `Untitled Project`; optional JSON `name` / `description`; `201` response
- [x] `PATCH /api/projects/[projectId]` — rename via JSON `{ name }`; owner-only; `401` / `403` / `404` as appropriate
- [x] `DELETE /api/projects/[projectId]` — owner-only delete; `204` on success; `401` / `403` / `404` as appropriate
- [x] `proxy.ts` — `/api/projects(.*)` public at middleware so handlers return JSON `401` instead of redirect; `lib/api/http.ts` shared JSON error helpers
- [x] `lib/prisma.ts` — export typed as `PrismaClient` (Accelerate branch cast) to avoid incompatible union types in callers
- [x] `npm run lint` and `npm run build` pass

## Open Questions

- None yet.

## Architecture Decisions

- shadcn/ui over Tailwind v4 (CSS-based token config via `@theme inline` in `globals.css`, no `tailwind.config.js`).
- Dark-only theme: product + shadcn semantic variables live in `:root`; `html` keeps class `dark` so `dark:` variants in generated components resolve.
- Do not modify generated `components/ui/*` files after shadcn installation.
- Next.js 16 uses `proxy.ts` at the project root (not `middleware.ts`) with `clerkMiddleware` for Clerk; matcher skips static assets per Clerk / Next guidance.
- Clerk env vars: use dashboard-provided `NEXT_PUBLIC_CLERK_*` keys only; sign-in/up URLs drive public route patterns in `proxy.ts`.

## Session Notes

- Next.js 16.2.6, React 19, Clerk `@clerk/nextjs` ^7, `@clerk/ui` ^1.9.
