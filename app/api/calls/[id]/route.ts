import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import { UpdateStatusSchema } from "@/lib/validators";

export const runtime = "nodejs";

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  requireAuth(req);

  const json = await req.json().catch(() => null);
  const parsed = UpdateStatusSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input", details: parsed.error.flatten() }, { status: 400 });
  }

  const existing = await prisma.call.findUnique({ where: { id: params.id } });
  if (!existing) return NextResponse.json({ error: "Call not found" }, { status: 404 });

  const updated = await prisma.call.update({ where: { id: params.id }, data: { status: parsed.data.status } });
  return NextResponse.json({ call: updated });
}
