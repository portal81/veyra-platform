"use client";

import Link from "next/link";
import { BrandLogo } from "@/components/brand-logo";
import { useAdminLocale } from "@/components/admin/admin-locale-provider";

export function PublicFooter() {
  const { t } = useAdminLocale();

  return (
    <footer className="public-footer">
      <div className="public-footer-inner">
        <div className="public-footer-shell">
          <div className="grid gap-4">
            <BrandLogo size="md" />
            <p className="public-footer-tagline">
              {t("Luxury real estate, finishing, and smart home experiences by Veyra.", "تجارب عقارية فاخرة وتشطيب ومنزل ذكي من فيرا.")}
            </p>
            <div className="public-footer-rule" />
            <p className="public-footer-copyright">
              {t("All rights reserved to Veyra Developments.", "جميع الحقوق محفوظة لشركة فيرا للتطوير.")}
            </p>
          </div>

          <div className="public-footer-links">
            <div className="public-footer-col">
              <span className="public-footer-col-label">{t("Explore", "استكشف")}</span>
              <Link href="/projects" className="public-footer-link">{t("Projects", "المشروعات")}</Link>
              <Link href="/finishing" className="public-footer-link">{t("Finishing", "التشطيب")}</Link>
              <Link href="/smart-home" className="public-footer-link">{t("Smart Home", "المنزل الذكي")}</Link>
            </div>

            <div className="public-footer-col">
              <span className="public-footer-col-label">{t("Flows", "المسارات")}</span>
              <Link href="/" className="public-footer-link">{t("Home", "الرئيسية")}</Link>
              <Link href="/book" className="public-footer-link">{t("Book a Visit", "احجز زيارة")}</Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
