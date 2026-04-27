"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BrandLogo } from "@/components/brand-logo";

export function SiteHeader() {
  const pathname = usePathname();

  // Hide completely for the main admin interface (it has its own SaaS layout)
  if (pathname.startsWith("/admin")) {
    return null;
  }

  if (pathname.startsWith("/auth")) {
    return (
      <header data-preview-id="site-header" className="site-header-shell sticky top-0 z-50 border-b border-white/10 bg-[#120f0d]/78 backdrop-blur-2xl">
        <div className="mx-auto flex w-[min(1280px,calc(100%-1.5rem))] items-center justify-between gap-4 py-4">
          <Link href="/auth/login" className="flex items-center gap-3">
            <BrandLogo size="sm" />
          </Link>
          <div className="flex items-center gap-3">
            <Link href="https://veyra-platform.vercel.app" className="rounded-full border border-white/15 px-4 py-2 text-sm font-medium text-white transition hover:border-[#f2c16b]/50 hover:bg-white/5">
               Open Public Site
            </Link>
          </div>
        </div>
      </header>
    );
  }

  // Fallback for public site or unknown (usually handled by dynamic-app-clean-deploy anyway)
  return null;
}


