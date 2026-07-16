import { LeadForm } from "@/components/lead-form";
import { SectionTitle } from "@/components/section-title";
import { getCurrentAdminLocale } from "@/lib/admin-locale-server";
import { pickAdminText } from "@/lib/admin-locale";

export default async function BookPage() {
  const locale = await getCurrentAdminLocale();
  const t = (en: string, ar: string) => pickAdminText(locale, en, ar);

  return (
    <section className="book-hero py-20">
      <div className="mx-auto grid w-[min(1180px,calc(100%-1.5rem))] gap-8 lg:grid-cols-[0.8fr_1.1fr]">
        <SectionTitle
          eyebrow={t("Book", "الحجز")}
          title={t("One booking surface for projects, finishing, and smart home.", "سطح حجز موحد للمشروعات والتشطيب والمنزل الذكي.")}
          description={t("This page acts as a shared conversion endpoint while the admin domain manages incoming requests.", "هذه الصفحة تعمل كنقطة تحويل مشتركة بينما يدير دومين الإدارة الطلبات الواردة.")}
        />
        <div className="estate-lead-shell estate-lead-shell-atlas">
          <LeadForm />
        </div>
      </div>
    </section>
  );
}
