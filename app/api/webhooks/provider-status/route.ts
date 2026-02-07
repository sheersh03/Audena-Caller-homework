// Webhook endpoint invoked asynchronously by the simulated external provider
// to update call status (mirrors real telephony provider callbacks).

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { StatusEnum } from "@/lib/validators";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);

  const callId = body?.callId as string | undefined;
  const providerId = body?.providerId as string | undefined;

  const statusParsed = StatusEnum.safeParse(body?.status);
  if (!callId || !statusParsed.success) {
    return NextResponse.json({ error: "callId and valid status are required" }, { status: 400 });
  }

  const existing = await prisma.call.findUnique({ where: { id: callId } });
  if (!existing) return NextResponse.json({ error: "Call not found" }, { status: 404 });

  if (existing.status === "COMPLETED" || existing.status === "FAILED") {
    return NextResponse.json({ ok: true, call: existing, idempotent: true });
  }

  const updated = await prisma.call.update({
    where: { id: callId },
    data: { status: statusParsed.data, providerId: providerId ?? existing.providerId },
  });

  return NextResponse.json({ ok: true, call: updated });
}
