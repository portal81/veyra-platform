"use client";

import Link from "next/link";
import { useAdminLocale } from "@/components/admin/admin-locale-provider";
import type { LocalizedText } from "@/lib/types";

export const TEXT_COLOR_PRESETS = [
  { label: { en: "Soft White", ar: "أبيض ناعم" }, value: "#f5eee6" },
  { label: { en: "Veyra Gold", ar: "ذهبي فييرا" }, value: "#d8b072" },
  { label: { en: "Warm Copper", ar: "نحاسي دافئ" }, value: "#c68f43" },
  { label: { en: "Slate Blue", ar: "أزرق أردوازي" }, value: "#4b86a8" },
];

type BuilderSectionProps = {
  eyebrow?: string;
  title: string;
  description?: string;
  children: React.ReactNode;
};

type LocalizedTextEditorProps = {
  label: string;
  value: LocalizedText;
  onChange: (next: LocalizedText) => void;
  as?: "input" | "textarea";
  englishPlaceholder?: string;
  arabicPlaceholder?: string;
  rows?: number;
  compact?: boolean;
};

type AdminWorkspaceShellProps = {
  eyebrow: string;
  title: string;
  description: string;
  mode?: string;
  active: "overview" | "settings" | "projects" | "services" | "leads" | "users";
  children: React.ReactNode;
};

const ADMIN_CONTEXT_PANELS = {
  overview: {
    title: { en: "Operations board", ar: "لوحة التشغيل" },
    description: { en: "Daily revenue visibility for the whole platform.", ar: "رؤية يومية للمبيعات عبر المنصة كلها." },
    items: [
      { label: { en: "Revenue snapshot", ar: "ملخص الإيراد" }, meta: { en: "Top KPIs and response health", ar: "أهم المؤشرات وصحة الاستجابة" }, tone: "accent" as const },
      { label: { en: "Sales queue", ar: "طابور المبيعات" }, meta: { en: "Who needs follow-up now", ar: "من يحتاج متابعة الآن" } },
      { label: { en: "CRM flow", ar: "حركة العملاء" }, meta: { en: "Pipeline movement and pressure points", ar: "حركة المراحل ونقاط الضغط" } },
      { label: { en: "Builder activity", ar: "نشاط البيلدر" }, meta: { en: "Content and publishing signals", ar: "إشارات المحتوى والنشر" } },
    ],
  },
  settings: {
    title: { en: "Builder sections", ar: "أقسام البيلدر" },
    description: { en: "Shared system controls grouped by editing intent.", ar: "عناصر النظام المشتركة مجمعة حسب هدف التعديل." },
    items: [
      { label: { en: "Brand and theme", ar: "الهوية والثيم" }, meta: { en: "Logo, palettes, shell identity", ar: "اللوجو، الألوان، وهوية الواجهة" }, tone: "accent" as const },
      { label: { en: "Header and footer", ar: "الهيدر والفوتر" }, meta: { en: "Primary navigation and shared chrome", ar: "التنقل الأساسي والعناصر المشتركة" } },
      { label: { en: "Hero and lead forms", ar: "الهيرو ونماذج الطلب" }, meta: { en: "Top-of-funnel conversion copy", ar: "النصوص الأساسية للتحويل" } },
      { label: { en: "Calculators", ar: "الحاسبات" }, meta: { en: "Pricing engines and labels", ar: "منطق التسعير واللايبلز" } },
      { label: { en: "Page builders", ar: "بناة الصفحات" }, meta: { en: "Home, projects, services, booking", ar: "الرئيسية، المشاريع، الخدمات، الحجز" } },
    ],
  },
  projects: {
    title: { en: "Project control", ar: "إدارة المشاريع" },
    description: { en: "Inventory and storytelling layers for the real-estate funnel.", ar: "المخزون وطبقات العرض التسويقي للمشروعات." },
    items: [
      { label: { en: "Catalog overview", ar: "نظرة الكتالوج" }, meta: { en: "Featured projects and publish state", ar: "المشروعات المميزة وحالة النشر" }, tone: "accent" as const },
      { label: { en: "Identity and copy", ar: "الهوية والنصوص" }, meta: { en: "Names, summaries, highlights", ar: "الأسماء، الملخصات، والهايلايتس" } },
      { label: { en: "Media", ar: "الوسائط" }, meta: { en: "Hero, gallery, visual sequencing", ar: "الهيرو، المعرض، وتسلسل العرض" } },
      { label: { en: "Units", ar: "الوحدات" }, meta: { en: "Areas, prices, floors, availability", ar: "المساحات، الأسعار، الأدوار، والتوفر" } },
      { label: { en: "Surface colors", ar: "ألوان النصوص" }, meta: { en: "Localized text and emphasis colors", ar: "ألوان النصوص المؤكدة والمترجمة" } },
    ],
  },
  services: {
    title: { en: "Service catalog", ar: "كتالوج الخدمات" },
    description: { en: "Finishing and smart-home offers arranged as sellable packages.", ar: "عروض التشطيب والمنازل الذكية في صورة باقات قابلة للبيع." },
    items: [
      { label: { en: "Finishing packages", ar: "باقات التشطيب" }, meta: { en: "Tiers, summaries, included scope", ar: "المستويات والملخصات ونطاق الخدمة" }, tone: "accent" as const },
      { label: { en: "Smart devices", ar: "الأجهزة الذكية" }, meta: { en: "Devices and key benefits", ar: "الأجهزة والمزايا الأساسية" } },
      { label: { en: "Smart bundles", ar: "باقات السمارت" }, meta: { en: "Package composition and CTA support", ar: "محتوى الباقة ورسائل CTA" } },
      { label: { en: "Estimator hooks", ar: "بيانات الحاسبات" }, meta: { en: "Data that powers calculators", ar: "البيانات التي تشغل الحاسبات" } },
      { label: { en: "Localized styling", ar: "تنسيق مترجم" }, meta: { en: "Copy and text colors", ar: "النصوص وألوانها" } },
    ],
  },
  leads: {
    title: { en: "Sales console", ar: "كونسول المبيعات" },
    description: { en: "Lead flow, performance, and reasons behind wins and losses.", ar: "حركة العملاء، الأداء، وأسباب الفوز والخسارة." },
    items: [
      { label: { en: "Priority queue", ar: "طابور الأولوية" }, meta: { en: "Urgent and stale opportunities", ar: "الفرص العاجلة والمتأخرة" }, tone: "accent" as const },
      { label: { en: "Pipeline board", ar: "لوحة المراحل" }, meta: { en: "Stage changes and ownership", ar: "تغيرات المراحل والمسؤولية" } },
      { label: { en: "Source performance", ar: "أداء المصادر" }, meta: { en: "What channels generate demand", ar: "أي القنوات تولد الطلب" } },
      { label: { en: "Sales rep performance", ar: "أداء فريق المبيعات" }, meta: { en: "Assignment load and outcomes", ar: "التحميل والنتائج" } },
      { label: { en: "Lost reasons", ar: "أسباب الخسارة" }, meta: { en: "Why deals are dropping", ar: "لماذا تسقط الصفقات" } },
    ],
  },
  users: {
    title: { en: "Access control", ar: "إدارة الوصول" },
    description: { en: "Team onboarding, permissions, and role governance.", ar: "دعوات الفريق والصلاحيات وحوكمة الأدوار." },
    items: [
      { label: { en: "Invitations", ar: "الدعوات" }, meta: { en: "Create and manage pending invites", ar: "إنشاء وإدارة الدعوات المعلقة" }, tone: "accent" as const },
      { label: { en: "Active users", ar: "المستخدمون النشطون" }, meta: { en: "Current team accounts", ar: "حسابات الفريق الحالية" } },
      { label: { en: "Roles", ar: "الأدوار" }, meta: { en: "Owner, admin, editor, sales, viewer", ar: "مالك، مدير، محرر، مبيعات، مشاهد" } },
      { label: { en: "Custom permissions", ar: "صلاحيات مخصصة" }, meta: { en: "Granular action control", ar: "تحكم تفصيلي في الإجراءات" } },
      { label: { en: "Cleanup", ar: "تنظيف الوصول" }, meta: { en: "Edit, save, or remove access", ar: "تعديل أو حفظ أو حذف الوصول" } },
    ],
  },
} satisfies Record<
  AdminWorkspaceShellProps["active"],
  {
    title: { en: string; ar: string };
    description: { en: string; ar: string };
    items: Array<{ label: { en: string; ar: string }; meta: { en: string; ar: string }; tone?: "accent" | "neutral" }>;
  }
>;

const ADMIN_LINKS = [
  { id: "overview", href: "/admin", label: { en: "Overview", ar: "نظرة عامة" }, eyebrow: { en: "Home", ar: "الرئيسية" }, group: "workspace" as const },
  { id: "settings", href: "/admin/settings", label: { en: "Builder Settings", ar: "إعدادات البيلدر" }, eyebrow: { en: "Theme + copy", ar: "الثيم والنصوص" }, group: "workspace" as const },
  { id: "projects", href: "/admin/projects", label: { en: "Projects", ar: "المشروعات" }, eyebrow: { en: "Inventory", ar: "المخزون" }, group: "workspace" as const },
  { id: "services", href: "/admin/services", label: { en: "Services", ar: "الخدمات" }, eyebrow: { en: "Packages + devices", ar: "الباقات والأجهزة" }, group: "workspace" as const },
  { id: "leads", href: "/admin/leads", label: { en: "CRM", ar: "العملاء" }, eyebrow: { en: "Pipeline", ar: "المراحل" }, group: "operations" as const },
  { id: "users", href: "/admin/users", label: { en: "Users", ar: "المستخدمون" }, eyebrow: { en: "Roles + invites", ar: "الأدوار والدعوات" }, group: "operations" as const },
];

function ColorPicker({
  value,
  onChange,
}: {
  value?: string;
  onChange: (next: string) => void;
}) {
  const { t } = useAdminLocale();

  return (
    <div className="grid gap-3 rounded-[22px] border border-white/10 bg-black/25 p-4">
      <div className="grid gap-2 sm:grid-cols-2">
        {TEXT_COLOR_PRESETS.map((preset) => (
          <button
            key={preset.value}
            type="button"
            onClick={() => onChange(preset.value)}
            className={`inline-flex min-w-0 items-center gap-2 rounded-full border px-3 py-2 text-left text-xs transition ${
              value?.toLowerCase() === preset.value.toLowerCase()
                ? "border-brand-gold bg-white/10 text-white"
                : "border-white/10 text-white/68 hover:bg-white/5"
            }`}
          >
            <span className="h-3 w-3 rounded-full border border-white/15" style={{ backgroundColor: preset.value }} />
            <span className="truncate">{t(preset.label.en, preset.label.ar)}</span>
          </button>
        ))}
      </div>

      <label className="grid gap-2 text-xs uppercase tracking-[0.2em] text-white/48">
        {t("Custom color", "لون مخصص")}
        <input
          value={value ?? ""}
          onChange={(event) => onChange(event.target.value)}
          className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm normal-case tracking-normal text-white outline-none"
          placeholder="#d8b072"
        />
      </label>
    </div>
  );
}

export function BuilderSection({
  eyebrow,
  title,
  description,
  children,
}: BuilderSectionProps) {
  return (
    <section className="rounded-[32px] border border-white/10 bg-white/5 p-6 shadow-2xl shadow-black/15">
      <div className="max-w-3xl">
        {eyebrow ? <p className="text-xs font-semibold uppercase tracking-[0.28em] text-brand-gold">{eyebrow}</p> : null}
        <h3 className="mt-3 font-serif text-3xl text-white">{title}</h3>
        {description ? <p className="mt-3 text-white/68">{description}</p> : null}
      </div>
      <div className="mt-6">{children}</div>
    </section>
  );
}

export function LocalizedTextEditor({
  label,
  value,
  onChange,
  as = "textarea",
  englishPlaceholder = "English",
  arabicPlaceholder = "العربية",
  rows = 4,
  compact = false,
}: LocalizedTextEditorProps) {
  const { t } = useAdminLocale();
  const sharedClasses = "rounded-2xl border border-white/10 bg-black/25 px-4 py-3 text-white outline-none";

  if (compact) {
    return (
      <div className="grid min-w-0 gap-2 rounded-[18px] border border-white/10 bg-black/20 p-3">
        <p className="text-[10px] uppercase tracking-[0.18em] text-white/42">{label}</p>
        <input
          value={value.en}
          onChange={(event) => onChange({ ...value, en: event.target.value })}
          className="w-full rounded-xl border border-white/10 bg-black/25 px-3 py-2 text-xs text-white outline-none placeholder:text-white/30"
          placeholder={englishPlaceholder}
        />
        <input
          value={value.ar}
          onChange={(event) => onChange({ ...value, ar: event.target.value })}
          className="w-full rounded-xl border border-white/10 bg-black/25 px-3 py-2 text-xs text-white outline-none placeholder:text-white/30 font-arabic"
          placeholder={arabicPlaceholder}
          dir="rtl"
        />
      </div>
    );
  }

  return (
    <div className="grid gap-4 rounded-[24px] border border-white/10 bg-black/20 p-4">
      <div>
        <p className="text-sm font-semibold text-white/86">{label}</p>
        <p className="mt-1 text-xs uppercase tracking-[0.22em] text-white/42">{t("Copy + text color", "النص + لون الكتابة")}</p>
      </div>

      <div className="grid gap-4">
        <div className="grid gap-4 min-[1800px]:grid-cols-2">
          <div className="grid min-w-0 gap-3">
            <span className="text-xs uppercase tracking-[0.2em] text-white/48">{t("English", "الإنجليزية")}</span>
            {as === "textarea" ? (
              <textarea value={value.en} onChange={(event) => onChange({ ...value, en: event.target.value })} className={sharedClasses} placeholder={englishPlaceholder} rows={rows} />
            ) : (
              <input value={value.en} onChange={(event) => onChange({ ...value, en: event.target.value })} className={sharedClasses} placeholder={englishPlaceholder} />
            )}
            <div className="rounded-[18px] border border-white/10 bg-[#120f0d] px-4 py-3">
              <p className="text-[11px] uppercase tracking-[0.18em] text-white/38">{t("Preview", "معاينة")}</p>
              <p className="mt-2 break-words text-sm leading-7" style={{ color: value.color || "#f5eee6" }}>
                {value.en || englishPlaceholder}
              </p>
            </div>
          </div>

          <div className="grid min-w-0 gap-3">
            <span className="text-xs uppercase tracking-[0.2em] text-white/48">{t("Arabic", "العربية")}</span>
            {as === "textarea" ? (
              <textarea value={value.ar} onChange={(event) => onChange({ ...value, ar: event.target.value })} className={`${sharedClasses} font-arabic`} placeholder={arabicPlaceholder} rows={rows} dir="rtl" />
            ) : (
              <input value={value.ar} onChange={(event) => onChange({ ...value, ar: event.target.value })} className={`${sharedClasses} font-arabic`} placeholder={arabicPlaceholder} dir="rtl" />
            )}
            <div className="rounded-[18px] border border-white/10 bg-[#120f0d] px-4 py-3">
              <p className="text-[11px] uppercase tracking-[0.18em] text-white/38">{t("Preview", "معاينة")}</p>
              <p className="mt-2 break-words font-arabic text-sm leading-7" style={{ color: value.color || "#f5eee6" }} dir="auto">
                {value.ar || arabicPlaceholder}
              </p>
            </div>
          </div>
        </div>

        <div className="grid gap-3 rounded-[20px] border border-white/10 bg-[#120f0d] p-4">
          <p className="text-xs uppercase tracking-[0.2em] text-white/42">{t("Text color", "لون النص")}</p>
          <ColorPicker value={value.color} onChange={(color) => onChange({ ...value, color })} />
        </div>
      </div>
    </div>
  );
}

export function AdminWorkspaceShell({
  eyebrow,
  title,
  description,
  mode,
  active,
  children,
}: AdminWorkspaceShellProps) {
  const { t } = useAdminLocale();
  const groupedLinks = [
    { id: "workspace", label: t("Workspace", "مساحة العمل"), description: t("Builder, catalog, and content layers.", "البيلدر والكتالوج وطبقات المحتوى.") },
    { id: "operations", label: t("Operations", "التشغيل"), description: t("CRM, users, and daily management.", "العملاء والمستخدمون والتشغيل اليومي.") },
  ] as const;
  const activeItem = ADMIN_LINKS.find((item) => item.id === active);
  const contextPanel = ADMIN_CONTEXT_PANELS[active];

  return (
    <div className="mx-auto w-[min(1820px,calc(100%-1.5rem))] py-10 md:py-14">
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px_230px] xl:items-start">
        <div className="grid gap-6 xl:order-1">
          <section className="rounded-[36px] border border-white/10 bg-[radial-gradient(circle_at_top_right,rgba(242,193,107,0.14),transparent_24%),linear-gradient(180deg,rgba(255,255,255,0.05),rgba(255,255,255,0.02))] p-6 shadow-[0_30px_80px_rgba(0,0,0,0.24)] md:p-8">
            <div className="grid gap-6 lg:grid-cols-[1fr_auto] lg:items-end">
              <div className="max-w-4xl">
                <p className="text-xs font-semibold uppercase tracking-[0.28em] text-brand-gold">{eyebrow}</p>
                <h1 className="mt-3 font-serif text-4xl leading-tight text-white md:text-5xl">{title}</h1>
                <p className="mt-4 text-base leading-8 text-white/68 md:text-lg">{description}</p>
              </div>

              <div className="flex flex-wrap gap-2 lg:justify-end">
                <Link href="/admin/settings" className="rounded-full border border-white/10 px-4 py-3 text-xs uppercase tracking-[0.18em] text-white/68 transition hover:bg-white/5">
                  {t("Builder", "البيلدر")}
                </Link>
                <Link href="/admin/leads" className="rounded-full border border-white/10 px-4 py-3 text-xs uppercase tracking-[0.18em] text-white/68 transition hover:bg-white/5">
                  {t("CRM", "العملاء")}
                </Link>
                <Link href="/admin/users" className="rounded-full border border-white/10 px-4 py-3 text-xs uppercase tracking-[0.18em] text-white/68 transition hover:bg-white/5">
                  {t("Team", "الفريق")}
                </Link>
              </div>
            </div>
          </section>

          <div className="grid gap-6">{children}</div>
        </div>

        <aside className="grid gap-6 xl:order-2 xl:sticky xl:top-24">
          <section className="rounded-[30px] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.05),rgba(255,255,255,0.02))] p-5 shadow-[0_24px_60px_rgba(0,0,0,0.18)]">
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-brand-gold">{t("Section menu", "قائمة القسم")}</p>
            <h2 className="mt-3 font-serif text-3xl text-white">{t(contextPanel.title.en, contextPanel.title.ar)}</h2>
            <p className="mt-3 text-sm leading-7 text-white/62">{t(contextPanel.description.en, contextPanel.description.ar)}</p>
            <div className="mt-6 grid gap-3">
              {contextPanel.items.map((item, index) => (
                <div
                  key={`${item.label.en}-${index}`}
                  className={`rounded-[22px] border px-4 py-4 transition ${
                    item.tone === "accent"
                      ? "border-brand-gold/30 bg-brand-gold/10 shadow-[0_14px_30px_rgba(0,0,0,0.16)]"
                      : "border-white/10 bg-black/20 hover:bg-white/6"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-white/10 bg-black/20 text-[11px] font-semibold uppercase tracking-[0.16em] text-brand-gold">
                      0{index + 1}
                    </span>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-white">{t(item.label.en, item.label.ar)}</p>
                      <p className="mt-2 text-sm leading-6 text-white/58">{t(item.meta.en, item.meta.ar)}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-6 rounded-[22px] border border-white/10 bg-black/20 p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-white/42">{t("Workspace status", "حالة المساحة")}</p>
              <div className="mt-3 flex flex-wrap gap-2">
                <span className="rounded-full border border-white/10 bg-white/5 px-3 py-2 text-xs text-white/72">
                  {t("Active page", "الصفحة الحالية")}: {activeItem ? t(activeItem.label.en, activeItem.label.ar) : active}
                </span>
                {mode ? (
                  <span className="rounded-full border border-white/10 bg-white/5 px-3 py-2 text-xs text-white/72">
                    {t("Mode", "الوضع")}: {mode}
                  </span>
                ) : null}
              </div>
            </div>
          </section>
        </aside>

        <aside className="hidden xl:block xl:order-3 xl:sticky xl:top-24">
          <section className="rounded-[30px] border border-white/10 bg-[radial-gradient(circle_at_top_right,rgba(242,193,107,0.14),transparent_26%),linear-gradient(180deg,rgba(255,255,255,0.05),rgba(255,255,255,0.02))] p-5 shadow-[0_26px_60px_rgba(0,0,0,0.22)]">
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-brand-gold">{t("Navigation", "التنقل")}</p>
            <h2 className="mt-3 font-serif text-3xl text-white">{t("Control hub", "مركز التحكم")}</h2>
            <p className="mt-3 text-sm leading-7 text-white/62">
              {t("Clear sections for content, inventory, CRM, and team access.", "تقسيم واضح للمحتوى والمخزون والعملاء ووصول الفريق.")}
            </p>

            <div className="mt-6 grid gap-5">
              {groupedLinks.map((group) => (
                <div key={group.id} className="grid gap-3">
                  <div>
                    <p className="text-xs uppercase tracking-[0.2em] text-white/40">{group.label}</p>
                    <p className="mt-1 text-xs text-white/46">{group.description}</p>
                  </div>
                  <div className="grid gap-2">
                    {ADMIN_LINKS.filter((item) => item.group === group.id).map((item) => {
                      const isActive = item.id === active;
                      return (
                        <Link
                          key={item.id}
                          href={item.href}
                          className={`rounded-[22px] border px-4 py-4 transition ${
                            isActive
                              ? "border-brand-gold bg-white/10 shadow-[0_18px_40px_rgba(0,0,0,0.16)]"
                              : "border-white/10 bg-black/20 hover:bg-white/6"
                          }`}
                        >
                          <p className="text-[11px] uppercase tracking-[0.22em] text-brand-gold">{t(item.eyebrow.en, item.eyebrow.ar)}</p>
                          <p className="mt-2 text-sm font-semibold text-white">{t(item.label.en, item.label.ar)}</p>
                        </Link>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-6 rounded-[24px] border border-brand-gold/18 bg-[linear-gradient(180deg,rgba(242,193,107,0.14),rgba(255,255,255,0.04))] p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-brand-gold">{t("Quick objective", "هدف سريع")}</p>
              <p className="mt-3 text-sm leading-7 text-white/72">
                {t("Keep edits structured, keep offers current, and keep sales teams focused on the next action.", "حافظ على تنظيم التعديلات، وتحديث العروض، وتركيز فريق المبيعات على الخطوة التالية.")}
              </p>
            </div>
          </section>
        </aside>
      </div>
    </div>
  );
}
