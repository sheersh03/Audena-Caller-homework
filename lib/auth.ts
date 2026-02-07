import { NextRequest } from "next/server";

export function requireAuth(req: NextRequest) {
  const token = process.env.API_TOKEN?.trim();
  if (!token) return;

  const header = req.headers.get("authorization") || "";
  const m = header.match(/^Bearer\s+(.+)$/i);
  const incoming = m?.[1]?.trim();

  if (!incoming || incoming !== token) {
    const err = new Error("Unauthorized");
    // @ts-expect-error attach status
    err.status = 401;
    throw err;
  }
}
