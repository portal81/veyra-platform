import { SaaSPageShell } from "@/components/admin/saas-page-shell";
import { redirect } from "next/navigation";
import { getAdminSession } from "@/lib/admin-auth";
import { getCurrentAdminLocale } from "@/lib/admin-locale-server";
import { pickAdminText } from "@/lib/admin-locale";
import { hasPermission } from "@/lib/admin-session";
import { getSiteSettings } from "@/lib/repository";
import { SettingsPageClient } from "./settings-page-client";

export const dynamic = "force-dynamic";

export default async function AdminSettingsPage() {
  const locale = await getCurrentAdminLocale();
  const session = await getAdminSession();
  if (!hasPermission(session, "settings.manage")) {
    redirect("/admin");
  }

  const settings = await getSiteSettings();

  return (
    <SaaSPageShell
      title={pickAdminText(locale, "Store Settings", "إعدادات المتجر")}
      description={pickAdminText(
        locale,
        "Manage theme, copy, colors, and calculators. Use Live Preview to see changes before saving.",
        "إدارة الثيم والنصوص والألوان والحاسبات. استخدم المعاينة الحية لرؤية التغييرات قبل الحفظ.",
      )}
    >
      <SettingsPageClient initialSettings={settings} locale={locale} />
    </SaaSPageShell>
  );
}
