import { NextResponse } from "next/server";
import { requireAdminRoute } from "@/lib/admin-route";
import { getSiteSettings, updateSiteSettings } from "@/lib/repository";
import type { SiteSettings } from "@/lib/types";

export async function GET() {
  const guard = await requireAdminRoute("settings.manage");
  if (guard.response) return guard.response;
  const settings = await getSiteSettings();

  const safeSettings = {
    ...settings,
    hazemAi: {
      ...settings.hazemAi,
      apiKey: undefined,
    },
  };

  return NextResponse.json(safeSettings);
}

export async function PATCH(request: Request) {
  const guard = await requireAdminRoute("settings.manage");
  if (guard.response) return guard.response;

  try {
    const body = await request.json();
    if (!body || typeof body !== "object" || Array.isArray(body)) {
      return NextResponse.json({ message: "Invalid settings payload." }, { status: 400 });
    }

    const disallowedKeys = ["id", "createdAt", "updatedAt"];
    for (const key of disallowedKeys) {
      if (key in body) {
        return NextResponse.json({ message: `Field "${key}" cannot be set directly.` }, { status: 400 });
      }
    }

    const settings = await updateSiteSettings(body as SiteSettings);
    return NextResponse.json({
      message: "Settings updated successfully.",
      settings,
    });
  } catch {
    return NextResponse.json({ message: "Failed to update settings." }, { status: 400 });
  }
}
