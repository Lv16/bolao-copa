import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { PrismaPg } from "@prisma/adapter-pg";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

const databaseUrl = process.env.DATABASE_URL ?? "file:./dev.db";

function isSqliteUrl(url: string) {
  return url.startsWith("file:") || url.includes("sqlite") || url.includes("sqlite3");
}

export function createPrismaAdapter(url: string) {
  if (isSqliteUrl(url)) {
    return new PrismaBetterSqlite3({ url });
  }

  return new PrismaPg(url);
}

let prismaClient: PrismaClient;

const adapter = createPrismaAdapter(databaseUrl);
prismaClient =
  globalForPrisma.prisma ??
  new PrismaClient({
    adapter,
    log: ["query"],
  });

export const prisma = prismaClient;

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
