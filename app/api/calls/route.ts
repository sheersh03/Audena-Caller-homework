// Trigger the external provider simulation asynchronously.
// In a real system this would be an server call to a third-party service.

import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { CreateCallSchema } from "@/lib/validators";
import { getBaseUrl } from "@/lib/url";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function skipBuildPhase() {
  return process.env.NEXT_PHASE === "phase-production-build";
}

function hasDatabase() {
  return !!(process.env.DATABASE_URL || process.env.TURSO_DATABASE_URL);
}

function isAuthError(err: unknown): err is Error & { status?: number } {
  return err instanceof Error && (err as Error & { status?: number }).status === 401;
}

function isDbError(err: unknown): boolean {
  if (!err || typeof err !== "object") return false;
  const name = (err as Error).name ?? "";
  const msg = String((err as Error).message ?? "");
  return (
    "code" in err ||
    name.includes("Prisma") ||
    msg.includes("Prisma") ||
    msg.includes("database") ||
    msg.includes("DATABASE_URL")
  );
}

function handleApiError(err: unknown, context: { route: string; defaultMessage: string }) {
  if (isAuthError(err)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (isDbError(err)) {
    return NextResponse.json(
      {
        error:
          "Database unavailable. Set DATABASE_URL (SQLite/Postgres) or TURSO_DATABASE_URL + TURSO_AUTH_TOKEN (Turso).",
        ...(context.route === "GET" ? { calls: [] } : {}),
      },
      { status: 503 }
    );
  }
  console.error(`[${context.route}]`, err);
  const body: { error: string; calls?: unknown[] } = { error: context.defaultMessage };
  if (context.route === "GET") body.calls = [];
  return NextResponse.json(body, { status: 500 });
}

export async function GET(req: NextRequest) {
  if (skipBuildPhase()) return NextResponse.json(null, { status: 204 });
  try {
    requireAuth(req);
    if (!hasDatabase()) {
      return NextResponse.json(
        { error: "Database not configured. Set DATABASE_URL or TURSO_DATABASE_URL (see TURSO.md).", calls: [] },
        { status: 503 }
      );
    }
    const { prisma } = await import("@/lib/db");
    const calls = await prisma.call.findMany({ orderBy: { createdAt: "desc" }, take: 100 });
    return NextResponse.json({ calls });
  } catch (err) {
    return handleApiError(err, { route: "GET", defaultMessage: "Failed to load calls" });
  }
}

export async function POST(req: NextRequest) {
  if (skipBuildPhase()) return NextResponse.json(null, { status: 204 });
  try {
    requireAuth(req);
    if (!hasDatabase()) {
      return NextResponse.json(
        { error: "Database not configured. Set DATABASE_URL or TURSO_DATABASE_URL (see TURSO.md)." },
        { status: 503 }
      );
    }

    const json = await req.json().catch(() => null);
    const parsed = CreateCallSchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid input", details: parsed.error.flatten() }, { status: 400 });
    }

    const { customerName, phoneNumber, workflow, scheduledAt } = parsed.data;
    const parsedScheduledAt = scheduledAt ? new Date(scheduledAt) : null;
    const hasValidSchedule = parsedScheduledAt && !Number.isNaN(parsedScheduledAt.getTime());

    const { prisma } = await import("@/lib/db");
    const call = await prisma.call.create({
      data: {
        customerName: customerName.trim(),
        phoneNumber: phoneNumber.trim(),
        workflow,
        status: "PENDING",
        scheduledAt: hasValidSchedule ? parsedScheduledAt : undefined,
      },
    });

    const baseUrl = getBaseUrl(req);
    const scheduleDelayMs =
      hasValidSchedule && parsedScheduledAt ? Math.max(parsedScheduledAt.getTime() - Date.now(), 0) : 0;

    const authToken = process.env.API_TOKEN ?? process.env.NEXT_PUBLIC_API_TOKEN ?? "";
    const triggerProvider = () => {
      fetch(`${baseUrl}/api/provider/send-call`, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({ callId: call.id, phoneNumber: call.phoneNumber, workflow: call.workflow }),
      }).catch(() => {});
    };

    setTimeout(triggerProvider, scheduleDelayMs);

    return NextResponse.json({ call }, { status: 201 });
  } catch (err) {
    return handleApiError(err, { route: "POST", defaultMessage: "Failed to create call" });
  }
}

export async function DELETE(req: NextRequest) {
  if (skipBuildPhase()) return NextResponse.json(null, { status: 204 });
  try {
    requireAuth(req);
    if (!hasDatabase()) {
      return NextResponse.json({ error: "Database not configured." }, { status: 503 });
    }
    const { prisma } = await import("@/lib/db");
    await prisma.call.deleteMany();
    return NextResponse.json({ success: true });
  } catch (err) {
    return handleApiError(err, { route: "DELETE", defaultMessage: "Failed to clear calls" });
  }
}
