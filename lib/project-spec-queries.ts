import { Prisma } from "@/generated/prisma/client";
import type { PrismaClient } from "@/generated/prisma/client";

/** Metadata reads for ProjectSpec — use raw SQL so routes work even when the Prisma delegate is unavailable (e.g. some Accelerate / bundler combinations). */

export async function listProjectSpecMeta(
  db: PrismaClient,
  projectId: string
): Promise<{ id: string; createdAt: Date }[]> {
  return db.$queryRaw<
    { id: string; createdAt: Date }[]
  >(Prisma.sql`
    SELECT id, "createdAt"
    FROM "ProjectSpec"
    WHERE "projectId" = ${projectId}
    ORDER BY "createdAt" DESC
  `);
}

export async function getProjectSpecFilePath(
  db: PrismaClient,
  projectId: string,
  specId: string
): Promise<string | null> {
  const row = await getProjectSpecRecord(db, projectId, specId);
  return row?.filePath ?? null;
}

export async function getProjectSpecRecord(
  db: PrismaClient,
  projectId: string,
  specId: string
): Promise<{ filePath: string; createdAt: Date } | null> {
  const rows = await db.$queryRaw<{ filePath: string; createdAt: Date }[]>(
    Prisma.sql`
    SELECT "filePath", "createdAt"
    FROM "ProjectSpec"
    WHERE id = ${specId} AND "projectId" = ${projectId}
    LIMIT 1
  `
  );
  const row = rows[0];
  const fp = row?.filePath?.trim();
  if (!fp || fp.length === 0 || !row.createdAt) return null;
  return { filePath: fp, createdAt: row.createdAt };
}
