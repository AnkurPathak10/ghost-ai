import "server-only"

import type { User } from "@clerk/backend"
import { clerkClient } from "@clerk/nextjs/server"

export interface CollaboratorClerkProfile {
  displayName: string | null
  imageUrl: string | null
}

function clerkDisplayName(user: User): string | null {
  const composed = [user.firstName, user.lastName].filter(Boolean).join(" ").trim()
  if (composed !== "") return composed
  if (typeof user.username === "string" && user.username.trim() !== "") {
    return user.username.trim()
  }
  return null
}

function indexUserEmails(user: User, map: Map<string, CollaboratorClerkProfile>) {
  const displayName = clerkDisplayName(user)
  const img = user.imageUrl
  const profile: CollaboratorClerkProfile = {
    displayName,
    imageUrl: typeof img === "string" && img.trim() !== "" ? img : null,
  }
  const addresses = user.emailAddresses ?? []
  for (const ea of addresses) {
    const key = ea.emailAddress?.toLowerCase().trim()
    if (key) map.set(key, profile)
  }
}

/** Primary email + display profile for the project owner (Clerk user id). */
export async function clerkOwnerSnapshot(ownerUserId: string): Promise<{
  userId: string
  primaryEmail: string | null
  profile: CollaboratorClerkProfile
}> {
  try {
    const client = await clerkClient()
    const user = await client.users.getUser(ownerUserId)
    const emails = user.emailAddresses ?? []
    const primaryId = user.primaryEmailAddressId
    const primary =
      primaryId !== undefined && primaryId !== null
        ? emails.find((e) => e.id === primaryId)
        : undefined
    const fallback = emails[0]
    const addr = primary ?? fallback
    const primaryEmail = addr?.emailAddress?.toLowerCase().trim() ?? null

    const displayName = clerkDisplayName(user)
    const img = user.imageUrl
    const profile: CollaboratorClerkProfile = {
      displayName,
      imageUrl: typeof img === "string" && img.trim() !== "" ? img : null,
    }

    return { userId: ownerUserId, primaryEmail, profile }
  } catch {
    return {
      userId: ownerUserId,
      primaryEmail: null,
      profile: { displayName: null, imageUrl: null },
    }
  }
}

/** Map collaborator email → Clerk display + avatar where a registered user exists in this Clerk app. */
export async function clerkProfilesForCollaboratorEmails(
  emails: string[]
): Promise<Map<string, CollaboratorClerkProfile>> {
  const map = new Map<string, CollaboratorClerkProfile>()
  const unique = [
    ...new Set(
      emails
        .map((e) => e.toLowerCase().trim())
        .filter((e) => e.includes("@"))
    ),
  ]

  if (unique.length === 0) return map

  const batchSize = 100

  try {
    const client = await clerkClient()
    for (let i = 0; i < unique.length; i += batchSize) {
      const slice = unique.slice(i, i + batchSize)
      const { data } = await client.users.getUserList({
        emailAddress: slice,
      })
      for (const user of data) {
        indexUserEmails(user, map)
      }
    }
  } catch {
    /* fall back to email-only rows */
  }

  return map
}
