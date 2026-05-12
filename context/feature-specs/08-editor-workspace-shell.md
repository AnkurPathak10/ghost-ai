Build the `/editor/[roomId]` workspace shell with server-side access checks. No canvas logic yet.

## Access

`/editor/[roomId]` must be a server component.

Before rendering:

- unauthenticated users redirect to `/sign-in`
- users without project access see `AccessDenied`
- non-existent projects also show `AccessDenied`

Create `components/editor/access-denied.tsx` with:

- centered layout
- lock icon
- short message
- link back to `/editor`

## Access Helpers

Create `lib/project-access.ts` with helpers for:

- getting current Clerk identity: `userId` + primary email
- checking project access by owner or collaborator

## Layout

Build a full-viewport workspace layout with:

- top navbar: breadcrumb-style title `{project name} / Workspace`, plus **labeled** actions (**Share**, **AI**) with icons to the left of the labels (toggle still collapses only the AI panel; Share remains a stub)
- navbar actions use visual weight aligned with shell reference: elevated outline-style **Share**, brand-filled **AI** when the Copilot rail is visible
- existing `ProjectSidebar` on the left
- current room highlighted in the sidebar
- central **canvas shell**: subtle square grid over `bg-base`, centered compass emblem, eyebrow label `Workspace shell`, primary heading and short explanatory copy describing the upcoming canvas (no interactive canvas)
- right **AI Copilot** rail (~24rem wide on `sm+`), **open by default** when the workspace route is active: header `AI Copilot` + `Placeholder panel`, scrollable placeholder cards (`Chat surface pending` with bot row, `Future hooks` for prompt/status copy)
- canvas area flexes to fill space between project sidebar overlay and the AI rail

## Scope

Do not add real canvas logic, Liveblocks, AI chat, or sharing behavior yet.

## Check When Done

- `/editor/[roomId]` builds successfully
- access helper exists outside the page component
- `AccessDenied` is used for missing or unauthorized projects
- workspace layout renders with current project context (navbar + canvas shell + visible AI rail as per reference)
- no TypeScript errors
