import { PrismaClient } from "../generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { withAccelerate } from "@prisma/extension-accelerate";
import { Pool } from "pg";

/**
 * pg warns when sslmode is require/prefer/verify-ca because future pg versions
 * will treat them differently; explicit verify-full preserves current behavior.
 */
function normalizePgConnectionString(connectionString: string): string {
  try {
    const url = new URL(connectionString);
    if (url.protocol !== "postgres:" && url.protocol !== "postgresql:") {
      return connectionString;
    }
    const mode = url.searchParams.get("sslmode")?.toLowerCase();
    if (
      mode === "require" ||
      mode === "prefer" ||
      mode === "verify-ca"
    ) {
      url.searchParams.set("sslmode", "verify-full");
      return url.toString();
    }
    return connectionString;
  } catch {
    return connectionString;
  }
}

function createPrismaClient(): PrismaClient {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error("DATABASE_URL is not set");
  }

  const useAccelerate =
    databaseUrl.startsWith("prisma+postgres://") ||
    databaseUrl.startsWith("prisma://");

  if (useAccelerate) {
    const extended = new PrismaClient({
      accelerateUrl: databaseUrl,
    }).$extends(withAccelerate());
    return extended as unknown as PrismaClient;
  }

  const pool = new Pool({
    connectionString: normalizePgConnectionString(databaseUrl),
  });
  const adapter = new PrismaPg(pool);
  return new PrismaClient({ adapter });
}

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma: PrismaClient =
  process.env.NODE_ENV !== "production"
    ? (globalForPrisma.prisma ??= createPrismaClient())
    : createPrismaClient();
