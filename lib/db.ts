import { PrismaClient } from "@prisma/client";
import { mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";

declare global {
  // eslint-disable-next-line no-var
  var prisma: PrismaClient | undefined;
}

const databaseUrl = process.env.DATABASE_URL;
if (databaseUrl?.startsWith("file:")) {
  const filePart = databaseUrl.slice("file:".length).split("?")[0];
  const absolutePath = resolve(process.cwd(), filePart);
  mkdirSync(dirname(absolutePath), { recursive: true });
}

export const prisma =
  global.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") global.prisma = prisma;
