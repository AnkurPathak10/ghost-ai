# Progress Tracker

Update this file whenever the current phase, active feature, or implementation state changes.

## Current Phase

- Feature 02 (Editor Chrome) — complete

## Current Goal

- Next feature from `context/feature-specs/` (TBD)

## Feature 02 — Editor Chrome (`context/feature-specs/02-editor.md`)

Completed tasks:

- [x] `components/editor/editor-navbar.tsx` — fixed `h-14` top bar, left / center / right layout, sidebar toggle with `PanelLeftOpen` / `PanelLeftClose` by state, right section empty (placeholder alignment only), dark surface + subtle bottom border
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
- Follow Next.js 16 framework conventions from `node_modules/next/dist/docs/`.

## Session Notes

- Next.js / React versions per `package.json` in repo.
- shadcn CLI base-nova preset.
