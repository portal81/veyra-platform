import Link from "next/link";
import { redirect } from "next/navigation";
import { SaaSPageShell } from "@/components/admin/saas-page-shell";
import { getAdminSession } from "@/lib/admin-auth";
import { hasPermission } from "@/lib/admin-session";
import { getCurrentAdminLocale } from "@/lib/admin-locale-server";
import { pickAdminText } from "@/lib/admin-locale";
import { getProjects, getServiceCatalog, getSiteSettings } from "@/lib/repository";

export const dynamic = "force-dynamic";

const PUBLIC_SITE_URL = process.env.NEXT_PUBLIC_PUBLIC_SITE_URL ?? "https://veyra-platform.vercel.app";

type MapNode = {
  id: string;
  titleEn: string;
  titleAr: string;
  path: string;
  descriptionEn: string;
  descriptionAr: string;
  items: { id: string; label: string; enabled: boolean }[];
};

function countCompleted(items: { enabled: boolean }[]) {
  return items.filter((item) => item.enabled).length;
}

export default async function SiteMapPage() {
  const locale = await getCurrentAdminLocale();
  const session = await getAdminSession();

  if (!hasPermission(session, "settings.manage")) {
    redirect("/auth/login?next=/admin/site-map");
  }

  const [settings, projects, services] = await Promise.all([
    getSiteSettings(),
    getProjects(),
    getServiceCatalog(),
  ]);

  const mapNodes: MapNode[] = [
    {
      id: "home",
      titleEn: "Home page",
      titleAr: "الصفحة الرئيسية",
      path: "/",
      descriptionEn: "Hero, search, featured projects, trust, and lead capture.",
      descriptionAr: "الهيرو والبحث والمشروعات المميزة والثقة ونموذج العملاء.",
      items: settings.content.layouts?.home?.map((item) => ({
        id: item.id,
        label: (locale === "ar" ? item.label.ar : item.label.en) || item.id,
        enabled: item.enabled,
      })) ?? [],
    },
    {
      id: "projects",
      titleEn: "Projects page",
      titleAr: "صفحة المشروعات",
      path: "/projects",
      descriptionEn: "Projects grid, filters, compare area, and visit CTA.",
      descriptionAr: "شبكة المشروعات والفلاتر ومنطقة المقارنة وزر الحجز.",
      items: settings.content.layouts?.projects?.map((item) => ({
        id: item.id,
        label: (locale === "ar" ? item.label.ar : item.label.en) || item.id,
        enabled: item.enabled,
      })) ?? [],
    },
    {
      id: "finishing",
      titleEn: "Finishing page",
      titleAr: "صفحة التشطيب",
      path: "/finishing",
      descriptionEn: "Packages, why Veyra, process, FAQ, and quote sections.",
      descriptionAr: "الباقات ولماذا فيرا وخطوات التنفيذ والأسئلة ونموذج السعر.",
      items: settings.content.layouts?.finishing?.map((item) => ({
        id: item.id,
        label: (locale === "ar" ? item.label.ar : item.label.en) || item.id,
        enabled: item.enabled,
      })) ?? [],
    },
    {
      id: "smart-home",
      titleEn: "Smart home page",
      titleAr: "صفحة المنزل الذكي",
      path: "/smart-home",
      descriptionEn: "Devices, packages, process, use cases, and booking flow.",
      descriptionAr: "الأجهزة والباقات وخطوات التنفيذ وحالات الاستخدام والحجز.",
      items: settings.content.layouts?.smartHome?.map((item) => ({
        id: item.id,
        label: (locale === "ar" ? item.label.ar : item.label.en) || item.id,
        enabled: item.enabled,
      })) ?? [],
    },
    {
      id: "booking",
      titleEn: "Visit booking page",
      titleAr: "صفحة حجز الزيارة",
      path: "/book-visit",
      descriptionEn: "Visit scheduling, trust notes, and booking form.",
      descriptionAr: "حجز الزيارة وملاحظات الثقة ونموذج الحجز.",
      items: settings.content.layouts?.book?.map((item) => ({
        id: item.id,
        label: (locale === "ar" ? item.label.ar : item.label.en) || item.id,
        enabled: item.enabled,
      })) ?? [],
    },
  ];

  const sharedBlocks = settings.content.systemBlocks ?? [];
  const sharedZones = [
    {
      id: "header",
      titleEn: "Top menu",
      titleAr: "القائمة العلوية",
      descriptionEn: "Shared navigation and top actions used across the website.",
      descriptionAr: "عناصر التنقل والإجراءات المشتركة أعلى الموقع.",
    },
    {
      id: "lead",
      titleEn: "Lead form",
      titleAr: "نموذج العملاء",
      descriptionEn: "Lead capture and conversion elements reused across key pages.",
      descriptionAr: "عناصر جمع العملاء والتحويل عبر الصفحات الأساسية.",
    },
    {
      id: "footer",
      titleEn: "Bottom section",
      titleAr: "أسفل الصفحة",
      descriptionEn: "Shared footer copy, trust rows, and legal/support links.",
      descriptionAr: "النصوص المشتركة بأسفل الصفحة وروابط الدعم والثقة.",
    },
  ] as const;

  const projectCount = projects.length;
  const totalUnits = projects.reduce((sum, project) => sum + project.units.length, 0);
  const finishingCount = services.finishingPackages.length;
  const smartCount = services.smartPackages.length + services.smartDevices.length;

  return (
    <SaaSPageShell
      title={pickAdminText(locale, "Website Map", "خريطة الموقع")}
      description={pickAdminText(
        locale,
        "See every page, shared section, and where each edit appears before you open the editor.",
        "شاهد كل صفحة وكل عنصر مشترك واعرف أين يظهر كل تعديل قبل فتح المحرر.",
      )}
    >
      <div className="grid gap-6">
        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {[
            {
              labelEn: "Published projects",
              labelAr: "المشروعات المنشورة",
              value: projectCount,
              noteEn: "Project detail pages fed from the catalog.",
              noteAr: "صفحات تفاصيل المشروعات مرتبطة بالكتالوج الحالي.",
            },
            {
              labelEn: "Listed units",
              labelAr: "الوحدات المدرجة",
              value: totalUnits,
              noteEn: "Units appear inside project details and listing flows.",
              noteAr: "الوحدات تظهر داخل التفاصيل وصفحات العرض.",
            },
            {
              labelEn: "Finishing offers",
              labelAr: "عروض التشطيب",
              value: finishingCount,
              noteEn: "Packages and pricing sections on finishing pages.",
              noteAr: "الباقات والتسعير داخل صفحات التشطيب.",
            },
            {
              labelEn: "Smart home items",
              labelAr: "عناصر المنزل الذكي",
              value: smartCount,
              noteEn: "Devices and bundles shown on smart-home experiences.",
              noteAr: "الأجهزة والباقات المعروضة في تجربة المنزل الذكي.",
            },
          ].map((card) => (
            <div key={card.labelEn} className="rounded-[28px] border border-white/10 bg-white/[0.05] p-5">
              <p className="text-xs uppercase tracking-[0.2em] text-white/42">
                {locale === "ar" ? card.labelAr : card.labelEn}
              </p>
              <strong className="mt-3 block font-serif text-4xl text-white">{card.value}</strong>
              <p className="mt-3 text-sm leading-7 text-white/62">
                {locale === "ar" ? card.noteAr : card.noteEn}
              </p>
            </div>
          ))}
        </section>

        <section className="rounded-[32px] border border-white/10 bg-white/[0.05] p-5 md:p-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-[#f2c16b]">
                {pickAdminText(locale, "Website pages", "صفحات الموقع")}
              </p>
              <h2 className="mt-2 font-serif text-3xl text-white">
                {pickAdminText(locale, "Open a page and know what you are editing.", "افتح الصفحة واعرف بالضبط ماذا تعدّل.")}
              </h2>
            </div>
            <Link
              href="/admin/settings"
              className="inline-flex items-center justify-center rounded-xl border border-[#f2c16b] bg-[#f2c16b]/10 px-4 py-2 text-sm font-medium text-[#f2c16b] transition hover:bg-[#f2c16b]/15"
            >
              {pickAdminText(locale, "Open website editor", "افتح محرر الموقع")}
            </Link>
          </div>

          <div className="mt-6 grid gap-4 xl:grid-cols-2">
            {mapNodes.map((node) => {
              const enabledCount = countCompleted(node.items);
              return (
                <article key={node.id} className="rounded-[28px] border border-white/10 bg-black/20 p-5">
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div>
                      <p className="text-xs uppercase tracking-[0.2em] text-white/42">
                        {locale === "ar" ? "صفحة" : "Page"}
                      </p>
                      <h3 className="mt-2 text-2xl font-semibold text-white">
                        {locale === "ar" ? node.titleAr : node.titleEn}
                      </h3>
                      <p className="mt-2 text-sm leading-7 text-white/62">
                        {locale === "ar" ? node.descriptionAr : node.descriptionEn}
                      </p>
                    </div>
                    <div className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white/72">
                      <span className="block text-[11px] uppercase tracking-[0.2em] text-white/40">
                        {pickAdminText(locale, "Visible sections", "الأقسام الظاهرة")}
                      </span>
                      <strong className="mt-2 block text-2xl font-semibold text-white">
                        {enabledCount}/{node.items.length}
                      </strong>
                    </div>
                  </div>

                  <div className="mt-5 flex flex-wrap gap-2">
                    {node.items.map((item) => (
                      <span
                        key={item.id}
                        className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs ${
                          item.enabled
                            ? "border-emerald-400/30 bg-emerald-500/10 text-emerald-200"
                            : "border-white/10 bg-black/25 text-white/55"
                        }`}
                      >
                        <span className={`h-2 w-2 rounded-full ${item.enabled ? "bg-emerald-400" : "bg-white/20"}`} />
                        {item.label}
                      </span>
                    ))}
                  </div>

                  <div className="mt-5 flex flex-wrap gap-3">
                    <Link
                      href="/admin/settings"
                      className="inline-flex items-center justify-center rounded-xl border border-white/12 bg-white/[0.04] px-4 py-2 text-sm text-white/78 transition hover:bg-white/8 hover:text-white"
                    >
                      {pickAdminText(locale, "Edit this page", "عدّل هذه الصفحة")}
                    </Link>
                    <Link
                      href={`${PUBLIC_SITE_URL}${node.path}`}
                      target="_blank"
                      className="inline-flex items-center justify-center rounded-xl border border-[#f2c16b]/40 bg-[#f2c16b]/10 px-4 py-2 text-sm text-[#f2c16b] transition hover:bg-[#f2c16b]/15"
                    >
                      {pickAdminText(locale, "Open on website", "افتحها على الموقع")}
                    </Link>
                  </div>
                </article>
              );
            })}
          </div>
        </section>

        <section className="rounded-[32px] border border-white/10 bg-white/[0.05] p-5 md:p-6">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-[#f2c16b]">
              {pickAdminText(locale, "Shared elements", "العناصر المشتركة")}
            </p>
            <h2 className="mt-2 font-serif text-3xl text-white">
              {pickAdminText(locale, "These edits affect more than one page.", "هذه التعديلات تؤثر على أكثر من صفحة.")}
            </h2>
            <p className="mt-3 max-w-3xl text-sm leading-7 text-white/62">
              {pickAdminText(
                locale,
                "Use this section before editing shared headers, lead modules, and footer copy so you know how wide the impact is.",
                "استخدم هذا الجزء قبل تعديل الهيدر أو نموذج العملاء أو أسفل الصفحة حتى تعرف مدى تأثير التعديل.",
              )}
            </p>
          </div>

          <div className="mt-6 grid gap-4 xl:grid-cols-3">
            {sharedZones.map((zone) => {
              const zoneItems = sharedBlocks.filter((block) => block.zone === zone.id);
              return (
                <article key={zone.id} className="rounded-[28px] border border-white/10 bg-black/20 p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="text-xl font-semibold text-white">
                        {locale === "ar" ? zone.titleAr : zone.titleEn}
                      </h3>
                      <p className="mt-2 text-sm leading-7 text-white/62">
                        {locale === "ar" ? zone.descriptionAr : zone.descriptionEn}
                      </p>
                    </div>
                    <span className="rounded-full border border-white/10 bg-white/[0.05] px-3 py-1 text-xs text-white/70">
                      {zoneItems.length}
                    </span>
                  </div>

                  <div className="mt-5 grid gap-3">
                    {zoneItems.length ? (
                      zoneItems.map((block) => (
                        <div key={block.id} className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3">
                          <div className="flex items-center justify-between gap-3">
                            <strong className="text-sm text-white">
                              {(locale === "ar" ? block.label.ar : block.label.en) || block.id}
                            </strong>
                            <span
                              className={`rounded-full px-2 py-1 text-[11px] ${
                                block.enabled
                                  ? "border border-emerald-400/30 bg-emerald-500/10 text-emerald-200"
                                  : "border border-white/10 bg-black/25 text-white/55"
                              }`}
                            >
                              {block.enabled
                                ? pickAdminText(locale, "Visible", "ظاهر")
                                : pickAdminText(locale, "Hidden", "مخفي")}
                            </span>
                          </div>
                          <p className="mt-2 text-xs text-white/52">
                            {pickAdminText(locale, "Appears in", "يظهر في")}{" "}
                            <span className="text-white/72">
                              {block.pages.map((page) => {
                                const match = mapNodes.find((node) => node.id === page);
                                return locale === "ar" ? match?.titleAr ?? page : match?.titleEn ?? page;
                              }).join(" · ")}
                            </span>
                          </p>
                        </div>
                      ))
                    ) : (
                      <div className="rounded-2xl border border-dashed border-white/10 bg-black/20 px-4 py-6 text-sm text-white/55">
                        {pickAdminText(locale, "No shared elements found in this area yet.", "لا توجد عناصر مشتركة هنا حتى الآن.")}
                      </div>
                    )}
                  </div>

                  <div className="mt-5 flex flex-wrap gap-3">
                    <Link
                      href="/admin/settings"
                      className="inline-flex items-center justify-center rounded-xl border border-white/12 bg-white/[0.04] px-4 py-2 text-sm text-white/78 transition hover:bg-white/8 hover:text-white"
                    >
                      {pickAdminText(locale, "Edit shared content", "عدّل المحتوى المشترك")}
                    </Link>
                    <Link
                      href={PUBLIC_SITE_URL}
                      target="_blank"
                      className="inline-flex items-center justify-center rounded-xl border border-[#f2c16b]/40 bg-[#f2c16b]/10 px-4 py-2 text-sm text-[#f2c16b] transition hover:bg-[#f2c16b]/15"
                    >
                      {pickAdminText(locale, "Open website", "افتح الموقع")}
                    </Link>
                  </div>
                </article>
              );
            })}
          </div>
        </section>
      </div>
    </SaaSPageShell>
  );
}
