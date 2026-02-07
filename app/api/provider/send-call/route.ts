// This endpoint simulates an external telephony provider (e.g. Twilio or an AI voice service).
// It is intentionally implemented inside this repo for simplicity, but represents a separate system.

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import { pickOutcome, pickProviderDelayMs } from "@/lib/provider";
import { getBaseUrl } from "@/lib/url";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  requireAuth(req);

  const body = await req.json().catch(() => null);
  const callId = body?.callId as string | undefined;

  if (!callId) return NextResponse.json({ error: "callId is required" }, { status: 400 });

  const call = await prisma.call.findUnique({ where: { id: callId } });
  if (!call) return NextResponse.json({ error: "Call not found" }, { status: 404 });

  const providerId = `prov_${Math.random().toString(16).slice(2)}${Date.now().toString(16)}`;
  await prisma.call.update({ where: { id: callId }, data: { providerId } });

  const delay = pickProviderDelayMs();
  const outcome = pickOutcome();
  const baseUrl = getBaseUrl(req);

  setTimeout(() => {
    fetch(`${baseUrl}/api/webhooks/provider-status`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ callId, providerId, status: outcome }),
    }).catch(() => {});
  }, delay);

  return NextResponse.json({ providerId, scheduledInMs: delay });
}
