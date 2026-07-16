import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdminRoute } from "@/lib/admin-route";
import { addLeadDiscussionComment } from "@/lib/repository";

const schema = z.object({
  leadId: z.string().min(1),
  body: z.string().min(1),
  mentions: z.array(z.string()).optional(),
});

export async function POST(request: Request) {
  const guard = await requireAdminRoute("leads.view");
  if (guard.response) return guard.response;

  try {
    const payload = schema.parse(await request.json());
      const result = await addLeadDiscussionComment(
        payload.leadId,
        payload.body,
        guard.session!.email,
        payload.mentions,
      );
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
