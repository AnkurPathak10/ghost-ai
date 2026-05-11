import { auth } from "@clerk/nextjs/server";

import {
  jsonBadRequest,
  jsonForbidden,
  jsonNotFound,
  jsonUnauthorized,
} from "@/lib/api/http";
import { prisma } from "@/lib/prisma";

type RouteContext = { params: Promise<{ projectId: string }> };

export async function PATCH(request: Request, context: RouteContext) {
  const { userId } = await auth();
  if (!userId) {
    return jsonUnauthorized();
  }

  const { projectId } = await context.params;

  let name: string;
  try {
    const body: unknown = await request.json();
    if (!body || typeof body !== "object" || !("name" in body)) {
      return jsonBadRequest("name is required");
    }
    const record = body as Record<string, unknown>;
    if (typeof record.name !== "string") {
      return jsonBadRequest("name must be a string");
    }
    name = record.name.trim();
  } catch {
    return jsonBadRequest("Invalid JSON body");
  }

  if (name === "") {
    return jsonBadRequest("name cannot be empty");
  }

  const existing = await prisma.project.findUnique({
    where: { id: projectId },
  });

  if (!existing) {
    return jsonNotFound();
  }

  if (existing.ownerId !== userId) {
    return jsonForbidden();
  }

  const updated = await prisma.project.update({
    where: { id: projectId },
    data: { name },
  });

  return Response.json(updated);
}

export async function DELETE(_request: Request, context: RouteContext) {
  const { userId } = await auth();
  if (!userId) {
    return jsonUnauthorized();
  }

  const { projectId } = await context.params;

  const existing = await prisma.project.findUnique({
    where: { id: projectId },
  });

  if (!existing) {
    return jsonNotFound();
  }

  if (existing.ownerId !== userId) {
    return jsonForbidden();
  }

  await prisma.project.delete({
    where: { id: projectId },
  });

  return new Response(null, { status: 204 });
}
