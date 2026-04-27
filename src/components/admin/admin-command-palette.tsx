"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useAdminLocale } from "@/components/admin/admin-locale-provider";

type CommandItem = {
  id: string;
  labelEn: string;
  labelAr: string;
  hintEn: string;
  hintAr: string;
  href: string;
};

const COMMANDS: CommandItem[] = [
  {
    id: "overview",
    labelEn: "Today dashboard",
    labelAr: "لوحة اليوم",
    hintEn: "Start from the most urgent actions and daily priorities.",
    hintAr: "ابدأ من المهام العاجلة وأولويات اليوم.",
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

export function AdminCommandPalette() {
  const router = useRouter();
  const { locale } = useAdminLocale();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");

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

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return COMMANDS;
    return COMMANDS.filter((item) =>
      `${item.labelEn} ${item.labelAr} ${item.hintEn} ${item.hintAr}`.toLowerCase().includes(q),
    );
  }, [query]);

  const launcherPositionClass = locale === "ar" ? "left-4" : "right-4";

  function goTo(href: string) {
    setOpen(false);
    setQuery("");
    router.push(href);
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={`fixed bottom-4 ${launcherPositionClass} z-30 hidden rounded-full border border-neutral-700 bg-[#11100f]/90 px-4 py-2 text-xs text-neutral-200 shadow-[0_8px_24px_rgba(0,0,0,0.35)] backdrop-blur transition hover:border-neutral-500 hover:text-white lg:block`}
      >
        {locale === "ar" ? "بحث سريع" : "Quick Search"}{" "}
        <span className="text-neutral-500">Ctrl+K</span>
      </button>

      {open ? (
        <div
          className="fixed inset-0 z-[70] bg-black/55 p-4 backdrop-blur-sm"
          onClick={() => setOpen(false)}
        >
          <div
            className="mx-auto mt-20 w-full max-w-2xl rounded-2xl border border-neutral-700 bg-[#12110f] p-4 shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <input
              autoFocus
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={
                locale === "ar" ? "ابحث عن صفحة أو مهمة..." : "Search pages and tasks..."
              }
              className="w-full rounded-xl border border-neutral-700 bg-black/30 px-4 py-3 text-sm text-white outline-none placeholder:text-neutral-500"
            />
            <div className="mt-3 grid max-h-[50vh] gap-2 overflow-y-auto">
              {filtered.length ? (
                filtered.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => goTo(item.href)}
                    className="rounded-xl border border-neutral-800 bg-black/20 px-4 py-3 text-left transition hover:border-[#f2c16b]/40 hover:bg-[#f2c16b]/10"
                  >
                    <p className="text-sm font-semibold text-white">
                      {locale === "ar" ? item.labelAr : item.labelEn}
                    </p>
                    <p className="text-xs text-neutral-400">
                      {locale === "ar" ? item.hintAr : item.hintEn}
                    </p>
                  </button>
                ))
              ) : (
                <div className="rounded-xl border border-neutral-800 bg-black/20 px-4 py-3 text-sm text-neutral-400">
                  {locale === "ar" ? "لا توجد نتائج مطابقة." : "No matching results."}
                </div>
              )}
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
