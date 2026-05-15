import { auth } from "@trigger.dev/sdk/v3";

import {
  jsonBadRequest,
  jsonNotFound,
  jsonUnauthorized,
} from "@/lib/api/http";
import type { PrismaClient } from "@/generated/prisma/client";
import { getUnacceleratedPrisma } from "@/lib/prisma";
import { getEditorClerkIdentity } from "@/lib/project-access";
import { GENERATE_SPEC_TASK_ID } from "@/lib/trigger-task-ids";

type TokenBody = {
  runId: string;
};

function isTokenBody(body: unknown): body is TokenBody {
  if (!body || typeof body !== "object") return false;
  const o = body as Record<string, unknown>;
  return typeof o.runId === "string" && o.runId.trim().length > 0;
}

function getTriggerSecretKey(): string | null {
  const k = process.env.TRIGGER_SECRET_KEY;
  return typeof k === "string" && k.length > 0 ? k : null;
}

/** POST — mint a Trigger.dev public token scoped to one spec run (after TaskRun ownership check). */
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

  if (!isTokenBody(body)) {
    return jsonBadRequest("Expected JSON with non-empty runId string");
  }

  const runId = body.runId.trim();

  let db: PrismaClient;
  try {
    db = getUnacceleratedPrisma();
  } catch (configErr) {
    console.error(
      "[spec/token] Prisma direct client (TaskRun) unavailable",
      configErr
    );
    return Response.json(
      {
        error:
          "Token mint requires DIRECT_DATABASE_URL when using Prisma Accelerate.",
      },
      { status: 503 }
    );
  }

  const record = await db.taskRun.findFirst({
    where: {
      runId,
      userId: identity.userId,
    },
  });

  if (!record) {
    return jsonNotFound();
  }

  let token: string;
  try {
    token = await auth.createPublicToken({
      scopes: {
        read: {
          runs: [runId],
          tasks: [GENERATE_SPEC_TASK_ID],
        },
      },
      expirationTime: "1h",
    });
  } catch (err) {
    console.error("[spec/token] auth.createPublicToken failed", err);
    return Response.json(
      { error: "Failed to create access token" },
      { status: 502 }
    );
  }

  return Response.json({ token } satisfies { token: string });
}
