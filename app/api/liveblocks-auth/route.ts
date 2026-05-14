import { currentUser } from "@clerk/nextjs/server"

import {
  jsonBadRequest,
  jsonForbidden,
  jsonUnauthorized,
} from "@/lib/api/http"
import { ensureDefaultEditorFeeds } from "@/lib/liveblocks-ensure-feeds"
import { cursorColorForUserId, getLiveblocks } from "@/lib/liveblocks-server"
import {
  getEditorClerkIdentity,
  getProjectAccessibleToEditor,
} from "@/lib/project-access"

export async function POST(request: Request) {
  const identity = await getEditorClerkIdentity()
  if (!identity) {
    return jsonUnauthorized()
  }

  let room: unknown
  try {
    const body: unknown = await request.json()
    room = body && typeof body === "object" && "room" in body
      ? (body as { room: unknown }).room
      : undefined
  } catch {
    return jsonBadRequest("Invalid JSON body")
  }

  if (typeof room !== "string" || room.trim() === "") {
    return jsonBadRequest("room is required")
  }

  const projectId = room.trim()
  if (!(await getProjectAccessibleToEditor(projectId, identity))) {
    return jsonForbidden()
  }

  const liveblocks = getLiveblocks()

  await liveblocks.upsertRoom(projectId, {
    update: {
      defaultAccesses: [],
      usersAccesses: {
        [identity.userId]: ["room:write"],
      },
    },
  })

  await ensureDefaultEditorFeeds(liveblocks, projectId)

  const user = await currentUser()
  const displayName =
    user?.fullName?.trim() ||
    user?.username?.trim() ||
    user?.primaryEmailAddress?.emailAddress?.trim() ||
    "Anonymous"
  const avatarUrl = user?.imageUrl ?? ""
  const color = cursorColorForUserId(identity.userId)

  const session = liveblocks.prepareSession(identity.userId, {
    userInfo: {
      name: displayName,
      avatar: avatarUrl,
      color,
    },
  })

  /** `room:write` alone does not include Feeds; sidebar `ai-chat` / `ai-status-feed` require `feeds:write`. */
  session.allow(projectId, ["room:write", "feeds:write"])

  const { status, body, error } = await session.authorize()
  if (error !== undefined) {
    console.error("[liveblocks-auth] session.authorize failed", error)
    return Response.json(
      { error: "Could not issue Liveblocks session token" },
      { status: 502 }
    )
  }

  return new Response(body, { status })
}
