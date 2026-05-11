import "server-only"

import { auth, currentUser } from "@clerk/nextjs/server"

import type { EditorSidebarProject } from "@/lib/editor/editor-project"
import { prisma } from "@/lib/prisma"

function primaryEmailFromUser(user: Awaited<ReturnType<typeof currentUser>>): string | null {
  if (!user) return null
  const primaryId = user.primaryEmailAddressId
  const primary =
    primaryId !== null && primaryId !== undefined
      ? user.emailAddresses.find((e) => e.id === primaryId)
      : undefined
  const fallback = user.emailAddresses[0]
  const addr = primary ?? fallback
  return addr?.emailAddress?.toLowerCase().trim() ?? null
}

export async function fetchEditorProjectLists(): Promise<{
  owned: EditorSidebarProject[]
  shared: EditorSidebarProject[]
}> {
  const { userId } = await auth()
  if (!userId) {
    return { owned: [], shared: [] }
  }

  const user = await currentUser()
  const email = primaryEmailFromUser(user)

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
