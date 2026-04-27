"use client";

import { BuilderSection, LocalizedTextEditor } from "@/components/admin/builder-kit";
import { MediaDropzone } from "@/components/admin/media-fields";
import { Field } from "./shared-builder-ui";
import type { SiteSettings, LocaleCode } from "@/lib/types";

type Props = {
  settings: SiteSettings;
  mutateSettings: (recipe: (draft: SiteSettings) => void) => void;
  ui: (en: string, ar?: string) => string;
  t: (en: string, ar: string) => string;
};

export function BrandThemeModule({ settings, mutateSettings, ui, t }: Props) {
  function toggleLocale(locale: LocaleCode) {
    mutateSettings((draft) => {
      const exists = draft.supportedLocales.includes(locale);
      const supportedLocales = exists 
        ? draft.supportedLocales.filter((item) => item !== locale) 
        : [...draft.supportedLocales, locale];
      draft.supportedLocales = supportedLocales.length ? supportedLocales : [draft.primaryLocale];
      if (!draft.supportedLocales.includes(draft.primaryLocale)) {
        draft.primaryLocale = draft.supportedLocales[0] ?? "en";
      }
    });
  }

  return (
    <div className="grid gap-6">
      <BuilderSection
        eyebrow={t("Brand core", "الهوية الأساسية")}
        title={t("Company identity, logo system, and language defaults.", "هوية الشركة، نظام الشعار، وإعدادات اللغة الافتراضية.")}
        description={t("Keep the main brand lockup, default locale, and uploaded logo asset aligned between the website and admin.", "حافظ على اتساق الشعار الرئيسي واللغة الافتراضية والصورة المرفوعة بين الموقع والأدمن.")}
      >
        <div className="grid gap-6">
          <div className="grid gap-4">
            <Field label={ui("Company name")}>
              <input value={settings.companyName} onChange={(event) => mutateSettings((draft) => { draft.companyName = event.target.value; })} className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-white outline-none" placeholder="Veyra Developments" />
            </Field>
            <Field label={ui("Primary locale")}>
              <select value={settings.primaryLocale} onChange={(event) => mutateSettings((draft) => { draft.primaryLocale = event.target.value as LocaleCode; })} className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-white outline-none">
                <option value="en">{ui("English")}</option>
                <option value="ar">{ui("Arabic")}</option>
              </select>
            </Field>
            <Field label={ui("Supported locales")}>
              <div className="flex flex-wrap gap-3">
                {(["en", "ar"] as LocaleCode[]).map((locale) => {
                  const active = settings.supportedLocales.includes(locale);
                  return (
                    <label key={locale} className={`inline-flex items-center gap-2 rounded-full border px-4 py-3 text-sm transition ${active ? "border-[#f2c16b] bg-white/10 text-white" : "border-white/10 bg-black/20 text-white/70"}`}>
                      <input checked={active} onChange={() => toggleLocale(locale)} type="checkbox" />
                      {locale === "en" ? "English" : "العربية"}
                    </label>
                  );
                })}
              </div>
            </Field>
          </div>
          <div className="grid gap-4">
            <Field label={ui("Logo source")}>
              <label className="inline-flex items-center gap-3 rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-white/82">
                <input type="checkbox" checked={settings.branding.useImageLogo} onChange={(event) => mutateSettings((draft) => { draft.branding.useImageLogo = event.target.checked; })} />
                Use uploaded image logo instead of the built-in Veyra lockup
              </label>
            </Field>
            <MediaDropzone label={ui("Primary logo")} value={settings.branding.logoUrl} helperText={t("Transparent PNG or SVG works best for the shared site header and footer.", "يفضل استخدام PNG أو SVG بخلفية شفافة ليتناسق مع الهيدر والفوتر.")} onChange={(url) => mutateSettings((draft) => { draft.branding.logoUrl = url; })} />
            <LocalizedTextEditor label={ui("Logo alt text")} value={settings.branding.logoAlt ?? { en: "Veyra logo", ar: "", color: "#fff" }} onChange={(next) => mutateSettings((draft) => { draft.branding.logoAlt = next; })} as="input" englishPlaceholder="Veyra Developments logo" arabicPlaceholder="شعار فييرا للتطوير" rows={2} />
          </div>
        </div>
      </BuilderSection>

      <BuilderSection
        eyebrow={t("Theme", "الثيم")}
        title={t("Palette selection for the live site.", "اختيار لوحة الألوان للموقع اللايف.")}
        description={t("Switch the overall mood first, then refine the color of individual text lines anywhere below.", "غيّر الإحساس العام أولًا ثم عدّل لون كل سطر نصي بشكل منفصل.")}
      >
        <div className="grid gap-4 md:grid-cols-2 2xl:grid-cols-3">
          {settings.palettes.map((palette) => {
            const active = settings.paletteId === palette.id;
            return (
              <button key={palette.id} type="button" onClick={() => mutateSettings((draft) => { draft.paletteId = palette.id; })} className={`rounded-[28px] border p-5 text-left transition ${active ? "border-[#f2c16b] bg-white/10 shadow-[0_22px_48px_rgba(0,0,0,0.2)]" : "border-white/10 bg-black/20 hover:bg-white/6"}`}>
                <div className="flex gap-2">
                  {[palette.primary, palette.accent, palette.surface, palette.text].map((color) => <span key={color} className="h-10 w-10 rounded-full border border-white/10" style={{ backgroundColor: color }} />)}
                </div>
                <h3 className="mt-4 text-lg font-semibold text-white">{palette.name}</h3>
                <p className="mt-2 text-xs uppercase tracking-[0.24em] text-white/44">{palette.id}</p>
              </button>
            );
          })}
        </div>
      </BuilderSection>
    </div>
  );
}
