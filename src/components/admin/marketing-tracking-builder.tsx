"use client";

import { useState, useTransition } from "react";
import { Field, MiniSection } from "@/components/admin/builder-shared";
import type { MarketingTrackingSettings, LocaleCode } from "@/lib/types";

type MarketingTrackingBuilderProps = {
  initialSettings: MarketingTrackingSettings;
  locale: LocaleCode;
};

const EVENT_OPTIONS = [
  "book_visit",
  "whatsapp_click",
  "lead_submit",
  "calculator_submit",
  "page_view",
] as const;

export function MarketingTrackingBuilder({
  initialSettings,
  locale,
}: MarketingTrackingBuilderProps) {
  const [settings, setSettings] = useState<MarketingTrackingSettings>(initialSettings);
  const [isPending, startTransition] = useTransition();
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "success" | "error">("idle");

  const t = (en: string, ar: string) => (locale === "ar" ? ar : en);

  const selectedEvents = Object.keys(settings.eventMappings ?? {}).filter(
    (eventName) => settings.eventMappings[eventName],
  );
  const metaPixelId = (settings.metaPixelId || "").trim();
  const hasMetaPixelPreview = Boolean(settings.enableMetaPixel && metaPixelId);
  const metaPixelCodePreview = hasMetaPixelPreview
    ? `<!-- Meta Pixel Code -->
<script>
!function(f,b,e,v,n,t,s)
{if(f.fbq)return;n=f.fbq=function(){n.callMethod?
n.callMethod.apply(n,arguments):n.queue.push(arguments)};
if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
n.queue=[];t=b.createElement(e);t.async=!0;
t.src=v;s=b.getElementsByTagName(e)[0];
s.parentNode.insertBefore(t,s)}(window, document,'script',
'https://connect.facebook.net/en_US/fbevents.js');
fbq('init', '${metaPixelId}');
fbq('track', 'PageView');
</script>
<noscript><img height="1" width="1" style="display:none"
src="https://www.facebook.com/tr?id=${metaPixelId}&ev=PageView&noscript=1"
/></noscript>
<!-- End Meta Pixel Code -->`
    : "";

  function toggleEvent(eventName: string, enabled: boolean) {
    setSettings((current) => ({
      ...current,
      eventMappings: {
        ...(current.eventMappings ?? {}),
        [eventName]: enabled ? "enabled" : "",
      },
    }));
  }

  const handleSave = () => {
    startTransition(async () => {
      try {
        setSaveStatus("saving");
        const response = await fetch("/api/admin/marketing-tracking", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(settings),
        });

        if (!response.ok) throw new Error("Failed to save");
        const data = (await response.json()) as { data?: MarketingTrackingSettings };
        if (data.data) setSettings(data.data);
        setSaveStatus("success");
        setTimeout(() => setSaveStatus("idle"), 2200);
      } catch {
        setSaveStatus("error");
        setTimeout(() => setSaveStatus("idle"), 2200);
      }
    });
  };

  return (
    <div className="space-y-8">
      <MiniSection
        title={t("Tracking Providers", "مزودي التتبع")}
        description={t(
          "Connect GTM, GA4, Meta, and TikTok from one place.",
          "اربط GTM وGA4 وMeta وTikTok من شاشة واحدة.",
        )}
      >
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="GTM Container ID">
            <input
              type="text"
              value={settings.googleTagManagerId || ""}
              onChange={(e) =>
                setSettings((current) => ({ ...current, googleTagManagerId: e.target.value }))
              }
              placeholder="GTM-XXXXXXX"
              className="rounded-xl border border-neutral-700 bg-neutral-900 px-4 py-3 text-white outline-none"
            />
          </Field>
          <Field label={t("Enable GTM", "تفعيل GTM")}>
            <label className="inline-flex items-center gap-3 rounded-xl border border-neutral-700 bg-neutral-900 px-4 py-3">
              <input
                type="checkbox"
                checked={settings.enableGTM}
                onChange={(e) =>
                  setSettings((current) => ({ ...current, enableGTM: e.target.checked }))
                }
              />
              <span className="text-sm text-white">{settings.enableGTM ? t("Enabled", "مفعل") : t("Disabled", "معطل")}</span>
            </label>
          </Field>

          <Field label="GA4 Measurement ID">
            <input
              type="text"
              value={settings.googleAnalytics4MeasurementId || ""}
              onChange={(e) =>
                setSettings((current) => ({
                  ...current,
                  googleAnalytics4MeasurementId: e.target.value,
                }))
              }
              placeholder="G-XXXXXXXXXX"
              className="rounded-xl border border-neutral-700 bg-neutral-900 px-4 py-3 text-white outline-none"
            />
          </Field>
          <Field label={t("Enable GA4", "تفعيل GA4")}>
            <label className="inline-flex items-center gap-3 rounded-xl border border-neutral-700 bg-neutral-900 px-4 py-3">
              <input
                type="checkbox"
                checked={settings.enableGA4}
                onChange={(e) =>
                  setSettings((current) => ({ ...current, enableGA4: e.target.checked }))
                }
              />
              <span className="text-sm text-white">{settings.enableGA4 ? t("Enabled", "مفعل") : t("Disabled", "معطل")}</span>
            </label>
          </Field>

          <Field label="Meta Pixel ID">
            <input
              type="text"
              value={settings.metaPixelId || ""}
              onChange={(e) =>
                setSettings((current) => ({ ...current, metaPixelId: e.target.value }))
              }
              placeholder="123456789"
              className="rounded-xl border border-neutral-700 bg-neutral-900 px-4 py-3 text-white outline-none"
            />
          </Field>
          <Field label={t("Enable Meta Pixel", "تفعيل Meta Pixel")}>
            <label className="inline-flex items-center gap-3 rounded-xl border border-neutral-700 bg-neutral-900 px-4 py-3">
              <input
                type="checkbox"
                checked={settings.enableMetaPixel}
                onChange={(e) =>
                  setSettings((current) => ({ ...current, enableMetaPixel: e.target.checked }))
                }
              />
              <span className="text-sm text-white">{settings.enableMetaPixel ? t("Enabled", "مفعل") : t("Disabled", "معطل")}</span>
            </label>
          </Field>

          <Field label="TikTok Pixel ID">
            <input
              type="text"
              value={settings.tiktokPixelId || ""}
              onChange={(e) =>
                setSettings((current) => ({ ...current, tiktokPixelId: e.target.value }))
              }
              placeholder="123456789"
              className="rounded-xl border border-neutral-700 bg-neutral-900 px-4 py-3 text-white outline-none"
            />
          </Field>
          <Field label={t("Enable TikTok Pixel", "تفعيل TikTok Pixel")}>
            <label className="inline-flex items-center gap-3 rounded-xl border border-neutral-700 bg-neutral-900 px-4 py-3">
              <input
                type="checkbox"
                checked={settings.enableTikTokPixel}
                onChange={(e) =>
                  setSettings((current) => ({ ...current, enableTikTokPixel: e.target.checked }))
                }
              />
              <span className="text-sm text-white">{settings.enableTikTokPixel ? t("Enabled", "مفعل") : t("Disabled", "معطل")}</span>
            </label>
          </Field>
        </div>
      </MiniSection>

      <MiniSection
        title={t("UTM Capture", "التقاط UTM")}
        description={t(
          "Default UTM values used for lead attribution.",
          "قيم UTM الافتراضية المستخدمة في إسناد المصدر للـ leads.",
        )}
      >
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="UTM Source">
            <input
              value={settings.utmSource || ""}
              onChange={(e) => setSettings((current) => ({ ...current, utmSource: e.target.value }))}
              className="rounded-xl border border-neutral-700 bg-neutral-900 px-4 py-3 text-white outline-none"
            />
          </Field>
          <Field label="UTM Medium">
            <input
              value={settings.utmMedium || ""}
              onChange={(e) => setSettings((current) => ({ ...current, utmMedium: e.target.value }))}
              className="rounded-xl border border-neutral-700 bg-neutral-900 px-4 py-3 text-white outline-none"
            />
          </Field>
          <Field label="UTM Campaign">
            <input
              value={settings.utmCampaign || ""}
              onChange={(e) => setSettings((current) => ({ ...current, utmCampaign: e.target.value }))}
              className="rounded-xl border border-neutral-700 bg-neutral-900 px-4 py-3 text-white outline-none"
            />
          </Field>
          <Field label="UTM Content">
            <input
              value={settings.utmContent || ""}
              onChange={(e) => setSettings((current) => ({ ...current, utmContent: e.target.value }))}
              className="rounded-xl border border-neutral-700 bg-neutral-900 px-4 py-3 text-white outline-none"
            />
          </Field>
        </div>
      </MiniSection>

      <MiniSection
        title={t("Event Mapping", "خريطة الأحداث")}
        description={t(
          "Choose conversion events to emit from website actions.",
          "اختَر أحداث التحويل التي يتم إرسالها من تفاعلات الموقع.",
        )}
      >
        <div className="grid gap-3">
          {EVENT_OPTIONS.map((eventName) => {
            const enabled = selectedEvents.includes(eventName);
            return (
              <label
                key={eventName}
                className="inline-flex items-center gap-3 rounded-xl border border-neutral-700 bg-neutral-900 px-4 py-3"
              >
                <input
                  type="checkbox"
                  checked={enabled}
                  onChange={(e) => toggleEvent(eventName, e.target.checked)}
                />
                <code className="text-sm text-white">{eventName}</code>
              </label>
            );
          })}
        </div>
      </MiniSection>

      <MiniSection
        title={t("Meta Pixel Code Preview", "معاينة كود Meta Pixel")}
        description={t(
          "Generated automatically from Pixel ID and enable toggle.",
          "الكود بيتولد تلقائيًا من Pixel ID وحالة التفعيل.",
        )}
      >
        {hasMetaPixelPreview ? (
          <textarea
            readOnly
            value={metaPixelCodePreview}
            className="min-h-56 w-full rounded-xl border border-neutral-700 bg-neutral-950 px-4 py-3 text-xs text-neutral-200 outline-none"
          />
        ) : (
          <div className="rounded-xl border border-dashed border-neutral-700 bg-neutral-900/60 px-4 py-3 text-sm text-neutral-300">
            {t(
              "Enable Meta Pixel and add Pixel ID to show the install code preview.",
              "فعّل Meta Pixel واكتب Pixel ID علشان يظهر كود التركيب.",
            )}
          </div>
        )}
      </MiniSection>

      <div className="flex gap-3 pt-6">
        <button
          onClick={handleSave}
          disabled={isPending || saveStatus === "saving"}
          className={`rounded-lg px-6 py-3 font-semibold text-white transition ${
            saveStatus === "success"
              ? "bg-green-600 hover:bg-green-700"
              : saveStatus === "error"
                ? "bg-red-600 hover:bg-red-700"
                : "bg-blue-600 hover:bg-blue-700"
          } disabled:cursor-not-allowed disabled:opacity-50`}
        >
          {saveStatus === "saving"
            ? t("Saving...", "جاري الحفظ...")
            : saveStatus === "success"
              ? t("Saved!", "تم الحفظ!")
              : saveStatus === "error"
                ? t("Error", "خطأ")
                : t("Save Settings", "حفظ الإعدادات")}
        </button>
      </div>
    </div>
  );
}
