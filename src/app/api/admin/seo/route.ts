import { NextResponse } from "next/server";
import { getSeoPageConfigs, upsertSeoPageConfig } from "@/lib/repository";
import type { SeoPageConfig } from "@/lib/types";

export async function GET() {
  const pages = await getSeoPageConfigs();
  return NextResponse.json({ pages });
}

export async function PUT(request: Request) {
  const payload = (await request.json().catch(() => null)) as SeoPageConfig | null;
  if (!payload?.id || !payload?.label || !payload?.pageKey) {
    return NextResponse.json({ message: "Invalid SEO payload." }, { status: 400 });
  }

  const page = await upsertSeoPageConfig(payload);
  return NextResponse.json({ page });
}
