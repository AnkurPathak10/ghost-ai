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
import { specGenerationApiBodySchema } from "@/lib/spec-generation/spec-generation-schemas";
import { GENERATE_SPEC_TASK_ID } from "@/lib/trigger-task-ids";

function getTriggerSecretKey(): string | null {
  const k = process.env.TRIGGER_SECRET_KEY;
  return typeof k === "string" && k.length > 0 ? k : null;
}

/** POST — start spec generation (Trigger.dev); persists TaskRun for token scoping. */
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

  const parsed = specGenerationApiBodySchema.safeParse(body);
  if (!parsed.success) {
    return jsonBadRequest(
      parsed.error.issues.map((i) => i.message).join("; ") ||
        "Invalid request body"
    );
  }

  const roomId = parsed.data.roomId.trim();

  const access = await getProjectAccessibleToEditor(roomId, identity);
  if (!access) {
    return jsonNotFound();
  }

  let runId: string;
  try {
    const handle = await tasks.trigger(GENERATE_SPEC_TASK_ID, {
      projectId: access.id,
      roomId,
      chatHistory: parsed.data.chatHistory,
      nodes: parsed.data.nodes,
      edges: parsed.data.edges,
    });
    runId = handle.id;
  } catch (err) {
    console.error("[spec] tasks.trigger failed", err);
    return Response.json(
      { error: "Failed to start background task" },
      { status: 502 }
    );
  }

  let db: PrismaClient;
  try {
    db = getUnacceleratedPrisma();
  } catch (configErr) {
    console.error(
      "[spec] Prisma direct client (TaskRun) unavailable",
      configErr
    );
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
    console.error(`[spec] TaskRun upsert failed${prismaDetails}`, err);
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
