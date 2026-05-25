"use client";

import { useEffect, useMemo, useState, useCallback } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAdminLocale } from "@/components/admin/admin-locale-provider";

// ─── Types ──────────────────────────────────────────────────────────────
type NavCommand = {
  id: string;
  labelEn: string;
  labelAr: string;
  hintEn: string;
  hintAr: string;
  href: string;
};

type AICommand = {
  id: string;
  labelEn: string;
  labelAr: string;
  hintEn: string;
  hintAr: string;
  action: string;
};

type CommandGroup = {
  key: string;
  labelEn: string;
  labelAr: string;
};

// ─── Navigation commands ────────────────────────────────────────────────
const NAV_COMMANDS: NavCommand[] = [
  {
    id: "dashboard",
    labelEn: "Dashboard",
    labelAr: "لوحة التحكم",
    hintEn: "Daily priorities, urgent actions, and key metrics.",
    hintAr: "أولويات اليوم والمهام العاجلة والمؤشرات الرئيسية.",
    href: "/admin",
  },
  {
    id: "site-map",
    labelEn: "Website map",
    labelAr: "خريطة الموقع",
    hintEn: "See pages, sections, and where edits will appear.",
    hintAr: "اعرف الصفحات والأقسام وأين سيظهر أي تعديل.",
    href: "/admin/site-map",
  },
  {
    id: "settings",
    labelEn: "Website editor",
    labelAr: "محرر الموقع",
    hintEn: "Edit copy, shared blocks, and page structure.",
    hintAr: "عدّل النصوص والعناصر المشتركة وبنية الصفحات.",
    href: "/admin/settings",
  },
  {
    id: "projects",
    labelEn: "Projects",
    labelAr: "المشروعات",
    hintEn: "Manage projects, units, and project detail content.",
    hintAr: "أدر المشروعات والوحدات ومحتوى صفحاتها.",
    href: "/admin/projects",
  },
  {
    id: "services",
    labelEn: "Services",
    labelAr: "الخدمات",
    hintEn: "Manage finishing and smart-home offers.",
    hintAr: "أدر عروض التشطيب والمنزل الذكي.",
    href: "/admin/services",
  },
  {
    id: "crm",
    labelEn: "Leads & pipeline",
    labelAr: "العملاء وخط المتابعة",
    hintEn: "Follow leads, assignments, and next actions.",
    hintAr: "تابع العملاء والتعيينات والخطوات التالية.",
    href: "/admin/leads",
  },
  {
    id: "users",
    labelEn: "Users & roles",
    labelAr: "المستخدمون والصلاحيات",
    hintEn: "Manage team access and permissions.",
    hintAr: "أدر الفريق والصلاحيات.",
    href: "/admin/users",
  },
  {
    id: "blog",
    labelEn: "Blog articles",
    labelAr: "مقالات المدونة",
    hintEn: "Manage posts, categories, and tags.",
    hintAr: "أدر المقالات والتصنيفات والوسوم.",
    href: "/admin/blog",
  },
  {
    id: "seo",
    labelEn: "Search visibility",
    labelAr: "تحسين الظهور",
    hintEn: "Adjust SEO metadata and indexing decisions.",
    hintAr: "عدّل إعدادات الظهور وقرارات الأرشفة.",
    href: "/admin/seo",
  },
  {
    id: "marketing",
    labelEn: "Tracking & pixels",
    labelAr: "التتبع والبيكسلز",
    hintEn: "Review events, tracking, and marketing connections.",
    hintAr: "راجع الأحداث والتتبع وربط أدوات التسويق.",
    href: "/admin/marketing",
  },
];

// ─── AI Slash Commands ─────────────────────────────────────────────────
const AI_COMMANDS: AICommand[] = [
  {
    id: "summary",
    labelEn: "Summarize page",
    labelAr: "تلخيص الصفحة",
    hintEn: "Ask AI to summarize the current page content.",
    hintAr: "اطلب من AI تلخيص محتوى الصفحة الحالية.",
    action: "/summary",
  },
  {
    id: "handoff",
    labelEn: "Handoff to team",
    labelAr: "تسليم لفريق",
    hintEn: "Assign a lead or task to another team member.",
    hintAr: "أسند عميلًا أو مهمة لعضو فريق آخر.",
    action: "/handoff",
  },
  {
    id: "leads",
    labelEn: "Find leads",
    labelAr: "بحث عن عملاء",
    hintEn: "Search leads by name, email, or phone.",
    hintAr: "ابحث عن العملاء بالاسم أو البريد أو الهاتف.",
    action: "/leads",
  },
  {
    id: "help",
    labelEn: "Show all commands",
    labelAr: "عرض كل الأوامر",
    hintEn: "List all available commands and keyboard shortcuts.",
    hintAr: "اعرض كل الأوامر المتاحة واختصارات لوحة المفاتيح.",
    action: "/help",
  },
];

// ─── Groups ─────────────────────────────────────────────────────────────
const GROUPS: CommandGroup[] = [
  { key: "recent", labelEn: "Recent", labelAr: "مؤخرًا" },
  { key: "navigation", labelEn: "Navigation", labelAr: "التنقل" },
  { key: "ai", labelEn: "AI Commands", labelAr: "أوامر AI" },
];

// ─── Recent nav helpers ────────────────────────────────────────────────
const RECENT_KEY = "veyra_recent_nav";
const MAX_RECENT = 5;

function getRecent(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(RECENT_KEY);
    return raw ? (JSON.parse(raw) as string[]) : [];
  } catch {
    return [];
  }
}

function pushRecent(href: string) {
  try {
    const list = getRecent().filter((h) => h !== href);
    list.unshift(href);
    localStorage.setItem(RECENT_KEY, JSON.stringify(list.slice(0, MAX_RECENT)));
  } catch {
    /* noop */
  }
}

// ─── Component ─────────────────────────────────────────────────────────
export function AdminCommandPalette() {
  const router = useRouter();
  const pathname = usePathname();
  const { locale } = useAdminLocale();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [recent, setRecent] = useState<string[]>([]);

  useEffect(() => {
    setRecent(getRecent());
  }, [open]);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setOpen((value) => !value);
      }
      if (event.key === "Escape") {
        setOpen(false);
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  const isAiMode = query.trim().startsWith("/");
  const aiQuery = isAiMode ? query.trim().slice(1).toLowerCase() : "";

  const filteredNav = useMemo(() => {
    if (isAiMode) return [];
    const q = query.trim().toLowerCase();
    if (!q) return NAV_COMMANDS;
    return NAV_COMMANDS.filter((item) =>
      `${item.labelEn} ${item.labelAr} ${item.hintEn} ${item.hintAr}`.toLowerCase().includes(q),
    );
  }, [query, isAiMode]);

  const filteredAI = useMemo(() => {
    if (!isAiMode) return [];
    if (!aiQuery) return AI_COMMANDS;
    return AI_COMMANDS.filter((item) =>
      `${item.labelEn} ${item.labelAr} ${item.hintEn} ${item.hintAr} ${item.action}`
        .toLowerCase()
        .includes(aiQuery),
    );
  }, [aiQuery, isAiMode]);

  const recentNavCommands = useMemo(() => {
    if (isAiMode || !recent.length) return [];
    const map = new Map(NAV_COMMANDS.map((c) => [c.href, c]));
    return recent.map((href) => map.get(href)).filter(Boolean) as NavCommand[];
  }, [recent, isAiMode]);

  const launcherPositionClass = locale === "ar" ? "left-4" : "right-4";

  const goTo = useCallback(
    (href: string) => {
      setOpen(false);
      setQuery("");
      pushRecent(href);
      router.push(href);
    },
    [router],
  );

  const handleAICommand = useCallback(
    (cmd: AICommand) => {
      setOpen(false);
      setQuery("");
      if (cmd.id === "help") {
        setQuery("");
        setOpen(true);
        return;
      }
      // Future: dispatch to AI co-pilot modal
      // For now, navigate to the most relevant admin page
      const targetMap: Record<string, string> = {
        leads: "/admin/leads",
        handoff: "/admin/leads",
        summary: "/admin",
      };
      const href = targetMap[cmd.id] ?? "/admin";
      pushRecent(href);
      router.push(href);
    },
    [router],
  );

  const showRecent = recentNavCommands.length > 0 && !query.trim() && !isAiMode;

  return (
    <>
      {/* Launcher button */}
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={`admin-shell-panel fixed bottom-4 ${launcherPositionClass} z-30 hidden rounded-full px-4 py-2 text-xs text-neutral-200 shadow-[0_8px_24px_rgba(0,0,0,0.35)] transition hover:border-[#f2c16b]/40 hover:text-white lg:block`}
      >
        {locale === "ar" ? "بحث سريع" : "Quick Search"}{" "}
        <span className="text-neutral-500">Ctrl+K</span>
      </button>

      {/* Overlay */}
      {open ? (
        <div
          className="fixed inset-0 z-[70] bg-black/55 p-4 backdrop-blur-sm"
          onClick={() => setOpen(false)}
        >
          <div
            className="admin-shell-surface mx-auto mt-20 w-full max-w-2xl overflow-hidden rounded-2xl p-0 shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            {/* Search input */}
            <div className="flex items-center gap-2 border-b border-white/8 px-4">
              <span className="text-neutral-500 text-sm">
                {isAiMode ? "/" : "?"}
              </span>
              <input
                autoFocus
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder={
                  locale === "ar"
                    ? "ابحث عن صفحة... أو اكتب / لأوامر AI"
                    : "Search pages... or type / for AI commands"
                }
                className="w-full bg-transparent px-0 py-4 text-sm text-white outline-none placeholder:text-neutral-500"
              />
              <kbd className="hidden rounded-md border border-white/10 bg-black/30 px-1.5 py-0.5 text-[10px] text-neutral-500 lg:inline-block">
                Esc
              </kbd>
            </div>

            {/* Results */}
            <div className="grid max-h-[50vh] gap-0 overflow-y-auto p-2">
              {/* No results */}
              {!filteredNav.length && !filteredAI.length && !showRecent ? (
                <div className="rounded-xl border border-dashed border-white/8 px-4 py-6 text-center text-sm text-neutral-500">
                  {locale === "ar" ? "لا توجد نتائج مطابقة." : "No matching results."}
                  {!isAiMode && (
                    <span className="block mt-1 text-xs text-neutral-600">
                      {locale === "ar"
                        ? "جرّب /help لعرض كل الأوامر"
                        : "Try /help to see all commands"}
                    </span>
                  )}
                </div>
              ) : null}

              {/* Recent group */}
              {showRecent ? (
                <div>
                  <div className="px-3 py-1.5 text-[10px] font-bold tracking-widest uppercase text-neutral-500">
                    {locale === "ar" ? GROUPS[0].labelAr : GROUPS[0].labelEn}
                  </div>
                  {recentNavCommands.map((item) => (
                    <button
                      key={`recent-${item.id}`}
                      type="button"
                      onClick={() => goTo(item.href)}
                      className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition hover:bg-white/[3%]"
                    >
                      <span className="text-neutral-600 text-xs">↻</span>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-white">
                          {locale === "ar" ? item.labelAr : item.labelEn}
                        </p>
                        <p className="text-xs text-neutral-500 truncate">
                          {locale === "ar" ? item.hintAr : item.hintEn}
                        </p>
                      </div>
                    </button>
                  ))}
                </div>
              ) : null}

              {/* AI commands */}
              {filteredAI.length > 0 ? (
                <div>
                  <div className="px-3 py-1.5 text-[10px] font-bold tracking-widest uppercase text-neutral-500">
                    {locale === "ar" ? GROUPS[2].labelAr : GROUPS[2].labelEn}
                  </div>
                  {filteredAI.map((item) => (
                    <button
                      key={`ai-${item.id}`}
                      type="button"
                      onClick={() => handleAICommand(item)}
                      className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition hover:bg-[#f2c16b]/8"
                    >
                      <span className="flex h-6 w-6 items-center justify-center rounded-md border border-white/10 bg-black/20 text-[10px] text-[#f2c16b] font-bold">
                        AI
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-white">
                          {locale === "ar" ? item.labelAr : item.labelEn}
                        </p>
                        <p className="text-xs text-neutral-500 truncate">
                          {locale === "ar" ? item.hintAr : item.hintEn}
                        </p>
                      </div>
                      <span className="shrink-0 rounded-md border border-white/8 bg-black/20 px-1.5 py-0.5 text-[10px] text-neutral-500 font-mono">
                        {item.action}
                      </span>
                    </button>
                  ))}
                </div>
              ) : null}

              {/* Navigation results */}
              {filteredNav.length > 0 ? (
                <div>
                  {showRecent ? null : (
                    <div className="px-3 py-1.5 text-[10px] font-bold tracking-widest uppercase text-neutral-500">
                      {locale === "ar" ? GROUPS[1].labelAr : GROUPS[1].labelEn}
                    </div>
                  )}
                  {filteredNav.map((item) => (
                    <button
                      key={`nav-${item.id}`}
                      type="button"
                      onClick={() => goTo(item.href)}
                      className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition hover:bg-white/[3%] ${
                        pathname === item.href ? "bg-white/[4%]" : ""
                      }`}
                    >
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-white">
                          {locale === "ar" ? item.labelAr : item.labelEn}
                        </p>
                        <p className="text-xs text-neutral-500 truncate">
                          {locale === "ar" ? item.hintAr : item.hintEn}
                        </p>
                      </div>
                      {pathname === item.href ? (
                        <span className="shrink-0 text-[10px] text-[#f2c16b]">
                          {locale === "ar" ? "الحالية" : "Current"}
                        </span>
                      ) : null}
                    </button>
                  ))}
                </div>
              ) : null}
            </div>

            {/* Footer hint */}
            <div className="border-t border-white/8 px-4 py-2 text-[10px] text-neutral-600 flex items-center gap-4">
              <span>
                <kbd className="rounded border border-white/8 bg-black/20 px-1 py-0.5 text-[9px]">↑↓</kbd>
                {" "}{locale === "ar" ? "تنقل" : "Navigate"}
              </span>
              <span>
                <kbd className="rounded border border-white/8 bg-black/20 px-1 py-0.5 text-[9px]">↵</kbd>
                {" "}{locale === "ar" ? "فتح" : "Open"}
              </span>
              <span>
                <kbd className="rounded border border-white/8 bg-black/20 px-1 py-0.5 text-[9px]">/</kbd>
                {" "}{locale === "ar" ? "أوامر AI" : "AI commands"}
              </span>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
