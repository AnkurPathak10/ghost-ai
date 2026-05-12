import "server-only"

import type { EditorSidebarProject } from "@/lib/editor/editor-project"
import { getEditorClerkIdentity } from "@/lib/project-access"
import { prisma } from "@/lib/prisma"

export async function fetchEditorProjectLists(): Promise<{
  owned: EditorSidebarProject[]
  shared: EditorSidebarProject[]
}> {
  const identity = await getEditorClerkIdentity()
  if (!identity) {
    return { owned: [], shared: [] }
  }

  const { userId, primaryEmail: email } = identity

  const [ownedRows, sharedRows] = await Promise.all([
    prisma.project.findMany({
      where: { ownerId: userId },
      orderBy: { createdAt: "desc" },
      select: { id: true, name: true },
    }),
    email
      ? prisma.project.findMany({
          where: {
            collaborators: { some: { email } },
            ownerId: { not: userId },
          },
          orderBy: { createdAt: "desc" },
          select: { id: true, name: true },
        })
      : Promise.resolve([]),
  ])

  const owned: EditorSidebarProject[] = ownedRows.map((p) => ({
    id: p.id,
    name: p.name,
    membership: "owner",
  }))

  const shared: EditorSidebarProject[] = sharedRows.map((p) => ({
    id: p.id,
    name: p.name,
    membership: "collaborator",
  }))

  return { owned, shared }
}
