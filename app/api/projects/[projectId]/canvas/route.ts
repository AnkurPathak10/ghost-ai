import { get, put } from "@vercel/blob";

import {
  jsonBadRequest,
  jsonNotFound,
  jsonUnauthorized,
} from "@/lib/api/http";
import { prisma } from "@/lib/prisma";
import {
  getEditorClerkIdentity,
  getProjectAccessibleToEditor,
} from "@/lib/project-access";
import type { CanvasEdge, CanvasNode } from "@/types/canvas";

type RouteContext = { params: Promise<{ projectId: string }> };

type CanvasPayload = { nodes: CanvasNode[]; edges: CanvasEdge[] };

function isCanvasPayload(body: unknown): body is CanvasPayload {
  if (!body || typeof body !== "object") return false;
  const o = body as Record<string, unknown>;
  return Array.isArray(o.nodes) && Array.isArray(o.edges);
}

function getBlobToken(): string | null {
  const t = process.env.BLOB_READ_WRITE_TOKEN;
  return typeof t === "string" && t.length > 0 ? t : null;
}

/** GET — return persisted canvas JSON from the project’s blob (or empty). */
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

  const record = await prisma.project.findUnique({
    where: { id: projectId },
    select: { canvasJsonPath: true },
  });

  const url = record?.canvasJsonPath?.trim();
  if (!url) {
    return Response.json({ nodes: [], edges: [] } satisfies CanvasPayload);
  }

  const token = getBlobToken();
  if (!token) {
    return Response.json(
      { error: "Canvas storage is not configured (BLOB_READ_WRITE_TOKEN)." },
      { status: 503 }
    );
  }

  const blobResult = await get(url, { access: "private", token });
  if (
    !blobResult ||
    blobResult.statusCode !== 200 ||
    blobResult.stream === null
  ) {
    return Response.json(
      { error: "Stored canvas could not be loaded" },
      { status: 502 }
    );
  }

  let parsed: unknown;
  try {
    const text = await new Response(blobResult.stream).text();
    parsed = JSON.parse(text) as unknown;
  } catch {
    return jsonBadRequest("Stored canvas is not valid JSON");
  }

  if (!isCanvasPayload(parsed)) {
    return jsonBadRequest("Stored canvas has an invalid shape");
  }

  return Response.json(parsed);
}

/** PUT — upload canvas JSON to Vercel Blob and save the blob URL on the project. */
export async function PUT(request: Request, context: RouteContext) {
  const identity = await getEditorClerkIdentity();
  if (!identity) {
    return jsonUnauthorized();
  }

  const { projectId } = await context.params;

  const access = await getProjectAccessibleToEditor(projectId, identity);
  if (!access) {
    return jsonNotFound();
  }

  const token = getBlobToken();
  if (!token) {
    return Response.json(
      { error: "Canvas storage is not configured (BLOB_READ_WRITE_TOKEN)." },
      { status: 503 }
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return jsonBadRequest("Invalid JSON body");
  }

  if (!isCanvasPayload(body)) {
    return jsonBadRequest("Expected JSON with nodes and edges arrays");
  }

  const json = JSON.stringify(body);
  const pathname = `canvas/${projectId}.json`;

  const blob = await put(pathname, json, {
    access: "private",
    addRandomSuffix: false,
    allowOverwrite: true,
    token,
  });

  await prisma.project.update({
    where: { id: projectId },
    data: { canvasJsonPath: blob.url },
  });

  return Response.json({ ok: true as const, url: blob.url });
}
