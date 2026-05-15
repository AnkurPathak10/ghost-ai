import type { PrismaClient } from "@/generated/prisma/client";

import { jsonNotFound, jsonUnauthorized } from "@/lib/api/http";
import { getUnacceleratedPrisma } from "@/lib/prisma";
import { listProjectSpecMeta } from "@/lib/project-spec-queries";
import { formatSpecDisplayFilename } from "@/lib/spec-display-filename";
import {
  getEditorClerkIdentity,
  getProjectAccessibleToEditor,
} from "@/lib/project-access";

type RouteContext = { params: Promise<{ projectId: string }> };

/** GET — list persisted spec metadata for a project (no blob URLs). */
export async function GET(_request: Request, context: RouteContext) {
  const identity = await getEditorClerkIdentity();
  if (!identity) {
    return jsonUnauthorized();
  }

  const { projectId } = await context.params;

  const access = await getProjectAccessibleToEditor(projectId, identity);
  if (!access) {
    return jsonNotFound();
  }

  let db: PrismaClient;
  try {
    db = getUnacceleratedPrisma();
  } catch {
    return Response.json(
      {
        error:
          "Spec listing requires DIRECT_DATABASE_URL when using Prisma Accelerate.",
      },
      { status: 503 }
    );
  }

  const rows = await listProjectSpecMeta(db, projectId);

  const specs = rows.map((r) => ({
    id: r.id,
    createdAt: r.createdAt.toISOString(),
    filename: formatSpecDisplayFilename(r.createdAt),
  }));

  return Response.json({ specs });
}
