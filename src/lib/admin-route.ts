import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/admin-auth";
import { hasPermission } from "@/lib/admin-session";
import type { PermissionKey } from "@/lib/types";

export async function requireAdminRoute(permission?: PermissionKey) {
  const session = await getAdminSession();
  if (!session) {
    return {
      session: null,
      response: NextResponse.json({ message: "Unauthorized." }, { status: 401 }),
    };
  }

  if (permission && !hasPermission(session, permission)) {
    return {
      session,
      response: NextResponse.json({ message: "Forbidden." }, { status: 403 }),
    };
  }

  return { session, response: null as NextResponse | null };
}
