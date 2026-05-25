"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { BrandLogo } from "@/components/brand-logo";

const NAV_ITEMS = [
  { href: "/", label: "Home" },
  { href: "/projects", label: "Projects" },
  { href: "/finishing", label: "Finishing" },
  { href: "/smart-home", label: "Smart Home" },
  { href: "/book", label: "Book" },
];

export function SiteHeader() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  if (pathname.startsWith("/admin")) {
    return null;
  }

  return (
    <header
      data-preview-id="site-header"
      className="sticky top-0 z-30 border-b border-white/10 bg-[#120f0d]/78 backdrop-blur-2xl"
    >
      <div className="mx-auto flex w-[min(1280px,calc(100%-1.5rem))] items-center justify-between gap-4 py-4">
        <Link href="/" className="shrink-0">
          <BrandLogo size="sm" />
        </Link>

        <nav className="hidden items-center gap-1 md:flex">
          {NAV_ITEMS.map((item) => {
            const isActive = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href));
            return (
              <Link
                key={item.href}
                href={item.href}
                className={isActive ? "site-nav-link site-nav-link-active" : "site-nav-link"}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="site-mobile-trigger flex items-center gap-2 rounded-full border border-white/10 px-4 py-2.5 text-xs text-white/70 transition hover:border-[#f2c16b]/30 md:hidden"
        >
          Menu
          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d={mobileOpen ? "M6 18L18 6M6 6l12 12" : "M4 6h16M4 12h16M4 18h16"} />
          </svg>
        </button>
      </div>

      <div className={`site-mobile-panel ${mobileOpen ? "site-mobile-panel-open" : ""}`}>
        <div className="mx-auto grid w-[min(1280px,calc(100%-1.5rem))] gap-3 pb-6">
          {NAV_ITEMS.map((item) => {
            const isActive = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href));
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className={isActive ? "site-mobile-link site-mobile-link-active" : "site-mobile-link"}
              >
                <strong className="text-white">{item.label}</strong>
              </Link>
            );
          })}
        </div>
      </div>
    </header>
  );
}
