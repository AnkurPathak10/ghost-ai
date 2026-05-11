# Progress Tracker

Update this file whenever the current phase, active feature, or implementation state changes.

## Current Phase

- Feature 07 (Wire editor home) — complete

## Current Goal

- Next feature from `context/feature-specs/` (TBD)

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

- Next numbered feature spec after 07 (TBD).

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
- [x] `app/editor/[projectId]/page.tsx` — minimal workspace shell for post-create navigation
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
