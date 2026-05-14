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

function createPgPrismaClient(connectionString: string): PrismaClient {
  const pool = new Pool({
    connectionString: normalizePgConnectionString(connectionString),
  });
  const adapter = new PrismaPg(pool);
  return new PrismaClient({ adapter });
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

  return createPgPrismaClient(databaseUrl);
}

/** Bust the singleton when switching Accelerate vs direct driver or changing DATABASE_URL (Next.js dev keeps globals across HMR). */
function prismaEnvKey(): string {
  const url = process.env.DATABASE_URL ?? "";
  const accelerate =
    url.startsWith("prisma+postgres://") || url.startsWith("prisma://");
  return `${accelerate ? "accelerate" : "pg"}:${url}`;
}

const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
  prismaEnvKey?: string;
};

function getCachedPrisma(): PrismaClient {
  const key = prismaEnvKey();
  if (globalForPrisma.prismaEnvKey !== key || !globalForPrisma.prisma) {
    void globalForPrisma.prisma?.$disconnect().catch(() => {});
    globalForPrisma.prisma = createPrismaClient();
    globalForPrisma.prismaEnvKey = key;
  }
  return globalForPrisma.prisma;
}

/**
 * Default app client. In development this is a Proxy so `import { prisma }` always
 * resolves to a client matching the current `DATABASE_URL` (avoids stale globals).
 */
export const prisma: PrismaClient = new Proxy({} as PrismaClient, {
  get(_target, prop, receiver) {
    const client = getCachedPrisma();
    const value = Reflect.get(
      client,
      prop as keyof PrismaClient,
      receiver
    ) as unknown;
    if (typeof value === "function") {
      return (value as (...args: unknown[]) => unknown).bind(client);
    }
    return value;
  },
});

const globalForUnaccelerated = globalThis as unknown as {
  prismaUnaccelerated?: PrismaClient;
  unacceleratedKey?: string;
};

function unacceleratedDirectKey(directUrl: string): string {
  return `direct:${directUrl}`;
}

/**
 * Prisma Accelerate omits some delegates (e.g. `taskRun`) and nested relation
 * args on `project` updates. For those operations use a direct Postgres client.
 *
 * When `DATABASE_URL` is `postgres://`, returns the same logical client as {@link prisma}.
 * When it uses Accelerate (`prisma+postgres://` / `prisma://`), requires
 * `DIRECT_DATABASE_URL` with a normal `postgresql://` connection string.
 */
export function getUnacceleratedPrisma(): PrismaClient {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error("DATABASE_URL is not set");
  }

  const useAccelerate =
    databaseUrl.startsWith("prisma+postgres://") ||
    databaseUrl.startsWith("prisma://");

  if (!useAccelerate) {
    return getCachedPrisma();
  }

  const directUrl = process.env.DIRECT_DATABASE_URL;
  if (!directUrl || directUrl.trim().length === 0) {
    throw new Error(
      "DIRECT_DATABASE_URL is required when DATABASE_URL uses Prisma Accelerate (prisma+postgres:// or prisma://). " +
        "Use the direct PostgreSQL URL from Prisma Console or your database host."
    );
  }

  const trimmed = directUrl.trim();
  const key = unacceleratedDirectKey(trimmed);
  if (
    globalForUnaccelerated.unacceleratedKey !== key ||
    !globalForUnaccelerated.prismaUnaccelerated
  ) {
    void globalForUnaccelerated.prismaUnaccelerated?.$disconnect().catch(
      () => {}
    );
    globalForUnaccelerated.prismaUnaccelerated =
      createPgPrismaClient(trimmed);
    globalForUnaccelerated.unacceleratedKey = key;
  }
  return globalForUnaccelerated.prismaUnaccelerated;
}
