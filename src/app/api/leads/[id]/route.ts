import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { statusUpdateSchema } from "@/lib/validation";
import { verifySessionToken, SESSION_COOKIE } from "@/lib/auth";

// PATCH /api/leads/:id — protected. Updates a lead's status (New/Contacted/Closed).
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const token = req.cookies.get(SESSION_COOKIE)?.value;
  const session = token ? await verifySessionToken(token) : null;
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = statusUpdateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid status value" },
      { status: 400 }
    );
  }

  try {
    const lead = await prisma.lead.update({
      where: { id: params.id },
      data: { status: parsed.data.status },
    });
    return NextResponse.json({ lead });
  } catch (err) {
    console.error("Failed to update lead status:", err);
    return NextResponse.json(
      { error: "Lead not found or update failed" },
      { status: 404 }
    );
  }
}
