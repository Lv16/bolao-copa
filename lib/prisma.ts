import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

const databaseUrl = process.env.DATABASE_URL;
const isNextBuild = process.env.NEXT_PHASE === "phase-production-build";

if (!databaseUrl && !isNextBuild) {
  throw new Error("DATABASE_URL must be configured for Prisma.");
}

const fallbackBuildDatabaseUrl =
  "postgresql://user:password@localhost:5432/database";

export function createPrismaAdapter(url: string) {
  return new PrismaPg(url);
}

const adapter = createPrismaAdapter(databaseUrl ?? fallbackBuildDatabaseUrl);

const prismaClient: PrismaClient =
  globalForPrisma.prisma ??
  new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === "production" ? [] : ["query"],
  });

export const prisma = prismaClient;

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
