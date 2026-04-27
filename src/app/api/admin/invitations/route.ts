import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdminRoute } from "@/lib/admin-route";
import { ALL_PERMISSION_KEYS } from "@/lib/permissions";
import { createInvitation, getInvitations } from "@/lib/repository";
import type { PermissionKey } from "@/lib/types";

const inviteSchema = z.object({
  email: z.string().email(),
  role: z.enum([
    "owner",
    "admin",
    "editor",
    "operations",
    "sales",
    "engineer",
    "worker",
    "lawyer",
    "accountant",
    "marketer",
    "viewer",
  ]),
  accessMode: z.enum(["role", "custom"]).default("role"),
  permissions: z.array(z.enum(ALL_PERMISSION_KEYS as [string, ...string[]])).default([]),
});

export async function GET() {
  const guard = await requireAdminRoute("users.view");
  if (guard.response) return guard.response;
  const invitations = await getInvitations();
  return NextResponse.json({ invitations });
}

export async function POST(request: Request) {
  const guard = await requireAdminRoute("users.invite");
  if (guard.response) return guard.response;

  try {
    const payload = inviteSchema.parse(await request.json());
    const result = await createInvitation(
      payload.email,
      payload.role,
      payload.permissions as PermissionKey[],
      "owner@veyra.com",
      payload.accessMode,
    );

    return NextResponse.json({
      invitation: result.record,
      message:
        result.mode === "supabase"
          ? "Invitation sent and recorded successfully."
          : "Invitation stored in demo mode. Connect SMTP/Auth for live email delivery.",
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not send invitation.";
    return NextResponse.json({ message }, { status: 400 });
  }
}
