import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdminRoute } from "@/lib/admin-route";
import { ALL_PERMISSION_KEYS } from "@/lib/permissions";
import { deleteInvitation, resendInvitation, updateInvitationAccess } from "@/lib/repository";
import type { PermissionKey } from "@/lib/types";

const accessSchema = z.object({
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
  accessMode: z.enum(["role", "custom"]),
  permissions: z.array(z.enum(ALL_PERMISSION_KEYS as [string, ...string[]])).default([]),
});

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const guard = await requireAdminRoute("users.manage_roles");
  if (guard.response) return guard.response;

  try {
    const payload = accessSchema.parse(await request.json());
    const { id } = await context.params;
    const invitation = await updateInvitationAccess(id, {
      ...payload,
      permissions: payload.permissions as PermissionKey[],
    });
    return NextResponse.json({ invitation, message: "Invitation access updated successfully." });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not update invitation access.";
    return NextResponse.json({ message }, { status: 400 });
  }
}

export async function POST(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const guard = await requireAdminRoute("users.invite");
  if (guard.response) return guard.response;

  try {
    const { id } = await context.params;
    const invitation = await resendInvitation(id);
    return NextResponse.json({
      invitation,
      message: "Invitation resent successfully.",
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not resend invitation.";
    return NextResponse.json({ message }, { status: 400 });
  }
}

export async function DELETE(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const guard = await requireAdminRoute("users.manage_roles");
  if (guard.response) return guard.response;

  try {
    const { id } = await context.params;
    await deleteInvitation(id);
    return NextResponse.json({ id, message: "Invitation deleted successfully." });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not delete invitation.";
    return NextResponse.json({ message }, { status: 400 });
  }
}
