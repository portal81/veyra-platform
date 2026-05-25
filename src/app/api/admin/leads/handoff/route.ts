import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdminRoute } from "@/lib/admin-route";
import { createHandoff, resolveHandoff } from "@/lib/repository";

const createSchema = z.object({
  leadId: z.string().min(1),
  fromUserId: z.string().min(1),
  toUserId: z.string().min(1),
  note: z.string().optional().default(""),
});

const resolveSchema = z.object({
  activityId: z.string().min(1),
  accepted: z.boolean(),
});

export async function POST(request: Request) {
  const guard = await requireAdminRoute("leads.manage");
  if (guard.response) return guard.response;

  try {
    const payload = createSchema.parse(await request.json());
    const result = await createHandoff(payload.leadId, payload.fromUserId, payload.toUserId, payload.note);
    return NextResponse.json(result);
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: err.issues }, { status: 422 });
    }
    if (err instanceof Error) {
      return NextResponse.json({ error: err.message }, { status: 500 });
    }
    return NextResponse.json({ error: "Unknown error" }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  const guard = await requireAdminRoute("leads.manage");
  if (guard.response) return guard.response;

  try {
    const payload = resolveSchema.parse(await request.json());
    await resolveHandoff(payload.activityId, payload.accepted);
    return NextResponse.json({ success: true });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: err.issues }, { status: 422 });
    }
    if (err instanceof Error) {
      return NextResponse.json({ error: err.message }, { status: 500 });
    }
    return NextResponse.json({ error: "Unknown error" }, { status: 500 });
  }
}
