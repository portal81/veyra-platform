import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/admin-auth";

export async function GET() {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ user: null }, { status: 401 });
  }

  return NextResponse.json({
    user: {
      userId: session.userId,
      email: session.email,
      fullName: session.fullName,
      role: session.role,
      permissions: session.permissions,
      accessMode: session.accessMode,
    },
  });
}
