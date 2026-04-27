import { NextResponse } from "next/server";
import { requireAdminRoute } from "@/lib/admin-route";
import { getSiteSettings, updateSiteSettings } from "@/lib/repository";
import type { SiteSettings } from "@/lib/types";

export async function GET() {
  const guard = await requireAdminRoute("settings.manage");
  if (guard.response) return guard.response;
  const settings = await getSiteSettings();
  return NextResponse.json(settings);
}

export async function PATCH(request: Request) {
  const guard = await requireAdminRoute("settings.manage");
  if (guard.response) return guard.response;

  try {
    const payload = (await request.json()) as SiteSettings;
    const settings = await updateSiteSettings(payload);
    return NextResponse.json({
      message: "Settings updated successfully.",
      settings,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to update settings.";
    return NextResponse.json({ message }, { status: 400 });
  }
}
