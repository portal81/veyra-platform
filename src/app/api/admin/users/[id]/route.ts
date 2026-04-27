import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdminRoute } from "@/lib/admin-route";
import { ALL_PERMISSION_KEYS } from "@/lib/permissions";
import { deleteTeamUser, updateTeamUserAccess } from "@/lib/repository";
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
    const user = await updateTeamUserAccess(id, {
      ...payload,
      permissions: payload.permissions as PermissionKey[],
    });
    return NextResponse.json({ user, message: "User access updated successfully." });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not update user access.";
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
    await deleteTeamUser(id);
    return NextResponse.json({ id, message: "User deleted successfully." });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not delete user.";
    return NextResponse.json({ message }, { status: 400 });
  }
}
