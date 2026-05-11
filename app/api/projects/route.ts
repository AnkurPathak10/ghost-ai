import { auth } from "@clerk/nextjs/server";

import {
  jsonBadRequest,
  jsonConflict,
  jsonUnauthorized,
} from "@/lib/api/http";
import { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";

function parseOptionalProjectId(
  record: Record<string, unknown>
): string | undefined | Response {
  if (!("id" in record)) {
    return undefined;
  }
  const raw = record.id;
  if (raw === undefined || raw === null) {
    return undefined;
  }
  if (typeof raw !== "string") {
    return jsonBadRequest("id must be a string");
  }
  const trimmed = raw.trim();
  if (trimmed === "") {
    return jsonBadRequest("id cannot be empty");
  }
  if (trimmed.length < 3 || trimmed.length > 120) {
    return jsonBadRequest("id must be between 3 and 120 characters");
  }
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(trimmed)) {
    return jsonBadRequest(
      "id must use lowercase letters, digits, and hyphens only"
    );
  }
  return trimmed;
}

export async function GET() {
  const { userId } = await auth();
  if (!userId) {
    return jsonUnauthorized();
  }

  const projects = await prisma.project.findMany({
    where: { ownerId: userId },
    orderBy: { createdAt: "desc" },
  });

  return Response.json(projects);
}

export async function POST(request: Request) {
  const { userId } = await auth();
  if (!userId) {
    return jsonUnauthorized();
  }

  let nameInput: string | undefined;
  let descriptionInput: string | undefined;
  let clientIdInput: string | undefined;

  const contentType = request.headers.get("content-type");
  if (contentType?.includes("application/json")) {
    try {
      const body: unknown = await request.json();
      if (body && typeof body === "object") {
        const record = body as Record<string, unknown>;
        const idParsed = parseOptionalProjectId(record);
        if (idParsed instanceof Response) {
          return idParsed;
        }
        clientIdInput = idParsed;

        if ("name" in record) {
          if (record.name === undefined || record.name === null) {
            nameInput = undefined;
          } else if (typeof record.name === "string") {
            nameInput = record.name;
          } else {
            return jsonBadRequest("name must be a string");
          }
        }
        if ("description" in record) {
          if (record.description === undefined || record.description === null) {
            descriptionInput = undefined;
          } else if (typeof record.description === "string") {
            descriptionInput = record.description;
          } else {
            return jsonBadRequest("description must be a string");
          }
        }
      }
    } catch {
      return jsonBadRequest("Invalid JSON body");
    }
  }

  const name =
    nameInput !== undefined && nameInput.trim() !== ""
      ? nameInput.trim()
      : "Untitled Project";

  try {
    const project = await prisma.project.create({
      data: {
        ...(clientIdInput !== undefined ? { id: clientIdInput } : {}),
        ownerId: userId,
        name,
        description: descriptionInput,
      },
    });

    return Response.json(project, { status: 201 });
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      return jsonConflict("A project with this id already exists");
    }
    throw error;
  }
}
