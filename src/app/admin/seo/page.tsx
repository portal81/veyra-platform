import { redirect } from "next/navigation";
import { SaaSPageShell } from "@/components/admin/saas-page-shell";
import { SeoSettingsBuilder } from "@/components/admin/seo-settings-builder";
import { getAdminSession } from "@/lib/admin-auth";
import { getCurrentAdminLocale } from "@/lib/admin-locale-server";
import { pickAdminText } from "@/lib/admin-locale";
import { hasPermission } from "@/lib/admin-session";
import { getSeoPageConfigs } from "@/lib/repository";

export const dynamic = "force-dynamic";

export default async function AdminSeoPage() {
  const locale = await getCurrentAdminLocale();
  const session = await getAdminSession();
  if (!hasPermission(session, "seo.manage")) {
    redirect("/admin");
  }

  const pages = await getSeoPageConfigs();

  return (
    <SaaSPageShell
      title={pickAdminText(locale, "SEO Settings", "إعدادات SEO")}
      description={pickAdminText(
        locale,
        "Control metadata, canonical URLs, and indexing rules per page.",
        "تحكم في الميتا، والروابط الأساسية، وقواعد الأرشفة لكل صفحة.",
      )}
    >
      <SeoSettingsBuilder initialPages={pages} />
    </SaaSPageShell>
  );
}
