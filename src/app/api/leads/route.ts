import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { leadSchema } from "@/lib/validation";
import { verifySessionToken, SESSION_COOKIE } from "@/lib/auth";

// POST /api/leads — public. Anyone can submit the landing page form.
export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = leadSchema.safeParse(body);
  if (!parsed.success) {
    // Return field-level errors so the client can highlight the right inputs.
    return NextResponse.json(
      { error: "Validation failed", fieldErrors: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  try {
    const lead = await prisma.lead.create({ data: parsed.data });
    return NextResponse.json({ id: lead.id }, { status: 201 });
  } catch (err) {
    console.error("Failed to create lead:", err);
    return NextResponse.json(
      { error: "Something went wrong saving your submission. Please try again." },
      { status: 500 }
    );
  }
}

// GET /api/leads — protected. Admin-only list with optional search + status filter.
// Auth is checked here too (not just in middleware) so this handler is safe
// to call directly/independently, e.g. from tests.
export async function GET(req: NextRequest) {
  const token = req.cookies.get(SESSION_COOKIE)?.value;
  const session = token ? await verifySessionToken(token) : null;
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q")?.trim();
  const status = searchParams.get("status");

  try {
    const leads = await prisma.lead.findMany({
      where: {
        AND: [
          status && ["NEW", "CONTACTED", "CLOSED"].includes(status)
            ? { status: status as "NEW" | "CONTACTED" | "CLOSED" }
            : {},
          q
            ? {
                OR: [
                  { name: { contains: q } },
                  { email: { contains: q } },
                  { message: { contains: q } },
                ],
              }
            : {},
        ],
      },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json({ leads });
  } catch (err) {
    console.error("Failed to fetch leads:", err);
    return NextResponse.json({ error: "Failed to load leads" }, { status: 500 });
  }
}
