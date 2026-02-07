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

export async function GET(req: NextRequest) {
  if (skipBuildPhase()) return NextResponse.json(null, { status: 204 });
  requireAuth(req);
  const { prisma } = await import("@/lib/db");
  const calls = await prisma.call.findMany({ orderBy: { createdAt: "desc" }, take: 100 });
  return NextResponse.json({ calls });
}

export async function POST(req: NextRequest) {
  if (skipBuildPhase()) return NextResponse.json(null, { status: 204 });
  requireAuth(req);

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
}

export async function DELETE(req: NextRequest) {
  if (skipBuildPhase()) return NextResponse.json(null, { status: 204 });
  requireAuth(req);
  const { prisma } = await import("@/lib/db");
  await prisma.call.deleteMany();
  return NextResponse.json({ success: true });
}
