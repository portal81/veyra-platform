import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getAdminSession } from "@/lib/admin-auth";
import { hasPermission } from "@/lib/admin-session";
import { demoStore } from "@/lib/demo-store";
import { getMarketingTrackingSettings, updateMarketingTrackingSettings } from "@/lib/repository";
import type { MarketingTrackingSettings } from "@/lib/types";

const marketingTrackingSchema = z.object({
  id: z.string().optional(),
  googleTagManagerId: z.string().optional(),
  googleAnalytics4MeasurementId: z.string().optional(),
  metaPixelId: z.string().optional(),
  tiktokPixelId: z.string().optional(),
  enableGTM: z.boolean().default(false),
  enableGA4: z.boolean().default(false),
  enableMetaPixel: z.boolean().default(false),
  enableTikTokPixel: z.boolean().default(false),
  utmSource: z.string().optional(),
  utmMedium: z.string().optional(),
  utmCampaign: z.string().optional(),
  utmContent: z.string().optional(),
  utmTerm: z.string().optional(),
  trackPurchases: z.boolean().default(false),
  trackLeadSubmissions: z.boolean().default(true),
  trackPageViews: z.boolean().default(true),
  trackScrollDepth: z.boolean().default(false),
  trackVideoEngagement: z.boolean().default(false),
  eventMappings: z.record(z.string(), z.string()).default({}),
  customEvents: z
    .array(
      z.object({
        name: z.string(),
        parameters: z.record(z.string(), z.string()),
      }),
    )
    .default([]),
  updatedAt: z.string().optional(),
  updatedBy: z.string().optional(),
});

export async function GET(_request: NextRequest) {
  const session = await getAdminSession();
  if (!hasPermission(session, "tracking.manage")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const fallbackSettings: MarketingTrackingSettings = {
    enableGTM: false,
    enableGA4: false,
    enableMetaPixel: false,
    enableTikTokPixel: false,
    trackPurchases: false,
    trackLeadSubmissions: true,
    trackPageViews: true,
    trackScrollDepth: false,
    trackVideoEngagement: false,
    eventMappings: {
      lead_submit: "enabled",
      book_visit: "enabled",
    },
    customEvents: [],
  };
  const settings = (await getMarketingTrackingSettings()) ?? demoStore.marketingTracking ?? fallbackSettings;

  return NextResponse.json(settings);
}

export async function POST(request: NextRequest) {
  const session = await getAdminSession();
  if (!hasPermission(session, "tracking.manage")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  try {
    const body = await request.json();
    const validated = marketingTrackingSchema.parse(body) as MarketingTrackingSettings;

    const saved = (await updateMarketingTrackingSettings(validated)) ?? validated;
    demoStore.marketingTracking = saved as MarketingTrackingSettings;

    return NextResponse.json({ success: true, data: saved });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof z.ZodError ? error.message : "Invalid request" },
      { status: 400 },
    );
  }
}
