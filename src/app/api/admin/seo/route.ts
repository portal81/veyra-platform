import { NextResponse } from "next/server";
import { requireAdminRoute } from "@/lib/admin-route";
import { getSeoPageConfigs, upsertSeoPageConfig } from "@/lib/repository";
import type { SeoPageConfig } from "@/lib/types";

export async function GET() {
  const guard = await requireAdminRoute("seo.manage");
  if (guard.response) return guard.response;

  const pages = await getSeoPageConfigs();
  return NextResponse.json({ pages });
}

export async function PUT(request: Request) {
  const guard = await requireAdminRoute("seo.manage");
  if (guard.response) return guard.response;

  try {
    const payload = (await request.json().catch(() => null)) as SeoPageConfig | null;
    if (!payload?.id || !payload?.label || !payload?.pageKey) {
      return NextResponse.json({ message: "Invalid SEO payload." }, { status: 400 });
    }

    const page = await upsertSeoPageConfig(payload);
    return NextResponse.json({ page });
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "Could not update SEO config." },
      { status: 500 },
    );
  }
}
