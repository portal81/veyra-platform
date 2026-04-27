"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAdminLocale } from "@/components/admin/admin-locale-provider";
import { BrandLogo } from "@/components/brand-logo";

export function SiteFooter() {
  const { t } = useAdminLocale();
  const pathname = usePathname();

  // Hide on auth pages and admin pages (admin has its own sidebar layout)
  if (pathname.startsWith("/auth") || pathname.startsWith("/admin")) {
    return null;
  }

  return (
    <footer data-preview-id="site-footer" className="border-t border-white/10 bg-[#0d0a09]">
      <div className="mx-auto flex w-[min(1180px,calc(100%-1.5rem))] flex-col justify-between gap-6 py-8 text-sm text-white/60 md:flex-row md:items-center">
        <div>
          <BrandLogo size="sm" />
          <p className="mt-3">{t("Dedicated operations hub for leads, projects, and team follow-up.", "مركز تشغيل مخصص للعملاء والمشروعات ومتابعة الفريق.")}</p>
        </div>

        <div className="flex flex-wrap gap-4">
          <Link href="/admin">{t("Dashboard", "اللوحة")}</Link>
          <Link href="/admin/projects">{t("Projects", "المشروعات")}</Link>
          <Link href="/admin/leads">{t("Leads", "العملاء")}</Link>
          <Link href="/admin/users">{t("Users", "المستخدمون")}</Link>
          <Link href="https://veyra-platform.vercel.app">{t("Public Site", "الموقع العام")}</Link>
        </div>
      </div>
    </footer>
  );
}

