import { NextResponse } from "next/server";
import { z } from "zod";
import { authenticateAdmin } from "@/lib/admin-auth";
import { ADMIN_SESSION_COOKIE } from "@/lib/admin-session";
import { markInvitationAccepted } from "@/lib/repository";

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

export async function POST(request: Request) {
  try {
    const payload = loginSchema.parse(await request.json());
    const result = await authenticateAdmin(payload.email, payload.password);
    await markInvitationAccepted(result.session.email);

    const response = NextResponse.json({
      message: "Login successful.",
      redirectTo: result.redirectTo,
      user: {
        email: result.session.email,
        fullName: result.session.fullName,
        role: result.session.role,
      },
    });

    response.cookies.set(ADMIN_SESSION_COOKIE, result.token, {
      httpOnly: true,
      sameSite: "lax",
      secure: true,
      path: "/",
      maxAge: 60 * 60 * 24 * 30,
    });

    return response;
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not sign in.";
    return NextResponse.json({ message }, { status: 400 });
  }
}
