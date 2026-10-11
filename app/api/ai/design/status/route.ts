import { runs } from "@trigger.dev/sdk/v3"

import { jsonBadRequest, jsonNotFound, jsonUnauthorized } from "@/lib/api/http"
import { getUnacceleratedPrisma } from "@/lib/prisma"
import {
  getEditorClerkIdentity,
  getProjectAccessibleToEditor,
} from "@/lib/project-access"

/** Read a recorded run's authoritative status when realtime delivery is delayed or lost. */
export async function GET(request: Request) {
  const identity = await getEditorClerkIdentity()
  if (!identity) return jsonUnauthorized()

  const runId = new URL(request.url).searchParams.get("runId")?.trim()
  if (!runId || !/^run_[A-Za-z0-9_-]+$/.test(runId)) {
    return jsonBadRequest("Expected a valid runId")
  }

  let record: { projectId: string } | null
  try {
    record = await getUnacceleratedPrisma().taskRun.findUnique({
      where: { runId },
      select: { projectId: true },
    })
  } catch (error) {
    console.error("[design/status] TaskRun lookup failed", error)
    return Response.json({ error: "Could not check run ownership" }, { status: 503 })
  }
  if (!record || !(await getProjectAccessibleToEditor(record.projectId, identity))) {
    return jsonNotFound()
  }

  try {
    const run = await runs.retrieve(runId)
    return Response.json(
      { runId, status: run.status, output: run.output ?? null },
      { headers: { "Cache-Control": "no-store" } }
    )
  } catch (error) {
    console.error("[design/status] Trigger run lookup failed", error)
    return Response.json({ error: "Could not check run status" }, { status: 502 })
  }
}
