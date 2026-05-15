# Architecture Context

## Stack

| Layer            | Technology              | Role                                                           |
| ---------------- | ----------------------- | -------------------------------------------------------------- |
| Framework        | Next.js 16 + TypeScript | Full-stack app with server/client boundaries                   |
| UI               | Tailwind + shadcn/ui    | Component composition and styling                              |
| Auth             | Clerk                   | User identity and route protection                             |
| Database         | Prisma + PostgreSQL     | Relational metadata: projects, collaborators, specs, task runs |
| Canvas           | Liveblocks + React Flow | Real-time collaborative canvas, presence, and cursors          |
| Background tasks | Trigger.dev             | Durable AI generation workflows                                |
| Artifact storage | Vercel Blob             | Canvas snapshots and generated Markdown specs                  |

## System Boundaries

- `proxy.ts` (project root, Next.js 16) — Clerk `clerkMiddleware`: session + route protection; public routes include `/`, sign-in, sign-up URLs from env, and `/api/projects/*` (handlers enforce `401`/`403` with JSON responses instead of redirects).
- `app/api` — Authenticated request handlers: input validation, ownership checks, task triggering, persistence, and artifact streaming (for example canvas JSON, collaborator lists, spec metadata list + Markdown download, design/spec task triggers).
- `trigger` — Long-running background jobs: AI design generation and spec generation.
- `lib` — Shared infrastructure: Prisma client, access control helpers, and utilities.
- `components` — UI composition: canvas surfaces, sidebars, dialogs, and interactive elements.
- `prisma` — Database schema and generated client output.
- `data` — Legacy local directory. Not used for new artifacts.

## Storage Model

- **Prisma Client**: uses Prisma Accelerate when `DATABASE_URL` starts with `prisma+postgres://` or `prisma://`; otherwise connects with the PostgreSQL driver via `@prisma/adapter-pg` and `pg`. The exported `prisma` singleton is recreated when `DATABASE_URL` changes (via an env fingerprint) so Next.js dev HMR does not keep a stale client—for example after switching between Accelerate and direct URLs or regenerating the client after schema changes. For models and nested writes that Accelerate does not expose (for example `TaskRun`), API routes use `getUnacceleratedPrisma()` in `lib/prisma.ts`, backed by `DIRECT_DATABASE_URL` when `DATABASE_URL` uses Accelerate — a normal `postgresql://` URL to the same database. When not using Accelerate, that helper returns the same direct Postgres client as the default export.
- **Database**: metadata, ownership, relationships, and task run records.
- **Vercel Blob**: generated artifacts — canvas snapshots at `canvas/{projectId}.json` and specs at `specs/{projectId}/{specId}.md`.
- Project records, spec records, and task run records belong in PostgreSQL.
- Canvas content and Markdown output are stored in and retrieved from Vercel Blob.
- The blob URL is stored in the database (`canvasJsonPath`, `filePath`) as the reference to the artifact.

## Auth and Collaboration Model

- Every project has a single owner (Clerk user ID).
- Projects can include additional collaborators.
- Only authenticated users can access protected routes.
- Only the owner or a collaborator can mutate project resources.
- Liveblocks room tokens are issued only after verifying project membership.
- The editor workspace uses one Liveblocks room (project id) for both the canvas and the AI sidebar so presence, storage, and the `ai-status-feed` stay in sync for all participants.

## Starter System Designs

- Prebuilt templates are static canvas snapshots stored in the codebase.
- Templates are loaded into the active Liveblocks room when a user imports one.
- Import can occur on canvas creation or from within the editor at any time.
- Template data follows the same node/edge schema as user-created canvas content.
- Templates do not require a separate database record; they are resolved by template ID at import time.

## AI Generation Model

### Design Generation

- Input: user prompt, project context, and current canvas state.
- Execution: durable background task via Trigger.dev.
- Output: structured node and edge updates written into the shared Liveblocks room.

### Spec Generation

- Input: current canvas graph and project context.
- Execution: durable background task via Trigger.dev.
- Output: Markdown technical spec uploaded to Vercel Blob and linked to the project via a `ProjectSpec` row.

## Invariants

1. Request handlers do not run long-lived AI work — that belongs in background tasks.
2. Metadata and large generated artifacts are stored in separate layers.
3. Auth and ownership are enforced at every mutation boundary.
4. Client components are used only where browser interactivity or real-time state requires them.
5. The canvas schema must remain consistent between user-created content and imported templates.
