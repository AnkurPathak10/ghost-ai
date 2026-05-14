import { tasks } from "@trigger.dev/sdk/v3";

import {
  jsonBadRequest,
  jsonNotFound,
  jsonUnauthorized,
} from "@/lib/api/http";
import { Prisma, type PrismaClient } from "@/generated/prisma/client";
import { getUnacceleratedPrisma } from "@/lib/prisma";
import {
  getEditorClerkIdentity,
  getProjectAccessibleToEditor,
} from "@/lib/project-access";
import { DESIGN_AGENT_TASK_ID } from "@/lib/trigger-task-ids";

type DesignStartBody = {
  prompt: string;
  roomId: string;
  projectId: string;
};

function isDesignStartBody(body: unknown): body is DesignStartBody {
  if (!body || typeof body !== "object") return false;
  const o = body as Record<string, unknown>;
  return (
    typeof o.prompt === "string" &&
    o.prompt.trim().length > 0 &&
    typeof o.roomId === "string" &&
    o.roomId.trim().length > 0 &&
    typeof o.projectId === "string" &&
    o.projectId.trim().length > 0
  );
}

function getTriggerSecretKey(): string | null {
  const k = process.env.TRIGGER_SECRET_KEY;
  return typeof k === "string" && k.length > 0 ? k : null;
}

/** POST — start a design generation run (Trigger.dev); persists TaskRun for token scoping. */
export async function POST(request: Request) {
  if (!getTriggerSecretKey()) {
    return Response.json(
      { error: "Background tasks are not configured (TRIGGER_SECRET_KEY)." },
      { status: 503 }
    );
  }

  const identity = await getEditorClerkIdentity();
  if (!identity) {
    return jsonUnauthorized();
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return jsonBadRequest("Invalid JSON body");
  }

  if (!isDesignStartBody(body)) {
    return jsonBadRequest(
      "Expected JSON with non-empty prompt, roomId, and projectId strings"
    );
  }

  const access = await getProjectAccessibleToEditor(body.projectId, identity);
  if (!access) {
    return jsonNotFound();
  }

  let runId: string;
  try {
    const handle = await tasks.trigger(DESIGN_AGENT_TASK_ID, {
      prompt: body.prompt.trim(),
      roomId: body.roomId.trim(),
    });
    runId = handle.id;
  } catch (err) {
    console.error("[design] tasks.trigger failed", err);
    return Response.json(
      { error: "Failed to start background task" },
      { status: 502 }
    );
  }

  let db: PrismaClient;
  try {
    db = getUnacceleratedPrisma();
  } catch (configErr) {
    console.error("[design] Prisma direct client (TaskRun) unavailable", configErr);
    return Response.json(
      {
        error:
          "Task recording requires DIRECT_DATABASE_URL when using Prisma Accelerate. Add it to the server environment.",
      },
      { status: 503 }
    );
  }

  try {
    await db.taskRun.upsert({
      where: { runId },
      create: {
        runId,
        projectId: access.id,
        userId: identity.userId,
      },
      update: {
        projectId: access.id,
        userId: identity.userId,
      },
    });
  } catch (err) {
    const prismaDetails =
      err instanceof Prisma.PrismaClientKnownRequestError
        ? ` code=${err.code} meta=${JSON.stringify(err.meta)}`
        : "";
    console.error(`[design] TaskRun upsert failed${prismaDetails}`, err);
    const message =
      err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2003"
        ? "Could not link this run to your project in the database. Ask an admin to verify migrations (TaskRun) and DATABASE_URL."
        : err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2021"
          ? "Database is missing the TaskRun table. Run prisma migrate deploy (or migrate dev) against DATABASE_URL."
          : "Failed to record task run";
    return Response.json({ error: message }, { status: 500 });
  }

  return Response.json({ runId } satisfies { runId: string });
}
