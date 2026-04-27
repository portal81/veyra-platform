import { NextResponse } from "next/server";
import { adminLocaleCookieName, isAdminLocale } from "@/lib/admin-locale";

export async function POST(request: Request) {
  const payload = (await request.json().catch(() => null)) as { locale?: string } | null;
  const locale = payload?.locale;

  if (!isAdminLocale(locale)) {
    return NextResponse.json({ message: "Unsupported locale." }, { status: 400 });
  }

  const response = NextResponse.json({ locale });
  response.cookies.set(adminLocaleCookieName, locale, {
    path: "/",
    sameSite: "lax",
    httpOnly: false,
    maxAge: 60 * 60 * 24 * 365,
  });

  return response;
}
