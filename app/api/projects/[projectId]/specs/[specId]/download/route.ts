import { get } from "@vercel/blob";

import type { PrismaClient } from "@/generated/prisma/client";

import { jsonNotFound, jsonUnauthorized } from "@/lib/api/http";
import { getUnacceleratedPrisma } from "@/lib/prisma";
import { getProjectSpecRecord } from "@/lib/project-spec-queries";
import { formatSpecDisplayFilename } from "@/lib/spec-display-filename";
import {
  getEditorClerkIdentity,
  getProjectAccessibleToEditor,
} from "@/lib/project-access";

type RouteContext = {
  params: Promise<{ projectId: string; specId: string }>;
};

function getBlobToken(): string | null {
  const t = process.env.BLOB_READ_WRITE_TOKEN;
  return typeof t === "string" && t.length > 0 ? t : null;
}

/** GET — stream a persisted generated spec as a Markdown download (access-checked; blob URL never exposed). */
export async function GET(_request: Request, context: RouteContext) {
  const identity = await getEditorClerkIdentity();
  if (!identity) {
    return jsonUnauthorized();
  }

  const { projectId, specId } = await context.params;

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
          "Spec download requires DIRECT_DATABASE_URL when using Prisma Accelerate.",
      },
      { status: 503 }
    );
  }

  const spec = await getProjectSpecRecord(db, projectId, specId);

  if (!spec) {
    return jsonNotFound();
  }

  const token = getBlobToken();
  if (!token) {
    return Response.json(
      { error: "Blob storage is not configured (BLOB_READ_WRITE_TOKEN)." },
      { status: 503 }
    );
  }

  const blobResult = await get(spec.filePath, {
    access: "private",
    token,
  });

  if (
    !blobResult ||
    blobResult.statusCode !== 200 ||
    blobResult.stream === null
  ) {
    return Response.json(
      { error: "Stored spec could not be loaded." },
      { status: 502 }
    );
  }

  const filename = formatSpecDisplayFilename(spec.createdAt);

  return new Response(blobResult.stream as BodyInit, {
    headers: {
      "Content-Type": "text/markdown; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
