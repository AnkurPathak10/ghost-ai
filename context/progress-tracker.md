# Progress Tracker

Update this file whenever the current phase, active feature, or implementation state changes.

## Current Phase

- Feature 03 (Auth) — complete

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
- [x] Dialog pattern — deferred: use `components/ui/dialog.tsx` with `DialogHeader` / `DialogTitle` / `DialogDescription` / `DialogFooter`; tokens come from `app/globals.css` via shadcn semantic variables (`popover`, `muted`, borders, etc.). No standalone dialogs wired yet.

Integration / verification:

- [x] `components/editor/editor-layout.tsx` + `app/editor/layout.tsx` — client `EditorLayout` composes `EditorNavbar` + `ProjectSidebar`; `page.tsx` renders route content only (`npm run lint`, `npm run build`, TypeScript clean)

## Completed

- Feature 01: Design System — shadcn for Tailwind v4 (CLI preset base-nova, `@base-ui/react` primitives). `components/ui/` includes Button, Card, Dialog, Input, Tabs, Textarea, ScrollArea. `lucide-react` installed. `lib/utils.ts` exposes `cn()`. `app/globals.css`: dark-only tokens from `context/ui-context.md` wired into shadcn semantic CSS variables; `html` uses `class="dark"`. Build and lint pass.

## In Progress

- None.

## Next Up

- TBD (next numbered feature spec).

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
