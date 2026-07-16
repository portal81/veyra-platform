import Image from "next/image";
import { FinishingEstimator } from "@/components/finishing-estimator";
import { LeadForm } from "@/components/lead-form";
import { SectionTitle } from "@/components/section-title";
import { getFinishingPackages } from "@/lib/repository";
import { formatCurrency } from "@/lib/utils";
import { getCurrentAdminLocale } from "@/lib/admin-locale-server";
import { pickAdminText } from "@/lib/admin-locale";

export const dynamic = "force-dynamic";

export default async function FinishingPage() {
  const locale = await getCurrentAdminLocale();
  const t = (en: string, ar: string) => pickAdminText(locale, en, ar);

  const packages = await getFinishingPackages();

  return (
    <div>
      <section className="finishing-hero py-20">
        <div className="mx-auto grid w-[min(1180px,calc(100%-1.5rem))] gap-8 lg:grid-cols-[1fr_0.95fr]">
          <div>
            <SectionTitle
              eyebrow={t("Finishing", "التشطيب")}
              title={t("Structured pricing and packages instead of generic luxury visuals.", "تسعير وباقات منظمة بدل الاكتفاء بصور فاخرة عامة.")}
              description={t("This section is driven by package data, estimation logic, and a direct quote flow that can later be managed from the admin.", "هذا القسم مبني على بيانات الباقات ومنطق التقدير ورحلة طلب عرض سعر مباشرة يمكن إدارتها من لوحة التحكم.")}
            />
            <div className="mt-6 flex flex-wrap gap-3">
              {packages.slice(0, 3).map((item) => (
                <div key={item.id} className="rounded-full border border-white/15 bg-white/8 px-4 py-2">
                  <span className="text-xs text-white/60">{item.name}</span>
                  <strong className="ml-2 text-sm text-white">{formatCurrency(item.pricePerMeter)} / m²</strong>
                </div>
              ))}
            </div>
          </div>
          <div className="estate-tool-shell estate-tool-shell-atlas" style={{ background: "rgba(255,255,255,0.92)", borderColor: "rgba(36,27,19,0.08)" }}>
            <FinishingEstimator />
          </div>
        </div>
      </section>

      <section className="public-section public-section-wide">
        <div className="service-why-grid">
          {[
            { label: t("Pricing clarity", "وضوح التسعير"), value: t("Clear price per meter", "سعر واضح للمتر"), note: t("Packages provide a clearer benchmark before the visit.", "الباقات توفر معياراً أوضح قبل الزيارة.") },
            { label: t("Faster decision", "قرار أسرع"), value: t("Direct comparison", "مقارنة مباشرة"), note: t("Clients compare tiers before speaking to the team.", "العملاء يقارنون الفئات قبل التحدث مع الفريق.") },
            { label: t("Next step clarity", "وضوح الخطوة التالية"), value: t("Quote request", "طلب عرض سعر"), note: t("The visitor knows what happens immediately after submitting.", "الزائر يعرف ماذا يحدث فوراً بعد الإرسال.") },
          ].map((item) => (
            <article key={item.label} className="service-why-card">
              <span style={{ color: "#dba14a", fontSize: "0.72rem", letterSpacing: "0.2em", textTransform: "uppercase", fontWeight: 700 }}>{item.label}</span>
              <h3>{item.value}</h3>
              <p>{item.note}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="public-section public-section-wide">
        <SectionTitle
          eyebrow={t("Packages", "الباقات")}
          title={t("Three tiers, one clear structure.", "ثلاث فئات، هيكل واحد واضح.")}
          description={t("Choose the package closest to your budget and finishing level.", "اختر الباقة الأقرب لميزانيتك ومستوى التشطيب.")}
        />
        <div className="mt-10 grid gap-6">
          {packages.map((item, index) => (
            <article
              key={item.id}
              className={`rounded-[28px] border p-6 md:p-7 lg:grid lg:grid-cols-[0.9fr_1.1fr] lg:items-start ${
                index === 0
                  ? "border-[#dba14a]/30 bg-gradient-to-br from-[#fdf8f0] to-white shadow-xl shadow-[#dba14a]/8"
                  : "border-[rgba(36,27,19,0.08)] bg-white/60"
              }`}
            >
              <div>
                <p className="text-xs uppercase tracking-[0.24em]" style={{ color: "#dba14a" }}>
                  {item.featured ? t("Recommended", "موصى به") : t("Package", "باقة")}
                </p>
                <h2 className="mt-2 font-serif text-4xl" style={{ color: "#241b13" }}>{item.name}</h2>
                <p className="mt-3 text-base leading-8" style={{ color: "rgba(36,27,19,0.68)" }}>{item.summary}</p>
                <strong className="mt-5 block font-serif text-3xl" style={{ color: "#dba14a" }}>
                  {formatCurrency(item.pricePerMeter)} / m²
                </strong>
              </div>
              <div className="mt-4 grid gap-3 lg:mt-0">
                {item.features.map((feature, fi) => (
                  <div key={`${feature}-${fi}`} className="flex items-center gap-3 rounded-xl bg-[rgba(36,27,19,0.04)] px-4 py-3">
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[rgba(219,161,74,0.12)] text-xs font-bold" style={{ color: "#9a651f" }}>0{fi + 1}</span>
                    <p style={{ color: "rgba(36,27,19,0.72)", fontSize: "0.92rem" }}>{feature}</p>
                  </div>
                ))}
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="public-section public-section-wide grid gap-6 lg:grid-cols-[1fr_1.1fr]">
        <div>
          <SectionTitle
            eyebrow={t("How does the journey work?", "كيف تسير الرحلة؟")}
            title={t("From selection to handover.", "من الاختيار إلى التسليم.")}
            description={t("Choose the package closest to your budget, the team reviews the area, then you receive an initial quote.", "اختر الباقة الأقرب لميزانيتك، يراجع الفريق المساحة، ثم تتلقى عرض سعر أولي.")}
          />
          <div className="mt-6 grid gap-3">
            {[
              t("Choose the package closest to your budget and finishing level.", "اختر الباقة الأقرب لميزانيتك ومستوى التشطيب."),
              t("The team reviews the area and type of finishing required.", "يراجع الفريق المساحة ونوع التشطيب المطلوب."),
              t("You receive an initial quote, then a visit or follow-up is arranged.", "تتلقى عرض سعر أولي، ثم يتم تنظيم زيارة أو متابعة."),
            ].map((step, i) => (
              <div key={i} className="service-step-item">
                <strong>0{i + 1}. {step}</strong>
              </div>
            ))}
          </div>
        </div>
        <div>
          <SectionTitle
            eyebrow={t("Frequently asked questions", "أسئلة متكررة")}
            title={t("Common questions about finishing.", "الأسئلة الشائعة حول التشطيب.")}
            description=""
          />
          <div className="service-faq-grid mt-6">
            {[
              { q: t("Is the displayed price final?", "هل السعر المعروض نهائي؟"), a: t("The listed rate is an initial benchmark, then the team confirms details after review or inspection.", "السعر المعروض معيار أولي، ثم يؤكد الفريق التفاصيل بعد المراجعة أو الفحص.") },
              { q: t("Can I request only part of the finishing scope?", "هل يمكنني طلب جزء من نطاق التشطيب فقط؟"), a: t("Yes. The team can guide the scope based on the exact finishing work you need.", "نعم. يمكن للفريق توجيه النطاق بناءً على أعمال التشطيب المحددة التي تحتاجها.") },
              { q: t("What happens after I submit?", "ماذا يحدث بعد إرسال الطلب؟"), a: t("The team confirms the requirement, then prepares the quote or schedules the next step.", "يؤكد الفريق المتطلب، ثم يجهز عرض السعر أو يجدول الخطوة التالية.") },
            ].map((faq, i) => (
              <article key={i} className="service-faq-item">
                <p className="service-faq-q">{faq.q}</p>
                <p className="service-faq-a">{faq.a}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="public-section public-section-wide border-t border-[rgba(212,164,79,0.1)]">
        <div className="grid gap-6 lg:grid-cols-[1fr_1.1fr]">
          <Image
            src="/scenes/before-after.svg"
            alt={t("Before and after finishing concept", "مفهوم قبل وبعد التشطيب")}
            width={1400}
            height={900}
            className="h-full min-h-80 w-full rounded-[32px] object-cover"
          />
          <div className="estate-lead-shell estate-lead-shell-atlas" id="finishing-quote-form">
            <LeadForm defaultService="Finishing Quote" />
          </div>
        </div>
      </section>

      <div className="service-mobile-conversion">
        <a href="#finishing-quote-form" className="estate-primary-button">{t("Get quote", "اطلب عرض سعر")}</a>
        <a href="#finishing-calculator" className="estate-secondary-button">{t("View calculator", "اعرض الحاسبة")}</a>
      </div>
    </div>
  );
}
