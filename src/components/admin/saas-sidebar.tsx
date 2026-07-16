"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import {
  BookText,
  BriefcaseBusiness,
  LayoutDashboard,
  Layers,
  Map,
  Megaphone,
  PlusCircle,
  Search,
  Shield,
  SquarePen,
  Users,
  Wrench,
} from "lucide-react";
import { useAdminLocale } from "@/components/admin/admin-locale-provider";
import { BrandLogo } from "@/components/brand-logo";
import type { PermissionKey } from "@/lib/types";

// ─── Types ──────────────────────────────────────────────────────────────────

type SessionUser = {
  fullName: string;
  role: string;
  permissions: PermissionKey[];
};

type NavItem = {
  href: string;
  key: string;
  icon: React.ComponentType<{ className?: string }>;
  permission?: PermissionKey;
  badgeKey?: "highPriority";
};

type NavGroup = {
  id: "workspace" | "site" | "crm";
  titleEn: string;
  titleAr: string;
  items: NavItem[];
};

// ─── Badge labels ────────────────────────────────────────────────────────────

const roleLabels: Record<string, { en: string; ar: string }> = {
  owner:    { en: "Owner",    ar: "المالك" },
  admin:    { en: "Admin",    ar: "مدير" },
  editor:   { en: "Editor",   ar: "محرر" },
  sales:    { en: "Sales",    ar: "مبيعات" },
  marketer: { en: "Marketer", ar: "تسويق" },
  viewer:   { en: "Viewer",   ar: "مشاهد" },
};

// ─── Nav item labels ─────────────────────────────────────────────────────────

function navLabel(key: string, t: (en: string, ar: string) => string): string {
  const map: Record<string, [string, string]> = {
    dashboard:  ["Today dashboard",         "لوحة اليوم"],
    "site-map": ["Website Map",             "خريطة الموقع"],
    "builder-visual": ["Veyra Visual Studio", "استوديو التصميم المرئي"],
    projects:   ["Projects",               "المشروعات"],
    engineering: ["Engineering & CAD",      "الهندسة والعمليات"],
    services:   ["Services",               "الخدمات"],
    blog:       ["Blog Articles",          "مقالات المدونة"],
    leads:      ["Leads & Pipeline",       "العملاء وخط المتابعة"],
    users:      ["Team & Roles",           "الفريق والصلاحيات"],
    seo:        ["SEO",                    "تحسين الظهور"],
    marketing:  ["Tracking & Pixels",      "التتبع والبيكسلز"],
  };
  const entry = map[key];
  return entry ? t(entry[0], entry[1]) : key;
}

// ─── Navigation structure (3 groups) ─────────────────────────────────────────

const NAV_GROUPS: NavGroup[] = [
  {
    id: "workspace",
    titleEn: "Workspace",
    titleAr: "مساحة العمل",
    items: [
      { href: "/admin", key: "dashboard", icon: LayoutDashboard, permission: "dashboard.view" },
    ],
  },
  {
    id: "site",
    titleEn: "Site",
    titleAr: "الموقع",
    items: [
      { href: "/admin/site-map", key: "site-map", icon: Map,              permission: "settings.manage" },
      { href: "/admin/settings", key: "builder",   icon: SquarePen,       permission: "settings.manage" },
      { href: "/admin/projects", key: "projects",  icon: BriefcaseBusiness, permission: "projects.view" },
      { href: "/admin/engineering", key: "engineering", icon: Wrench,      permission: "projects.view" },
      { href: "/admin/services", key: "services",  icon: Layers,           permission: "services.manage" },
      { href: "/admin/blog",     key: "blog",      icon: BookText,         permission: "blog.manage" },
    ],
  },
  {
    id: "crm",
    titleEn: "CRM & Growth",
    titleAr: "العملاء والنمو",
    items: [
      { href: "/admin/leads",     key: "leads",     icon: Shield,  permission: "leads.view",    badgeKey: "highPriority" },
      { href: "/admin/users",     key: "users",     icon: Users,   permission: "users.view" },
      { href: "/admin/seo",       key: "seo",       icon: Search,  permission: "seo.manage" },
      { href: "/admin/marketing", key: "marketing", icon: Megaphone, permission: "tracking.manage" },
    ],
  },
];

const LINK_PERMISSIONS: Record<string, PermissionKey> = {
  "/admin":           "dashboard.view",
  "/admin/site-map":  "settings.manage",
  "/admin/settings":  "settings.manage",
  "/admin/projects":  "projects.view",
  "/admin/engineering": "projects.view",
  "/admin/services":  "services.manage",
  "/admin/blog":      "blog.manage",
  "/admin/leads":     "leads.view",
  "/admin/users":     "users.view",
  "/admin/seo":       "seo.manage",
  "/admin/marketing": "tracking.manage",
};

// ─── Shared hook ─────────────────────────────────────────────────────────────

function useSessionAndBadges() {
  const [sessionUser, setSessionUser] = useState<SessionUser | null>(null);
  const [highPriorityCount, setHighPriorityCount] = useState(0);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => (r.ok ? r.json() : { user: null }))
      .then((p) => setSessionUser(p.user ?? null))
      .catch(() => setSessionUser(null));

    // Fetch high-priority open leads count for badge
    fetch("/api/admin/leads?badge=1")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data?.highPriority !== undefined) setHighPriorityCount(data.highPriority);
      })
      .catch(() => {});
  }, []);

  return { sessionUser, highPriorityCount };
}

// ─── Desktop Sidebar ─────────────────────────────────────────────────────────

export function SaaSAdminSidebar() {
  const pathname = usePathname();
  const { locale, setLocale, isPending, t } = useAdminLocale();
  const { sessionUser, highPriorityCount } = useSessionAndBadges();
  const isRtl = locale === "ar";

  function isActive(href: string) {
    return href === "/admin" ? pathname === "/admin" : pathname.startsWith(href);
  }

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    window.location.href = "/auth/login";
  }

  const visibleGroups = useMemo(() => {
    return NAV_GROUPS.map((group) => ({
      ...group,
      items: group.items.filter((item) => {
        if (!item.permission) return true;
        if (!sessionUser) return true;
        if (sessionUser.role === "owner" || sessionUser.role === "admin") return true;
        return sessionUser.permissions.includes(item.permission);
      }),
    })).filter((group) => group.items.length > 0);
  }, [sessionUser]);

  return (
    <aside
      className={`fixed bottom-0 top-0 z-40 hidden w-[272px] flex-col bg-[#090807] lg:flex ${
        isRtl ? "right-0 border-l border-neutral-800/60" : "left-0 border-r border-neutral-800/60"
      }`}
      dir={isRtl ? "rtl" : "ltr"}
    >
      {/* Logo */}
      <div className="flex h-16 items-center border-b border-neutral-800/60 px-5">
        <BrandLogo size="sm" />
      </div>

      {/* Nav Groups */}
      <div className="flex-1 overflow-y-auto px-4 py-5 scrollbar-none">
        <div className="flex flex-col gap-5">
          {visibleGroups.map((group) => (
            <div key={group.id}>
              {/* Group Label */}
              <p className="mb-2 px-2 text-[10px] font-semibold uppercase tracking-[0.22em] text-neutral-500">
                {isRtl ? group.titleAr : group.titleEn}
              </p>

              {/* Items */}
              <nav className="flex flex-col gap-0.5">
                {group.items.map((item) => {
                  const Icon = item.icon;
                  const active = isActive(item.href);
                  const badge = item.badgeKey === "highPriority" ? highPriorityCount : 0;

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`admin-shell-nav-item group flex items-center gap-2.5 rounded-2xl px-3.5 py-3 text-sm font-medium transition-all ${
                        active
                          ? "admin-shell-nav-item-active text-[#f6d293]"
                          : "text-neutral-300 hover:text-white"
                      }`}
                    >
                      <Icon
                        className={`h-4 w-4 shrink-0 transition ${
                          active ? "opacity-100" : "opacity-60 group-hover:opacity-90"
                        }`}
                      />
                      <span className="flex-1 truncate">{navLabel(item.key, t)}</span>
                      {badge > 0 && (
                        <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500/90 px-1.5 text-[10px] font-bold text-white">
                          {badge > 99 ? "99+" : badge}
                        </span>
                      )}
                      {active && (
                        <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-brand-gold" />
                      )}
                    </Link>
                  );
                })}
              </nav>

              {/* Quick action for CRM group */}
              {group.id === "crm" && (
                <Link
                  href="/admin/leads"
                  className="admin-shell-muted-card mt-2 flex items-center gap-2 rounded-2xl px-3.5 py-3 text-xs text-neutral-400 transition hover:border-brand-gold/30 hover:text-brand-gold"
                >
                  <PlusCircle className="h-3.5 w-3.5" />
                  {t("New lead", "عميل جديد")}
                </Link>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Footer: Locale + User */}
      <div className="border-t border-neutral-800/60 bg-[#0d0b09] p-4">
        {/* Locale Toggle */}
        <div className="admin-shell-panel mb-4 flex items-center rounded-2xl p-1">
          {(["ar", "en"] as const).map((lang) => (
            <button
              key={lang}
              type="button"
              disabled={isPending}
              onClick={() => setLocale(lang)}
              className={`flex-1 rounded-xl py-2 text-xs font-semibold uppercase tracking-wider transition ${
                locale === lang ? "bg-brand-gold text-black" : "text-neutral-400 hover:text-white"
              }`}
            >
              {lang}
            </button>
          ))}
        </div>

        {/* User row */}
        {sessionUser && (
          <div className="admin-shell-panel mb-4 flex items-center gap-3 rounded-2xl px-3 py-3">
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-brand-gold/15 text-xs font-bold text-brand-gold">
              {sessionUser.fullName.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-semibold text-white">{sessionUser.fullName}</p>
              <p className="text-[10px] uppercase tracking-wider text-neutral-500">
                {roleLabels[sessionUser.role]?.[locale] ?? sessionUser.role}
              </p>
            </div>
          </div>
        )}

        {/* Logout */}
        <button
          type="button"
          onClick={logout}
          className="flex w-full items-center justify-center gap-2 rounded-2xl border border-red-900/25 bg-red-950/20 py-3 text-xs font-medium uppercase tracking-[0.14em] text-red-400 transition hover:bg-red-900/35 hover:text-red-300"
        >
          {t("Logout", "تسجيل الخروج")}
        </button>
      </div>
    </aside>
  );
}

// ─── Mobile Nav (bottom bar — 4 icons) ───────────────────────────────────────

const MOBILE_NAV = [
  { href: "/admin",        icon: LayoutDashboard, labelEn: "Dashboard", labelAr: "اليوم" },
  { href: "/admin/settings", icon: Layers,        labelEn: "Site",      labelAr: "الموقع" },
  { href: "/admin/leads",  icon: Shield,           labelEn: "CRM",       labelAr: "العملاء" },
  { href: "/admin/users",  icon: Users,            labelEn: "Team",      labelAr: "الفريق" },
];

export function SaaSAdminMobileNav() {
  const pathname = usePathname();
  const { locale } = useAdminLocale();
  const isRtl = locale === "ar";
  const { highPriorityCount } = useSessionAndBadges();

  function isActive(href: string) {
    return href === "/admin" ? pathname === "/admin" : pathname.startsWith(href);
  }

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 flex h-16 items-center justify-around border-t border-neutral-800/70 bg-[#0a0908]/97 backdrop-blur-lg lg:hidden"
      dir={isRtl ? "rtl" : "ltr"}
    >
      {MOBILE_NAV.map((item) => {
        const Icon = item.icon;
        const active = isActive(item.href);
        const showBadge = item.href === "/admin/leads" && highPriorityCount > 0;

        return (
          <Link
            key={item.href}
            href={item.href}
            className={`relative flex flex-col items-center gap-1 px-4 py-2 text-[10px] font-medium transition ${
              active ? "text-brand-gold" : "text-neutral-500"
            }`}
          >
            <div className="relative">
              <Icon className="h-5 w-5" />
              {showBadge && (
                <span className="absolute -right-1.5 -top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[9px] font-bold text-white">
                  {highPriorityCount > 9 ? "9+" : highPriorityCount}
                </span>
              )}
            </div>
            <span>{isRtl ? item.labelAr : item.labelEn}</span>
          </Link>
        );
      })}
    </nav>
  );
}
