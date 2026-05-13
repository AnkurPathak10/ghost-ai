# Progress Tracker

Update this file whenever the current phase, active feature, or implementation state changes.

## Current Phase

- Feature 18 (Starter template) — complete

## Current Goal

- Next numbered feature spec after 18 (TBD)

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

## Next Up

- Next numbered feature spec after 18 (TBD).

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
- [x] React Flow — `useLiveblocksFlow` with `suspense: true`, empty `nodes` / `edges`, dot `Background`, `fitView`, `connectionMode={Loose}`, `canvasEdge` type (now custom `MemoCanvasFlowEdge`; was `SmoothStepEdge` in initial deliverable), `Cursors` (initial build also had `MiniMap`; removed in Feature 17)
- [x] `app/editor/[projectId]/page.tsx` stays async server page; passes `roomId` into viewport
- [x] `components/editor/editor-workspace-viewport.tsx` — collaborative canvas in main column (AI rail unchanged)
- [x] `npm run build` passes

## Feature 10 — Liveblocks setup (`context/feature-specs/10-liveblocks-setup.md`)

Completed tasks:

- [x] Root `liveblocks.config.ts` — `Presence` (`cursor`, `isThinking`), `UserMeta.info` (`name`, `avatar`, `color` for cursor), typed `Storage` / events / metadata stubs
- [x] `lib/liveblocks-server.ts` — cached `Liveblocks` node client (`getLiveblocks`) + `cursorColorForUserId` palette helper
- [x] `POST /api/liveblocks-auth` — Clerk session via `getEditorClerkIdentity`, `getProjectAccessibleToEditor` (403), `upsertRoom` private room + `usersAccesses` for Clerk `userId`, `identifyUser` with name / avatar / color
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
