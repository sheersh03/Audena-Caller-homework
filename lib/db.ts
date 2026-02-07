import { PrismaClient } from "@prisma/client";
import { PrismaLibSQL } from "@prisma/adapter-libsql";
import { createClient } from "@libsql/client";
import { mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";

declare global {
  // eslint-disable-next-line no-var
  var prisma: PrismaClient | undefined;
}

const logLevel = (process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"]) as ("warn" | "error")[];

function createPrismaClient(): PrismaClient {
  const tursoUrl = process.env.TURSO_DATABASE_URL;
  const tursoToken = process.env.TURSO_AUTH_TOKEN;

  if (tursoUrl) {
    // Turso (serverless SQLite) – use libSQL client + adapter (adapter expects client instance)
    const libsql = createClient({
      url: tursoUrl,
      authToken: tursoToken ?? undefined,
    });
    const adapter = new PrismaLibSQL(libsql);
    return new PrismaClient({ adapter, log: logLevel } as never);
  }

  // Local SQLite (file) – only touch filesystem when not on serverless
  const databaseUrl = process.env.DATABASE_URL;
  const isServerless = process.env.VERCEL || process.env.NETLIFY;
  if (databaseUrl?.startsWith("file:") && !isServerless) {
    const filePart = databaseUrl.slice("file:".length).split("?")[0];
    const absolutePath = resolve(process.cwd(), filePart);
    mkdirSync(dirname(absolutePath), { recursive: true });
    process.env.DATABASE_URL = `file:${absolutePath}`;
  }

  return new PrismaClient({ log: logLevel });
}

export const prisma = global.prisma ?? createPrismaClient();
if (process.env.NODE_ENV !== "production") global.prisma = prisma;
