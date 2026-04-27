import { redirect } from "next/navigation";
import { SaaSPageShell } from "@/components/admin/saas-page-shell";
import { getAdminSession } from "@/lib/admin-auth";
import { getCurrentAdminLocale } from "@/lib/admin-locale-server";
import { pickAdminText } from "@/lib/admin-locale";
import { hasPermission } from "@/lib/admin-session";
import { MarketingTrackingBuilder } from "@/components/admin/marketing-tracking-builder";
import { getMarketingTrackingSettings } from "@/lib/repository";
import type { MarketingTrackingSettings } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function AdminMarketingTracking() {
  const locale = await getCurrentAdminLocale();
  const session = await getAdminSession();
  
  if (!hasPermission(session, "tracking.manage")) {
    redirect("/admin");
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
  const settings = (await getMarketingTrackingSettings()) ?? fallbackSettings;

  return (
    <SaaSPageShell
      title={pickAdminText(locale, "Marketing Tracking Hub", "مركز تتبع التسويق")}
      description={pickAdminText(
        locale,
        "Connect GTM, GA4, Meta Pixel, and TikTok Pixel. Map conversion events and track UTM parameters.",
        "ربط GTM و GA4 و Meta Pixel و TikTok Pixel. تتبع الأحداث وفهم أداء الحملات.",
      )}
    >
      <MarketingTrackingBuilder initialSettings={settings} locale={locale} />
    </SaaSPageShell>
  );
}
