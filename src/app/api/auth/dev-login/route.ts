import { NextResponse } from "next/server";
import { z } from "zod";
import { devAuthenticateAdmin, isDevMode } from "@/lib/admin-auth";
import { ADMIN_SESSION_COOKIE } from "@/lib/admin-session";

const schema = z.object({
  identifier: z.string().trim().min(1, "Name is required."),
});

export async function POST(request: Request) {
  if (!isDevMode()) {
    return NextResponse.json({ message: "Dev mode is not enabled." }, { status: 403 });
  }

  try {
    const payload = schema.parse(await request.json());
    const result = await devAuthenticateAdmin(payload.identifier);

    const response = NextResponse.json({
      message: "Dev login successful.",
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
  } catch {
    return NextResponse.json({ message: "Dev login failed." }, { status: 400 });
  }
}
