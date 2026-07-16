import { LeadForm } from "@/components/lead-form";
import { SectionTitle } from "@/components/section-title";
import { getSmartDevices, getSmartPackages } from "@/lib/repository";
import { getCurrentAdminLocale } from "@/lib/admin-locale-server";
import { pickAdminText } from "@/lib/admin-locale";

export const dynamic = "force-dynamic";

export default async function SmartHomePage() {
  const locale = await getCurrentAdminLocale();
  const t = (en: string, ar: string) => pickAdminText(locale, en, ar);

  const [devices, packages] = await Promise.all([getSmartDevices(), getSmartPackages()]);

  return (
    <div>
      <section className="smart-hero py-20">
        <div className="mx-auto grid w-[min(1180px,calc(100%-1.5rem))] gap-8 lg:grid-cols-[1fr_0.95fr]">
          <div>
            <SectionTitle
              eyebrow={t("Smart Home", "المنزل الذكي")}
              title={t("A modular smart living flow with devices, packages, and setup requests.", "رحلة معيشة ذكية مرنة تضم الأجهزة والباقات وطلبات التركيب.")}
              description={t("The Smart Home experience is no longer a one-screen promo. It now has reusable device data, package logic, and a dedicated installation funnel.", "تجربة المنزل الذكي لم تعد عرضاً 단 экран واحد. أصبحت الآن بيانات أجهزة قابلة لإعادة الاستخدام ومنطق باقات ومسار تركيب مخصص.")}
            />
            <div className="mt-6 flex flex-wrap gap-3">
              {devices.slice(0, 3).map((device) => (
                <span key={device.id} className="rounded-full border border-white/15 px-3 py-2 text-xs text-white/74">
                  {device.name}
                </span>
              ))}
            </div>
          </div>
          <div className="rounded-[32px] border border-white/10 bg-white/5 p-6">
            <p className="text-xs uppercase tracking-[0.24em]" style={{ color: "#dba14a" }}>{t("How it works", "كيف تعمل الخدمة")}</p>
            <div className="mt-4 grid gap-3">
              {[t("Consultation", "الاستشارة"), t("Device selection", "اختيار الأجهزة"), t("Installation", "التركيب"), t("Mobile setup", "الإعداد على الجوال")].map((item, index) => (
                <div key={item} className="rounded-[22px] bg-black/20 p-4">
                  <strong className="font-serif text-2xl text-white">{index + 1}. {item}</strong>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="public-section public-section-wide">
        <div className="service-why-grid">
          {[
            { label: t("Solution before device", "الحل قبل الجهاز"), value: t("Define the need", "تحديد الاحتياج"), note: t("The goal is not buying hardware first, but choosing the right automation scenario.", "الهدف ليس شراء الأجهزة أولاً، بل اختيار سيناريو الأتمتة الصحيح.") },
            { label: t("Cleaner setup", "تجهيز أنظف"), value: t("Clearer plan", "خطة أوضح"), note: t("The team maps the installation path before execution.", "يضع الفريق خارطة مسار التركيب قبل التنفيذ.") },
            { label: t("Faster decision", "قرار أسرع"), value: t("Better package fit", "باقة أكثر ملاءمة"), note: t("The visitor moves from scattered options into one clearer recommendation.", "ينتقل الزائر من خيارات مبعثرة إلى توصية واحدة أوضح.") },
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
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4" id="smart-use-cases">
          {devices.map((device, index) => (
            <article
              key={device.id}
              className={`rounded-[28px] border border-[rgba(36,27,19,0.08)] bg-white/60 p-6 shadow-lg shadow-black/5 ${
                index === 0 ? "xl:col-span-2" : ""
              }`}
            >
              <h2 className="font-serif text-3xl" style={{ color: "#241b13" }}>{device.name}</h2>
              <p className="mt-3" style={{ color: "rgba(36,27,19,0.68)" }}>{device.summary}</p>
              <ul className="mt-4 grid gap-2 text-sm" style={{ color: "rgba(36,27,19,0.62)" }}>
                {device.benefits.map((benefit, bi) => (
                  <li key={`${benefit}-${bi}`}>- {benefit}</li>
                ))}
              </ul>
            </article>
          ))}
        </div>
      </section>

      <section className="public-section public-section-wide grid gap-6 lg:grid-cols-[1fr_1.1fr]">
        <div>
          <SectionTitle
            eyebrow={t("Most common use cases", "الحالات الأكثر شيوعًا")}
            title={t("From security to automation.", "من الأمان إلى الأتمتة.")}
            description={t("Start with one use case, then expand gradually.", "ابدأ بحالة استخدام واحدة، ثم توسع تدريجياً.")}
          />
          <div className="mt-6 grid gap-3">
            {[
              t("Security and monitoring around entrances and key zones.", "الأمان والمراقبة حول المداخل والمناطق الرئيسية."),
              t("Better control of lighting, curtains, or access.", "تحكم أفضل في الإضاءة أو الستائر أو الدخول."),
              t("A gradual smart-home rollout without overcomplication.", "تطبيق تدريجي للمنزل الذكي بدون تعقيد."),
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
            title={t("Common questions about smart home.", "الأسئلة الشائعة حول المنزل الذكي.")}
            description=""
          />
          <div className="service-faq-grid mt-6">
            {[
              { q: t("Do I need to replace everything at home?", "هل أحتاج استبدال كل شيء في المنزل؟"), a: t("No. You can start with one use case first, then expand gradually.", "لا. يمكنك البدء بحالة استخدام واحدة أولاً، ثم توسع تدريجياً.") },
              { q: t("Will the devices work from my phone?", "هل ستعمل الأجهزة من هاتفي؟"), a: t("Yes. The consultation helps define the best control experience and setup path.", "نعم. الاستشارة تساعد في تحديد أفضل تجربة تحكم ومسار تجهيز.") },
              { q: t("What happens after I submit?", "ماذا يحدث بعد إرسال الطلب؟"), a: t("The team reviews the scenario you need, then recommends the right package or device mix.", "يراجع الفريق السيناريو الذي تحتاجه، ثم يوصي بالباقة أو تركيبة الأجهزة المناسبة.") },
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
          <div className="grid gap-4">
            {packages.map((item, i) => (
              <div key={item.id} className="estate-module-card estate-module-card-cool estate-module-card-dossier rounded-[28px] border border-[rgba(36,27,19,0.08)] bg-white/60 p-6">
                <h2 className="font-serif text-3xl" style={{ color: "#241b13" }}>{item.name}</h2>
                <p className="mt-2" style={{ color: "rgba(36,27,19,0.68)" }}>{item.summary}</p>
                <div className="mt-4 flex flex-wrap gap-2">
                  {item.devices.map((device) => (
                    <span key={device} className="rounded-full border border-[rgba(36,27,19,0.12)] px-3 py-1 text-xs" style={{ color: "rgba(36,27,19,0.76)" }}>
                      {device}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
          <div className="estate-lead-shell estate-lead-shell-atlas" id="smart-consultation-form">
            <LeadForm defaultService="Smart Home Setup" />
          </div>
        </div>
      </section>

      <div className="service-mobile-conversion">
        <a href="#smart-consultation-form" className="estate-primary-button">{t("Request consultation", "اطلب استشارة")}</a>
        <a href="#smart-use-cases" className="estate-secondary-button">{t("Use cases", "حالات الاستخدام")}</a>
      </div>
    </div>
  );
}
