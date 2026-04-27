import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdminRoute } from "@/lib/admin-route";
import { deleteLeadCrm, updateLeadCrm } from "@/lib/repository";

const updateLeadSchema = z.object({
  stage: z
    .enum([
      "new",
      "contacted",
      "qualified",
      "site_visit",
      "negotiation",
      "closed_won",
      "closed_lost",
    ])
    .optional(),
  priority: z.enum(["low", "medium", "high"]).optional(),
  assignedTo: z.string().optional(),
  note: z.string().trim().min(2).optional(),
  lostReason: z.string().trim().min(2).optional(),
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
      z.null(),
    ])
    .optional(),
  deliveryReadiness: z
    .union([
      z.object({
        status: z.enum(["not_started", "needs_assignment", "ready_for_delivery", "in_progress", "blocked", "completed"]),
        siteState: z.enum(["existing", "under_construction", "not_started"]),
        checklist: z.object({
          teamAssigned: z.boolean(),
          projectLinked: z.boolean(),
          commercialClosed: z.boolean(),
          docsReady: z.boolean(),
        }),
        note: z.string().trim().optional(),
      }),
      z.null(),
    ])
    .optional(),
  siteTracking: z
    .union([
      z.object({
        siteName: z.string().trim().optional(),
        progressPercent: z.number().min(0).max(100),
        currentPhase: z.string().trim().min(2),
        lastUpdate: z.string().trim().min(2),
        blocker: z.string().trim().optional(),
        updatedBy: z.string().trim().optional(),
      }),
      z.null(),
    ])
    .optional(),
  caseFiles: z
    .array(
      z.object({
        id: z.string().trim().min(1),
        displayName: z.string().trim().min(1),
        documentType: z.enum([
          "contract",
          "quotation",
          "invoice",
          "receipt",
          "drawing",
          "site_photo",
          "legal_doc",
          "delivery_report",
          "other",
        ]),
        storagePath: z.string().trim().min(1),
        approvalStatus: z.enum(["draft", "submitted", "approved", "rejected"]),
        uploadedBy: z.string().trim().optional(),
        linkedTo: z.enum(["client_case", "project", "service", "site"]).optional(),
        createdAt: z.string().trim().min(1),
      }),
    )
    .optional(),
  caseAssignments: z
    .array(
      z.object({
        role: z.enum(["sales", "operations", "engineer", "worker", "lawyer", "accountant", "marketer"]),
        assignee: z.string().optional(),
        status: z.enum(["unassigned", "assigned"]).default("unassigned"),
      }),
    )
    .optional(),
  roleTasks: z
    .array(
      z.object({
        id: z.string().trim().min(1),
        role: z.enum(["sales", "operations", "engineer", "worker", "lawyer", "accountant", "marketer"]),
        title: z.string().trim().min(1),
        status: z.enum(["todo", "in_progress", "blocked", "done"]),
        note: z.string().trim().optional(),
        linkedTo: z.enum(["client_case", "project", "service", "site", "document"]).optional(),
        linkedItemId: z.string().trim().optional(),
        linkedItemLabel: z.string().trim().optional(),
        updatedAt: z.string().trim().min(1),
      }),
    )
    .optional(),
});

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function PATCH(request: Request, context: RouteContext) {
  const guard = await requireAdminRoute("leads.manage");
  if (guard.response) return guard.response;

  try {
    const payload = updateLeadSchema.parse(await request.json());
    const { id } = await context.params;
    const lead = await updateLeadCrm(id, payload);

    return NextResponse.json({ lead, message: "Lead updated successfully." });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not update lead.";
    return NextResponse.json({ message }, { status: 400 });
  }
}

export async function DELETE(_: Request, context: RouteContext) {
  const guard = await requireAdminRoute("leads.manage");
  if (guard.response) return guard.response;

  try {
    const { id } = await context.params;
    await deleteLeadCrm(id);
    return NextResponse.json({ id, message: "Lead deleted successfully." });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not delete lead.";
    return NextResponse.json({ message }, { status: 400 });
  }
}
