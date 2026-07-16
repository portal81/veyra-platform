"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { BrandLogo } from "@/components/brand-logo";
import { useAdminLocale } from "@/components/admin/admin-locale-provider";

const NAV_ITEMS = [
  { href: "/", key: "nav:Home" },
  { href: "/projects", key: "nav:Projects" },
  { href: "/finishing", key: "nav:Finishing" },
  { href: "/smart-home", key: "nav:Smart Home" },
  { href: "/book", key: "nav:Book" },
];

export function PublicHeader() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const { t } = useAdminLocale();

  function isActive(href: string) {
    return href === "/" ? pathname === "/" : pathname.startsWith(href);
  }

  return (
    <header className="public-header">
      <div className="public-header-frame">
        <div className="public-header-topline">
          <span className="public-header-chipline">{t("Luxury Real Estate / Finishing / Smart Homes", "عقارات فاخرة / تشطيب / منزل ذكي")}</span>
          <div className="hidden items-center gap-3 lg:flex">
            <Link href="/book" className="public-header-cta">
              {t("Book a Visit", "احجز زيارة")}
            </Link>
          </div>
        </div>

        <div className="public-header-mainrow">
          <Link href="/" className="flex items-center gap-3">
            <BrandLogo size="sm" />
          </Link>

          <nav className="hidden items-center gap-1 lg:flex">
            {NAV_ITEMS.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`site-nav-link ${isActive(item.href) ? "site-nav-link-active" : ""}`}
                style={{ color: isActive(item.href) ? "#241b13" : "rgba(36,27,19,0.78)" }}
              >
                {t(item.key.replace("nav:", ""), item.key.replace("nav:", ""))}
              </Link>
            ))}
          </nav>

          <button
            type="button"
            onClick={() => setMobileOpen(!mobileOpen)}
            className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-[rgba(212,164,79,0.18)] bg-white/80 text-[#241b13] lg:hidden"
          >
            <span className="text-sm font-bold uppercase tracking-widest">{mobileOpen ? "✕" : "☰"}</span>
          </button>
        </div>

        <div className={`public-mobile-panel lg:hidden ${mobileOpen ? "public-mobile-panel-open" : ""}`}>
          <div className="public-mobile-sheet">
            {NAV_ITEMS.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className={`public-mobile-link ${isActive(item.href) ? "public-mobile-link-active" : ""}`}
              >
                <strong className="text-base">{t(item.key.replace("nav:", ""), item.key.replace("nav:", ""))}</strong>
              </Link>
            ))}
            <Link href="/book" onClick={() => setMobileOpen(false)} className="estate-primary-button w-full text-center">
              {t("Book a Visit", "احجز زيارة")}
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
}
