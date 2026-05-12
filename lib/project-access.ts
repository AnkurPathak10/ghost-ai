import "server-only"

import { auth, currentUser } from "@clerk/nextjs/server"

import { prisma } from "@/lib/prisma"

export type EditorClerkIdentity = {
  userId: string
  primaryEmail: string | null
}

function primaryEmailFromUser(
  user: Awaited<ReturnType<typeof currentUser>>
): string | null {
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

/** Current signed-in Clerk user id and canonical primary email, or null if signed out. */
export async function getEditorClerkIdentity(): Promise<EditorClerkIdentity | null> {
  const { userId } = await auth()
  if (!userId) return null
  const user = await currentUser()
  const primaryEmail = primaryEmailFromUser(user)
  return { userId, primaryEmail }
}

/** Project row visible in the workspace if the viewer is owner or collaborator. Null when missing or no access. */
export async function getProjectAccessibleToEditor(
  projectId: string,
  identity: EditorClerkIdentity
): Promise<{ id: string; name: string } | null> {
  const collaboratorMatch =
    identity.primaryEmail !== null
      ? { collaborators: { some: { email: identity.primaryEmail } } }
      : null

  const project = await prisma.project.findFirst({
    where: {
      id: projectId,
      OR: [
        { ownerId: identity.userId },
        ...(collaboratorMatch !== null ? [collaboratorMatch] : []),
      ],
    },
    select: { id: true, name: true },
  })

  return project
}

/** Owner or collaborator of this project — used by share / collaborators APIs. */
export async function resolveProjectCollaboratorMembership(
  projectId: string,
  identity: EditorClerkIdentity
): Promise<{ role: "owner" | "collaborator"; projectId: string } | null> {
  const collaboratorMatch =
    identity.primaryEmail !== null
      ? { collaborators: { some: { email: identity.primaryEmail } } }
      : null

  const project = await prisma.project.findFirst({
    where: {
      id: projectId,
      OR: [
        { ownerId: identity.userId },
        ...(collaboratorMatch !== null ? [collaboratorMatch] : []),
      ],
    },
    select: {
      id: true,
      ownerId: true,
    },
  })

  if (!project) return null
  if (project.ownerId === identity.userId) {
    return { role: "owner", projectId: project.id }
  }
  return { role: "collaborator", projectId: project.id }
}
