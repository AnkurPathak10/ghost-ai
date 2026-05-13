import { currentUser } from "@clerk/nextjs/server"

import {
  jsonBadRequest,
  jsonForbidden,
  jsonUnauthorized,
} from "@/lib/api/http"
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

  const user = await currentUser()
  const displayName =
    user?.fullName?.trim() ||
    user?.username?.trim() ||
    user?.primaryEmailAddress?.emailAddress?.trim() ||
    "Anonymous"
  const avatarUrl = user?.imageUrl ?? ""
  const color = cursorColorForUserId(identity.userId)

  const { status, body } = await liveblocks.identifyUser(identity.userId, {
    userInfo: {
      name: displayName,
      avatar: avatarUrl,
      color,
    },
  })

  return new Response(body, { status })
}
