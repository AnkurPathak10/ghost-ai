import { currentUser } from "@clerk/nextjs/server"

import {
  jsonBadRequest,
  jsonConflict,
  jsonForbidden,
  jsonNotFound,
  jsonUnauthorized,
} from "@/lib/api/http"
import {
  clerkOwnerSnapshot,
  clerkProfilesForCollaboratorEmails,
} from "@/lib/collaborators/clerk-collaborator-profiles"
import { Prisma } from "@/generated/prisma/client"
import { prisma } from "@/lib/prisma"
import {
  type EditorClerkIdentity,
  getEditorClerkIdentity,
  resolveProjectCollaboratorMembership,
} from "@/lib/project-access"

type RouteContext = { params: Promise<{ projectId: string }> }

function normalizeInviteEmail(raw: unknown): string | null {
  if (typeof raw !== "string") return null
  const t = raw.trim().toLowerCase()
  if (t === "" || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(t)) return null
  return t
}

async function requireMembership(
  projectId: string,
  identity: EditorClerkIdentity | null
) {
  if (!identity) return { error: jsonUnauthorized() as Response }
  const member = await resolveProjectCollaboratorMembership(projectId, identity)
  if (!member) return { error: jsonNotFound() as Response }
  return { member }
}

export async function GET(_request: Request, context: RouteContext) {
  const identity = await getEditorClerkIdentity()
  const { projectId } = await context.params

  const gate = await requireMembership(projectId, identity)
  if ("error" in gate) return gate.error

  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: { ownerId: true },
  })
  if (!project) {
    return jsonNotFound()
  }

  const [owner, rows] = await Promise.all([
    clerkOwnerSnapshot(project.ownerId),
    prisma.projectCollaborator.findMany({
      where: { projectId },
      orderBy: { email: "asc" },
      select: { id: true, email: true, createdAt: true },
    }),
  ])

  const profileMap = await clerkProfilesForCollaboratorEmails(
    rows.map((r) => r.email)
  )

  return Response.json({
    role: gate.member.role,
    owner,
    collaborators: rows.map((row) => {
      const key = row.email.toLowerCase()
      const enriched = profileMap.get(key)
      return {
        id: row.id,
        email: row.email,
        createdAt: row.createdAt.toISOString(),
        profile: enriched ?? { displayName: null, imageUrl: null },
      }
    }),
  })
}

export async function POST(request: Request, context: RouteContext) {
  const identity = await getEditorClerkIdentity()
  const { projectId } = await context.params

  const gate = await requireMembership(projectId, identity)
  if ("error" in gate) return gate.error
  if (gate.member.role !== "owner") {
    return jsonForbidden()
  }

  let email: string
  try {
    const body: unknown = await request.json()
    const record =
      body && typeof body === "object" ? (body as Record<string, unknown>) : {}
    const parsed = normalizeInviteEmail(record.email)
    if (!parsed) {
      return jsonBadRequest("Provide a valid email address")
    }
    email = parsed
  } catch {
    return jsonBadRequest("Invalid JSON body")
  }

  const me = await currentUser()
  const myEmails = new Set(
    me?.emailAddresses?.map((a) => a.emailAddress.toLowerCase().trim())
  )
  if (myEmails.has(email)) {
    return jsonBadRequest("You cannot invite your own email as a collaborator")
  }

  try {
    const created = await prisma.projectCollaborator.create({
      data: { projectId, email },
      select: { id: true, email: true, createdAt: true },
    })

    const profileMap = await clerkProfilesForCollaboratorEmails([created.email])
    const key = created.email.toLowerCase()
    const enriched = profileMap.get(key)

    return Response.json(
      {
        collaborator: {
          id: created.id,
          email: created.email,
          createdAt: created.createdAt.toISOString(),
          profile: enriched ?? { displayName: null, imageUrl: null },
        },
      },
      { status: 201 }
    )
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      return jsonConflict("This email is already a collaborator on this project")
    }
    throw error
  }
}

export async function DELETE(request: Request, context: RouteContext) {
  const identity = await getEditorClerkIdentity()
  const { projectId } = await context.params

  const gate = await requireMembership(projectId, identity)
  if ("error" in gate) return gate.error
  if (gate.member.role !== "owner") {
    return jsonForbidden()
  }

  let email: string
  try {
    const body: unknown = await request.json()
    const record =
      body && typeof body === "object" ? (body as Record<string, unknown>) : {}
    const parsed = normalizeInviteEmail(record.email)
    if (!parsed) {
      return jsonBadRequest("Provide a valid email address")
    }
    email = parsed
  } catch {
    return jsonBadRequest("Invalid JSON body")
  }

  const result = await prisma.projectCollaborator.deleteMany({
    where: { projectId, email },
  })

  if (result.count === 0) {
    return jsonNotFound()
  }

  return new Response(null, { status: 204 })
}
