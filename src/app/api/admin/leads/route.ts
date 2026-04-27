import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdminRoute } from "@/lib/admin-route";
import { createLead, getLeads } from "@/lib/repository";

const createLeadSchema = z.object({
  fullName: z.string().trim().min(2),
  phone: z.string().trim().min(6),
  email: z.string().trim().email().optional().or(z.literal("")),
  service: z.enum(["Project Visit", "Finishing Quote", "Smart Home Setup"]),
  source: z.string().trim().optional(),
  assignedTo: z.string().trim().optional(),
  budget: z.coerce.number().positive().optional(),
  message: z.string().trim().optional(),
  linkedEntity: z
    .union([
      z.object({
        kind: z.literal("project"),
        id: z.string().trim().min(1),
        label: z.string().trim().min(1),
      }),
      z.object({
        kind: z.literal("service"),
        id: z.string().trim().min(1),
        label: z.string().trim().min(1),
        serviceType: z.string().trim().optional(),
      }),
    ])
    .optional(),
});

export async function GET() {
  const guard = await requireAdminRoute("leads.view");
  if (guard.response) return guard.response;

  const leads = await getLeads();
  return NextResponse.json({ leads });
}

export async function POST(request: Request) {
  const guard = await requireAdminRoute("leads.manage");
  if (guard.response) return guard.response;

  try {
    const payload = createLeadSchema.parse(await request.json());
    const result = await createLead({
      fullName: payload.fullName,
      phone: payload.phone,
      email: payload.email || undefined,
      service: payload.service,
      source: payload.source || undefined,
      assignedTo: payload.assignedTo || undefined,
      budget: payload.budget,
      message: payload.message || undefined,
      linkedEntity: payload.linkedEntity,
    });

    return NextResponse.json({
      lead: result.record,
      message:
        result.mode === "supabase"
          ? "Client case created successfully."
          : "Client case created in demo mode.",
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not create client case.";
    return NextResponse.json({ message }, { status: 400 });
  }
}
