import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/admin-auth";
import type { SiteSettings } from "@/lib/types";

// In-memory draft store (resets on server restart — fine for preview)
let previewDraft: SiteSettings | null = null;
let previewToken: string | null = null;
let previewExpiresAt: number = 0;

const PREVIEW_TTL_MS = 5 * 60 * 1000; // 5 minutes

// POST /api/admin/preview — admin pushes draft settings
export async function POST(request: Request) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { settings } = (await request.json()) as { settings: SiteSettings };
  previewDraft = settings;
  previewToken = `preview_${crypto.randomUUID()}`;
  previewExpiresAt = Date.now() + PREVIEW_TTL_MS;

  return NextResponse.json({ token: previewToken });
}

// GET /api/admin/preview?token=xxx — public site iframe fetches draft
// Token acts as the auth secret — no session required (token is ephemeral)
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const token = searchParams.get("token");

  if (
    !token ||
    token !== previewToken ||
    !previewDraft ||
    Date.now() > previewExpiresAt
  ) {
    return NextResponse.json({ error: "Invalid or expired preview token" }, { status: 404 });
  }

  // Allow iframe on cross-origin to read this
  return NextResponse.json(
    { settings: previewDraft },
    {
      headers: {
        "Access-Control-Allow-Origin": process.env.NEXT_PUBLIC_PUBLIC_SITE_URL ?? "*",
        "Access-Control-Allow-Methods": "GET",
      },
    },
  );
}

