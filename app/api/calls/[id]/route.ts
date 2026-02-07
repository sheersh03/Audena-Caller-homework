import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { UpdateStatusSchema } from "@/lib/validators";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  // Avoid running auth/DB during Next.js build when it probes this route
  if (process.env.NEXT_PHASE === "phase-production-build") {
    return NextResponse.json(null, { status: 204 });
  }
  requireAuth(req);
  const { id } = params;

  const json = await req.json().catch(() => null);
  const parsed = UpdateStatusSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input", details: parsed.error.flatten() }, { status: 400 });
  }

  const { prisma } = await import("@/lib/db");
  const existing = await prisma.call.findUnique({ where: { id } });
  if (!existing) return NextResponse.json({ error: "Call not found" }, { status: 404 });

  const updated = await prisma.call.update({ where: { id }, data: { status: parsed.data.status } });
  return NextResponse.json({ call: updated });
}
