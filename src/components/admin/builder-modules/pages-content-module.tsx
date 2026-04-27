"use client";

import { useEffect, useMemo, useState } from "react";
import { BuilderSection, LocalizedTextEditor } from "@/components/admin/builder-kit";
import type { HazemPromptRequest } from "@/components/admin/settings-builder";
import type { PreviewFocusTarget } from "@/components/admin/live-preview-panel";
import { BuilderPane, LayoutBlocksEditor, LocalizedListCollectionEditor, MiniSection } from "./shared-builder-ui";
import type {
  DecisionCardCopy,
  FaqItemCopy,
  HomeDashboardStatCopy,
  HomeServiceLine,
  HomeSignal,
  LocalizedText,
  SectionLayoutItem,
  SiteSettings,
  ValueCardCopy,
} from "@/lib/types";
import {
  basicPageFields,
  finishingPageFields,
  homeFields,
  projectDetailFields,
  projectsPageFields,
  smartHomeFields,
} from "@/lib/builder-constants";

type Props = {
  settings: SiteSettings;
  mutateSettings: (recipe: (draft: SiteSettings) => void) => void;
  ui: (en: string, ar?: string) => string;
  t: (en: string, ar: string) => string;
  activeSection: string;
  arEditPlaceholder: (label: string) => string;
  onPreviewFocus?: (focus: PreviewFocusTarget) => void;
  onAskHazem?: (request: HazemPromptRequest) => void;
};
type PageFlow = "choose" | "edit" | "review";
const PUBLIC_SITE_URL = process.env.NEXT_PUBLIC_PUBLIC_SITE_URL ?? "https://veyra-platform.vercel.app";

type BuilderFieldEntry = readonly [string, string, string?, number?];

const defaultLoc: LocalizedText = { en: "", ar: "", color: "#ffffff" };
const DEFAULT_PROJECT_DETAIL_SLUG = "al-hamd-tower";

const layoutFieldMap = {
  home: {
    "service-architecture": ["serviceArchitectureEyebrow", "serviceArchitectureTitle", "serviceArchitectureDescription"],
    "featured-projects": ["featuredEyebrow", "featuredTitle", "featuredDescription"],
    calculators: ["signatureLaunch", "primeInventory", "investmentFlow"],
    "service-modules": ["serviceModulesEyebrow", "serviceModulesTitle", "serviceModulesDescription"],
    "lead-capture": ["leadEyebrow", "leadTitle", "leadDescription"],
  },
  projects: {
    "projects-hero": ["eyebrow", "title", "description"],
    "projects-grid": ["compareTitle", "visitReasonTitle", "bookVisit"],
  },
  finishing: {
    "finishing-hero": ["eyebrow", "title", "description"],
    "finishing-packages": ["recommended", "package", "whyTitle"],
    "finishing-lead": ["stickyPrimary", "stickySecondary", "faqTitle"],
  },
  smartHome: {
    "smart-hero": ["eyebrow", "title", "description"],
    "smart-devices": ["howItWorks", "whyTitle", "useCaseTitle"],
    "smart-packages": ["faqTitle", "stickyPrimary", "stickySecondary"],
  },
  book: {
    "book-hero": ["eyebrow", "title"],
    "book-form": ["title", "description"],
  },
} as const;

const fieldMetaMap = {
  home: Object.fromEntries(homeFields.map(([key, label, as, rows]) => [key, { label, as, rows }])),
  projects: Object.fromEntries(projectsPageFields.map(([key, label, as, rows]) => [key, { label, as, rows }])),
  finishing: Object.fromEntries(finishingPageFields.map(([key, label, as, rows]) => [key, { label, as, rows }])),
  smartHome: Object.fromEntries(smartHomeFields.map(([key, label, as, rows]) => [key, { label, as, rows }])),
  book: Object.fromEntries(basicPageFields.map(([key, label, as, rows]) => [key, { label, as, rows }])),
} as const;

function GroupTabs({
  groups,
  active,
  onChange,
}: {
  groups: readonly { key: string; label: string }[];
  active: string;
  onChange: (key: string) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {groups.map((group) => (
        <button
          key={group.key}
          type="button"
          onClick={() => onChange(group.key)}
          className={`rounded-full border px-4 py-2 text-xs font-semibold uppercase tracking-[0.16em] transition ${
            active === group.key
              ? "border-[#f2c16b]/60 bg-[#f2c16b]/14 text-[#f8d28b]"
              : "border-white/10 bg-black/18 text-white/68 hover:border-white/20 hover:bg-white/[0.04]"
          }`}
        >
          {group.label}
        </button>
      ))}
    </div>
  );
}

function FlowTabs({
  active,
  onChange,
  t,
}: {
  active: PageFlow;
  onChange: (value: PageFlow) => void;
  t: Props["t"];
}) {
  const items: Array<{ key: PageFlow; label: string }> = [
    { key: "choose", label: t("1. Choose group", "1. اختر المجموعة") },
    { key: "edit", label: t("2. Edit group", "2. عدّل المجموعة") },
    { key: "review", label: t("3. Review page", "3. راجع الصفحة") },
  ];
  return (
    <div className="flex flex-wrap gap-2">
      {items.map((item) => (
        <button
          key={item.key}
          type="button"
          onClick={() => onChange(item.key)}
          className={`rounded-full border px-4 py-2 text-xs font-semibold uppercase tracking-[0.16em] transition ${
            active === item.key
              ? "border-[#f2c16b]/60 bg-[#f2c16b]/14 text-[#f8d28b]"
              : "border-white/10 bg-black/18 text-white/68 hover:border-white/20 hover:bg-white/[0.04]"
          }`}
        >
          {item.label}
        </button>
      ))}
    </div>
  );
}

function GroupChooser({
  title,
  description,
  groups,
  active,
  onPick,
}: {
  title: string;
  description: string;
  groups: readonly { key: string; label: string }[];
  active: string;
  onPick: (key: string) => void;
}) {
  return (
    <MiniSection title={title} description={description}>
      <div className="grid gap-4 md:grid-cols-2 2xl:grid-cols-3">
        {groups.map((group, index) => (
          <button
            key={group.key}
            type="button"
            onClick={() => onPick(group.key)}
            className={`grid gap-3 rounded-[24px] border p-4 text-start transition ${
              active === group.key
                ? "border-[#f2c16b]/60 bg-white/8 shadow-[0_0_0_1px_rgba(242,193,107,0.18)]"
                : "border-white/10 bg-black/18 hover:border-white/20 hover:bg-white/[0.04]"
            }`}
          >
            <span className="text-xs uppercase tracking-[0.16em] text-[#f2c16b]">Step {index + 1}</span>
            <span className="text-base font-semibold text-white">{group.label}</span>
          </button>
        ))}
      </div>
    </MiniSection>
  );
}

function PageRail({
  items,
  active,
}: {
  items: readonly { key: string; label: string; status: string }[];
  active: string;
}) {
  return (
    <div className="grid gap-3 md:grid-cols-2 2xl:grid-cols-3">
      {items.map((item) => {
        const isActive = item.key === active;
        return (
          <div
            key={item.key}
            className={`grid gap-2 rounded-[22px] border p-4 transition ${
              isActive
                ? "border-[#f2c16b]/60 bg-[#f2c16b]/10 shadow-[0_0_0_1px_rgba(242,193,107,0.18)]"
                : "border-white/10 bg-black/18"
            }`}
          >
            <div className="flex items-center justify-between gap-3">
              <span className="text-sm font-semibold text-white">{item.label}</span>
              <span className={`rounded-full px-2 py-1 text-[10px] uppercase tracking-[0.16em] ${isActive ? "bg-[#f2c16b]/16 text-[#f8d28b]" : "bg-white/6 text-white/42"}`}>
                {isActive ? "Now" : "Page"}
              </span>
            </div>
            <p className="text-xs text-white/48">{item.status}</p>
          </div>
        );
      })}
    </div>
  );
}

function SectionCanvas({
  title,
  description,
  items,
  active,
  onPick,
}: {
  title: string;
  description: string;
  items: readonly { key: string; label: string }[];
  active: string;
  onPick: (key: string) => void;
}) {
  return (
    <MiniSection title={title} description={description}>
      <div className="grid gap-4 md:grid-cols-2 2xl:grid-cols-3">
        {items.map((item, index) => {
          const isActive = item.key === active;
          return (
            <button
              key={item.key}
              type="button"
              onClick={() => onPick(item.key)}
              className={`grid gap-3 rounded-[24px] border p-4 text-start transition ${
                isActive
                  ? "border-[#f2c16b]/60 bg-white/8 shadow-[0_0_0_1px_rgba(242,193,107,0.18)]"
                  : "border-white/10 bg-black/18 hover:border-white/20 hover:bg-white/[0.04]"
              }`}
            >
              <div className="flex items-center justify-between gap-3">
                <span className="text-xs uppercase tracking-[0.16em] text-[#f2c16b]">Section {index + 1}</span>
                <span className={`rounded-full px-2 py-1 text-[10px] ${isActive ? "bg-[#f2c16b]/16 text-[#f8d28b]" : "bg-white/6 text-white/42"}`}>
                  {isActive ? "Focused" : "Open"}
                </span>
              </div>
              <span className="text-base font-semibold text-white">{item.label}</span>
            </button>
          );
        })}
      </div>
    </MiniSection>
  );
}

function ElementListStrip({
  title,
  description,
  items,
}: {
  title: string;
  description: string;
  items: readonly { label: string; hint: string; tone?: "neutral" | "shared" }[];
}) {
  return (
    <MiniSection title={title} description={description}>
      <div className="grid gap-3 md:grid-cols-2 2xl:grid-cols-3">
        {items.map((item) => (
          <div
            key={`${item.label}-${item.hint}`}
            className={`rounded-[20px] border p-4 ${
              item.tone === "shared" ? "border-[#f2c16b]/30 bg-[#f2c16b]/8" : "border-white/10 bg-black/18"
            }`}
          >
            <p className="text-sm font-semibold text-white">{item.label}</p>
            <p className="mt-2 text-xs leading-6 text-white/52">{item.hint}</p>
          </div>
        ))}
      </div>
    </MiniSection>
  );
}

function ReviewStatCard({
  label,
  value,
}: {
  label: string;
  value: string | number;
}) {
  return (
    <div className="rounded-[20px] border border-white/10 bg-black/18 p-4">
      <p className="text-xs uppercase tracking-[0.16em] text-white/42">{label}</p>
      <strong className="mt-2 block text-white">{value}</strong>
    </div>
  );
}

function PageReviewSection({
  title,
  description,
  stats,
}: {
  title: string;
  description: string;
  stats: Array<{ label: string; value: string | number }>;
}) {
  return (
    <MiniSection title={title} description={description}>
      <div className="grid gap-4 md:grid-cols-2 2xl:grid-cols-3">
        {stats.map((stat) => (
          <ReviewStatCard key={stat.label} label={stat.label} value={stat.value} />
        ))}
      </div>
    </MiniSection>
  );
}

function pageSectionMeta(
  activeSection: string,
  groups: {
    home: string;
    projects: string;
    finishing: string;
    smart: string;
    book: string;
  },
  t: (en: string, ar: string) => string,
): PreviewFocusTarget | null {
  if (activeSection === "home-builder") {
    const targetId =
      groups.home === "services"
        ? "home-services"
        : groups.home === "signals"
          ? "home-signals"
          : groups.home === "journeys"
            ? "home-journeys"
            : groups.home === "booking"
              ? "lead-form"
              : "page-hero";
    return {
      page: "/",
      publicUrl: "/",
      targetId,
      title: t("Homepage", "الصفحة الرئيسية"),
      subtitle: t("Focused group on the current page", "المجموعة التي تعدلها الآن داخل الصفحة"),
    };
  }

  if (activeSection === "projects-builder") {
    return {
      page: "/projects",
      publicUrl: "/projects",
      targetId: groups.projects === "journey" ? "projects-journey" : "page-hero",
      title: t("Projects page", "صفحة المشروعات"),
      subtitle: t("Focused group on the current page", "المجموعة التي تعدلها الآن داخل الصفحة"),
    };
  }

  if (activeSection === "finishing-builder") {
    return {
      page: "/finishing",
      publicUrl: "/finishing",
      targetId: groups.finishing === "proof" ? "finishing-proof" : "page-hero",
      title: t("Finishing page", "صفحة التشطيب"),
      subtitle: t("Focused group on the current page", "المجموعة التي تعدلها الآن داخل الصفحة"),
    };
  }

  if (activeSection === "smart-builder") {
    return {
      page: "/smart-home",
      publicUrl: "/smart-home",
      targetId: groups.smart === "steps" ? "smart-steps" : "page-hero",
      title: t("Smart home page", "صفحة المنزل الذكي"),
      subtitle: t("Focused group on the current page", "المجموعة التي تعدلها الآن داخل الصفحة"),
    };
  }

  if (activeSection === "book-builder") {
    return {
      page: "/book",
      publicUrl: "/book",
      targetId: groups.book === "core" ? "lead-form" : "page-hero",
      title: t("Booking page", "صفحة الحجز"),
      subtitle: t("Focused group on the current page", "المجموعة التي تعدلها الآن داخل الصفحة"),
    };
  }

  if (activeSection === "project-detail-builder") {
    return {
      page: "/projects",
      publicUrl: `/projects/${DEFAULT_PROJECT_DETAIL_SLUG}`,
      targetId: "project-detail-hero",
      title: t("Project detail page", "صفحة تفاصيل المشروع"),
      subtitle: t("Preview opens a real project detail page", "المعاينة تفتح صفحة مشروع فعلية"),
    };
  }

  return null;
}

function PagePreviewActions({
  focus,
  t,
  onPreviewFocus,
}: {
  focus: PreviewFocusTarget | null;
  t: (en: string, ar: string) => string;
  onPreviewFocus?: (focus: PreviewFocusTarget) => void;
}) {
  if (!focus) return null;
  return (
    <div className="flex flex-wrap items-center gap-2">
      <button
        type="button"
        onClick={() => onPreviewFocus?.(focus)}
        className="rounded-full border border-[#f2c16b]/35 bg-[#f2c16b]/10 px-4 py-2 text-xs font-semibold text-[#f8d28b] transition hover:bg-[#f2c16b]/15"
      >
        {t("Show in live preview", "اعرضها في المعاينة الحية")}
      </button>
      <a
        href={`${PUBLIC_SITE_URL}${focus.publicUrl ?? focus.page}${focus.targetId ? `?focus=${focus.targetId}` : ""}`}
        target="_blank"
        rel="noreferrer"
        className="rounded-full border border-white/10 bg-black/18 px-4 py-2 text-xs font-semibold text-white/72 transition hover:bg-white/[0.05]"
      >
        {t("Open on website", "افتحها على الموقع")}
      </a>
      <span className="rounded-full border border-white/10 bg-black/18 px-3 py-2 text-[11px] text-white/45">
        {focus.title}
      </span>
    </div>
  );
}

function OwnershipNotice({
  scope,
  ownerLabel,
  ownerHint,
  href,
  t,
}: {
  scope: "local" | "catalog";
  ownerLabel: string;
  ownerHint: string;
  href?: string;
  t: Props["t"];
}) {
  return (
    <div className="admin-shell-muted-card grid gap-3 rounded-[22px] p-4">
      <div className="flex flex-wrap items-center gap-2">
        <span
          className={`rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] ${
            scope === "catalog" ? "bg-[#f2c16b]/16 text-[#f8d28b]" : "bg-white/8 text-white/70"
          }`}
        >
          {scope === "catalog" ? t("Managed in source", "تدار من المصدر") : t("Managed here", "تدار هنا")}
        </span>
        <span className="rounded-full bg-black/30 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-white/42">
          {ownerLabel}
        </span>
      </div>
      <p className="text-sm leading-6 text-white/62">{ownerHint}</p>
      {href ? (
        <a
          href={href}
          className="admin-shell-button-secondary inline-flex w-fit items-center rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-[0.16em]"
        >
          {t("Open source", "افتح المصدر")}
        </a>
      ) : null}
    </div>
  );
}

function PreviewChoiceGrid({
  title,
  description,
  items,
  valueMap,
  onChange,
  ui,
  arEditPlaceholder,
}: {
  title: string;
  description: string;
  items: readonly BuilderFieldEntry[];
  valueMap: Record<string, LocalizedText>;
  onChange: (field: string, next: LocalizedText) => void;
  ui: (label: string) => string;
  arEditPlaceholder: (label: string) => string;
}) {
  const [selectedField, setSelectedField] = useState(items[0]?.[0] ?? "");
  const [editorOpen, setEditorOpen] = useState(true);
  const activeEntry = items.find(([field]) => field === selectedField) ?? items[0];

  useEffect(() => {
    if (activeEntry) setEditorOpen(true);
  }, [activeEntry?.[0]]);

  if (!activeEntry) return null;

  const [field, label, as = "input", rows = 2] = activeEntry;
  const activeValue = valueMap[field] ?? defaultLoc;

  return (
    <MiniSection title={title} description={description}>
      <div className="grid gap-4 2xl:grid-cols-[minmax(0,1fr)_420px]">
        <div className="grid gap-4 2xl:grid-cols-2">
          {items.map(([itemField, itemLabel]) => {
            const value = valueMap[itemField] ?? defaultLoc;
            const isActive = itemField === field;
            const englishPreview = value.en?.trim() || "Not edited yet";
            const arabicPreview = value.ar?.trim() || "لم يتم تعديله بعد";

            return (
              <button
                key={itemField}
                type="button"
                onClick={() => setSelectedField(itemField)}
                className={`grid gap-3 rounded-[24px] border p-4 text-start transition ${
                  isActive
                    ? "border-[#f2c16b]/60 bg-white/8 shadow-[0_0_0_1px_rgba(242,193,107,0.18)]"
                    : "border-white/10 bg-black/18 hover:border-white/20 hover:bg-white/[0.04]"
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#f2c16b]">{ui(itemLabel)}</p>
                    <p className="mt-2 text-sm font-semibold text-white/92">{englishPreview}</p>
                  </div>
                  <span
                    className="mt-1 inline-flex h-3 w-3 shrink-0 rounded-full border border-white/15"
                    style={{ backgroundColor: value.color || "#ffffff" }}
                  />
                </div>
                <div className="grid gap-1 rounded-[18px] border border-white/8 bg-black/20 p-3">
                  <span className="text-[11px] uppercase tracking-[0.16em] text-white/36">AR preview</span>
                  <span className="line-clamp-2 text-sm text-white/72">{arabicPreview}</span>
                </div>
              </button>
            );
          })}
        </div>

        <div className="rounded-[28px] border border-white/10 bg-black/18 p-5 shadow-[0_16px_60px_rgba(0,0,0,0.18)] xl:sticky xl:top-6">
          <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#f2c16b]">Focused editor</p>
              <h5 className="mt-2 font-serif text-2xl text-white">{ui(label)}</h5>
              <p className="mt-2 text-sm text-white/58">اختر عنصرًا واحدًا من البطاقات، عدله هنا، ثم انتقل للعنصر التالي بدون زحام بصري.</p>
            </div>
            <button
              type="button"
              onClick={() => setEditorOpen((value) => !value)}
              className="rounded-full border border-white/10 bg-black/25 px-4 py-2 text-xs font-semibold text-white/72 transition hover:bg-white/[0.05]"
            >
              {editorOpen ? "Hide editor" : "Open editor"}
            </button>
          </div>
          {editorOpen ? (
            <LocalizedTextEditor
              label={ui(label)}
              value={activeValue}
              onChange={(next) => onChange(field, next)}
              as={as as any}
              englishPlaceholder={`Edit ${label.toLowerCase()}`}
              arabicPlaceholder={arEditPlaceholder(label)}
              rows={rows}
            />
          ) : (
            <div className="flex min-h-[220px] items-center justify-center rounded-[18px] border border-dashed border-white/10 px-6 text-center text-sm text-white/45">
              Open the focused editor to keep copy editing calm and item by item.
            </div>
          )}
        </div>
      </div>
    </MiniSection>
  );
}

function CollectionEditor({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return <MiniSection title={title} description={description}>{children}</MiniSection>;
}

function FocusedCollectionPanel({
  title,
  subtitle,
  open,
  onToggle,
  children,
}: {
  title: string;
  subtitle: string;
  open: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="grid gap-4 rounded-[24px] border border-white/10 bg-[#120f0d] p-5 shadow-[0_16px_60px_rgba(0,0,0,0.22)] xl:sticky xl:top-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.18em] text-[#f2c16b]">Focused editor</p>
          <h5 className="mt-2 text-xl font-semibold text-white">{title}</h5>
          <p className="mt-2 max-w-xl text-sm text-white/58">{subtitle}</p>
        </div>
        <button
          type="button"
          onClick={onToggle}
          className="rounded-full border border-white/10 bg-black/25 px-4 py-2 text-xs font-semibold text-white/72 transition hover:bg-white/[0.05]"
        >
          {open ? "Hide editor" : "Open editor"}
        </button>
      </div>
      {open ? (
        children
      ) : (
        <div className="flex min-h-[220px] items-center justify-center rounded-[18px] border border-dashed border-white/10 px-6 text-center text-sm text-white/45">
          Open the focused editor to keep this lane lighter while you work item by item.
        </div>
      )}
    </div>
  );
}

function HomeServiceLinesEditor({ items, onChange }: { items: HomeServiceLine[]; onChange: (next: HomeServiceLine[]) => void }) {
  const [selectedId, setSelectedId] = useState(items[0]?.id ?? "");
  const [editorOpen, setEditorOpen] = useState(true);
  const current = items.find((item) => item.id === selectedId) ?? items[0];
  if (!current) return null;

  useEffect(() => {
    setEditorOpen(true);
  }, [current.id]);

  return (
    <CollectionEditor title="Home service cards" description="اختر بطاقة خدمة واحدة من المعاينات ثم عدّل محتواها.">
      <div className="grid gap-4 2xl:grid-cols-[minmax(0,1fr)_420px]">
        <div className="grid gap-4 2xl:grid-cols-2">
          {items.map((item, index) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setSelectedId(item.id)}
              className={`grid gap-2 rounded-[24px] border p-4 text-start transition ${
                item.id === current.id ? "border-[#f2c16b]/60 bg-white/8" : "border-white/10 bg-black/18 hover:bg-white/[0.04]"
              }`}
            >
              <span className="text-xs uppercase tracking-[0.16em] text-[#f2c16b]">Card {index + 1}</span>
              <span className="text-base font-semibold text-white">{item.title.en || "Untitled service card"}</span>
              <span className="line-clamp-2 text-sm text-white/62">{item.copy.en || "No English copy yet"}</span>
            </button>
          ))}
        </div>
        <FocusedCollectionPanel
          title={current.title.en || current.title.ar || "Service card"}
          subtitle="Edit one service card at a time so the lane stays visually calm."
          open={editorOpen}
          onToggle={() => setEditorOpen((value) => !value)}
        >
          <LocalizedTextEditor label="Title" value={current.title} onChange={(next) => onChange(items.map((entry) => (entry.id === current.id ? { ...entry, title: next } : entry)))} as="input" englishPlaceholder="Projects" arabicPlaceholder="المشروعات" rows={2} />
          <LocalizedTextEditor label="Description" value={current.copy} onChange={(next) => onChange(items.map((entry) => (entry.id === current.id ? { ...entry, copy: next } : entry)))} englishPlaceholder="Describe the service line" arabicPlaceholder="وصف الخدمة" rows={4} />
          <div className="grid gap-4 2xl:grid-cols-2">
            <LocalizedTextEditor label="Stat label" value={current.stat} onChange={(next) => onChange(items.map((entry) => (entry.id === current.id ? { ...entry, stat: next } : entry)))} as="input" englishPlaceholder="Residential + Mixed-use" arabicPlaceholder="سكني + متعدد الاستخدامات" rows={2} />
            <LocalizedTextEditor label="CTA label" value={current.link} onChange={(next) => onChange(items.map((entry) => (entry.id === current.id ? { ...entry, link: next } : entry)))} as="input" englishPlaceholder="Open section" arabicPlaceholder="افتح القسم" rows={2} />
          </div>
        </FocusedCollectionPanel>
      </div>
    </CollectionEditor>
  );
}

function HomeSignalsEditor({ items, onChange }: { items: HomeSignal[]; onChange: (next: HomeSignal[]) => void }) {
  const [selectedId, setSelectedId] = useState(items[0]?.id ?? "");
  const [editorOpen, setEditorOpen] = useState(true);
  const current = items.find((item) => item.id === selectedId) ?? items[0];
  if (!current) return null;

  useEffect(() => {
    setEditorOpen(true);
  }, [current.id]);

  return (
    <CollectionEditor title="Hero market signals" description="هذه الإشارات الصغيرة تظهر تحت الهيرو، فحافظ عليها قصيرة وواضحة.">
      <div className="grid gap-4 2xl:grid-cols-[minmax(0,1fr)_420px]">
        <div className="grid gap-4 2xl:grid-cols-2">
        {items.map((item, index) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setSelectedId(item.id)}
            className={`grid gap-2 rounded-[24px] border p-4 text-start transition ${
              item.id === current.id ? "border-[#f2c16b]/60 bg-white/8" : "border-white/10 bg-black/18 hover:bg-white/[0.04]"
            }`}
          >
            <span className="text-xs uppercase tracking-[0.16em] text-[#f2c16b]">Signal {index + 1}</span>
            <span className="text-sm font-semibold text-white">{item.label.en || "Signal label"}</span>
            <span className="text-sm text-white/62">{item.value.en || "Signal value"}</span>
          </button>
        ))}
        </div>
      <FocusedCollectionPanel
        title={current.label.en || current.label.ar || "Signal"}
        subtitle="Keep the hero micro-signals short and edit each one in a focused panel."
        open={editorOpen}
        onToggle={() => setEditorOpen((value) => !value)}
      >
        <div className="grid gap-4 2xl:grid-cols-2">
          <LocalizedTextEditor label="Signal label" value={current.label} onChange={(next) => onChange(items.map((entry) => (entry.id === current.id ? { ...entry, label: next } : entry)))} as="input" englishPlaceholder="Hot zones" arabicPlaceholder="المناطق النشطة" rows={2} />
          <LocalizedTextEditor label="Signal value" value={current.value} onChange={(next) => onChange(items.map((entry) => (entry.id === current.id ? { ...entry, value: next } : entry)))} as="input" englishPlaceholder="Zagazig / New Cairo" arabicPlaceholder="الزقازيق / القاهرة الجديدة" rows={2} />
        </div>
      </FocusedCollectionPanel>
      </div>
    </CollectionEditor>
  );
}

function DashboardStatsEditor({ items, onChange }: { items: HomeDashboardStatCopy[]; onChange: (next: HomeDashboardStatCopy[]) => void }) {
  const [selectedId, setSelectedId] = useState(items[0]?.id ?? "");
  const [editorOpen, setEditorOpen] = useState(true);
  const current = items.find((item) => item.id === selectedId) ?? items[0];
  if (!current) return null;

  useEffect(() => {
    setEditorOpen(true);
  }, [current.id]);

  return (
    <CollectionEditor title="Homepage dashboard stats" description="هذه التسميات توضح معنى الأرقام الحقيقية، فخليها تعريفية لا مكررة.">
      <div className="grid gap-4 2xl:grid-cols-[minmax(0,1fr)_420px]">
        <div className="grid gap-4 2xl:grid-cols-2">
        {items.map((item, index) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setSelectedId(item.id)}
            className={`grid gap-2 rounded-[24px] border p-4 text-start transition ${
              item.id === current.id ? "border-[#f2c16b]/60 bg-white/8" : "border-white/10 bg-black/18 hover:bg-white/[0.04]"
            }`}
          >
            <span className="text-xs uppercase tracking-[0.16em] text-[#f2c16b]">Stat {index + 1}</span>
            <span className="text-sm font-semibold text-white">{item.label.en || "Stat label"}</span>
            <span className="line-clamp-2 text-sm text-white/62">{item.hint.en || "Hint preview"}</span>
          </button>
        ))}
        </div>
      <FocusedCollectionPanel
        title={current.label.en || current.label.ar || "Dashboard stat"}
        subtitle="The dashboard should feel informative, so edit each stat card with clear focus."
        open={editorOpen}
        onToggle={() => setEditorOpen((value) => !value)}
      >
        <LocalizedTextEditor label="Label" value={current.label} onChange={(next) => onChange(items.map((entry) => (entry.id === current.id ? { ...entry, label: next } : entry)))} as="input" englishPlaceholder="Projects" arabicPlaceholder="المشروعات" rows={2} />
        <LocalizedTextEditor label="Hint" value={current.hint} onChange={(next) => onChange(items.map((entry) => (entry.id === current.id ? { ...entry, hint: next } : entry)))} englishPlaceholder="Hint for the stat card" arabicPlaceholder="وصف مختصر للكارت" rows={3} />
      </FocusedCollectionPanel>
      </div>
    </CollectionEditor>
  );
}

function DecisionCardsEditor({ title, description, items, onChange }: { title: string; description: string; items: DecisionCardCopy[]; onChange: (next: DecisionCardCopy[]) => void }) {
  const [selectedId, setSelectedId] = useState(items[0]?.id ?? "");
  const [editorOpen, setEditorOpen] = useState(true);
  const current = items.find((item) => item.id === selectedId) ?? items[0];
  if (!current) return null;

  useEffect(() => {
    setEditorOpen(true);
  }, [current.id]);

  return (
    <CollectionEditor title={title} description={description}>
      <div className="grid gap-4 2xl:grid-cols-[minmax(0,1fr)_420px]">
        <div className="grid gap-4 2xl:grid-cols-2">
        {items.map((item, index) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setSelectedId(item.id)}
            className={`grid gap-2 rounded-[24px] border p-4 text-start transition ${
              item.id === current.id ? "border-[#f2c16b]/60 bg-white/8" : "border-white/10 bg-black/18 hover:bg-white/[0.04]"
            }`}
          >
            <span className="text-xs uppercase tracking-[0.16em] text-[#f2c16b]">Card {index + 1}</span>
            <span className="text-sm font-semibold text-white">{item.title.en || item.label.en || "Decision card"}</span>
            <span className="line-clamp-2 text-sm text-white/62">{item.copy.en || "No English copy yet"}</span>
          </button>
        ))}
        </div>
      <FocusedCollectionPanel
        title={current.title.en || current.title.ar || current.label.en || current.label.ar || "Decision card"}
        subtitle="Focus on one decision path card at a time before moving to the next branch."
        open={editorOpen}
        onToggle={() => setEditorOpen((value) => !value)}
      >
        <LocalizedTextEditor label="Label" value={current.label} onChange={(next) => onChange(items.map((entry) => (entry.id === current.id ? { ...entry, label: next } : entry)))} as="input" englishPlaceholder="Buy or invest" arabicPlaceholder="شراء أو استثمار" rows={2} />
        <LocalizedTextEditor label="Title" value={current.title} onChange={(next) => onChange(items.map((entry) => (entry.id === current.id ? { ...entry, title: next } : entry)))} englishPlaceholder="Primary decision title" arabicPlaceholder="عنوان القرار" rows={3} />
        <LocalizedTextEditor label="Description" value={current.copy} onChange={(next) => onChange(items.map((entry) => (entry.id === current.id ? { ...entry, copy: next } : entry)))} englishPlaceholder="Explain what this path is for" arabicPlaceholder="اشرح هذا المسار" rows={4} />
        <LocalizedTextEditor label="CTA" value={current.cta ?? defaultLoc} onChange={(next) => onChange(items.map((entry) => (entry.id === current.id ? { ...entry, cta: next } : entry)))} as="input" englishPlaceholder="Explore projects" arabicPlaceholder="استكشف المشروعات" rows={2} />
      </FocusedCollectionPanel>
      </div>
    </CollectionEditor>
  );
}

function ValueCardsEditor({ title, description, items, onChange }: { title: string; description: string; items: ValueCardCopy[]; onChange: (next: ValueCardCopy[]) => void }) {
  const [selectedId, setSelectedId] = useState(items[0]?.id ?? "");
  const [editorOpen, setEditorOpen] = useState(true);
  const current = items.find((item) => item.id === selectedId) ?? items[0];
  if (!current) return null;

  useEffect(() => {
    setEditorOpen(true);
  }, [current.id]);

  return (
    <CollectionEditor title={title} description={description}>
      <div className="grid gap-4 2xl:grid-cols-[minmax(0,1fr)_420px]">
        <div className="grid gap-4 2xl:grid-cols-2">
        {items.map((item, index) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setSelectedId(item.id)}
            className={`grid gap-2 rounded-[24px] border p-4 text-start transition ${
              item.id === current.id ? "border-[#f2c16b]/60 bg-white/8" : "border-white/10 bg-black/18 hover:bg-white/[0.04]"
            }`}
          >
            <span className="text-xs uppercase tracking-[0.16em] text-[#f2c16b]">Value card {index + 1}</span>
            <span className="text-sm font-semibold text-white">{item.label.en || "Value label"}</span>
            <span className="line-clamp-2 text-sm text-white/62">{item.note.en || "No note yet"}</span>
          </button>
        ))}
        </div>
      <FocusedCollectionPanel
        title={current.label.en || current.label.ar || "Value card"}
        subtitle="These value cards support trust, so keep the panel focused on one card at a time."
        open={editorOpen}
        onToggle={() => setEditorOpen((value) => !value)}
      >
        <LocalizedTextEditor label="Label" value={current.label} onChange={(next) => onChange(items.map((entry) => (entry.id === current.id ? { ...entry, label: next } : entry)))} as="input" englishPlaceholder="Response speed" arabicPlaceholder="سرعة الاستجابة" rows={2} />
        <LocalizedTextEditor label="Value" value={current.value} onChange={(next) => onChange(items.map((entry) => (entry.id === current.id ? { ...entry, value: next } : entry)))} as="input" englishPlaceholder="Fast follow-up" arabicPlaceholder="متابعة سريعة" rows={2} />
        <LocalizedTextEditor label="Note" value={current.note} onChange={(next) => onChange(items.map((entry) => (entry.id === current.id ? { ...entry, note: next } : entry)))} englishPlaceholder="Explain the value in one paragraph" arabicPlaceholder="اشرح القيمة" rows={4} />
      </FocusedCollectionPanel>
      </div>
    </CollectionEditor>
  );
}

function FaqItemsEditor({ title, description, items, onChange }: { title: string; description: string; items: FaqItemCopy[]; onChange: (next: FaqItemCopy[]) => void }) {
  const [selectedId, setSelectedId] = useState(items[0]?.id ?? "");
  const [editorOpen, setEditorOpen] = useState(true);
  const current = items.find((item) => item.id === selectedId) ?? items[0];
  if (!current) return null;

  useEffect(() => {
    setEditorOpen(true);
  }, [current.id]);

  return (
    <CollectionEditor title={title} description={description}>
      <div className="grid gap-4 2xl:grid-cols-[minmax(0,1fr)_420px]">
        <div className="grid gap-4 xl:grid-cols-1">
        {items.map((item, index) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setSelectedId(item.id)}
            className={`grid gap-2 rounded-[24px] border p-4 text-start transition ${
              item.id === current.id ? "border-[#f2c16b]/60 bg-white/8" : "border-white/10 bg-black/18 hover:bg-white/[0.04]"
            }`}
          >
            <span className="text-xs uppercase tracking-[0.16em] text-[#f2c16b]">FAQ {index + 1}</span>
            <span className="line-clamp-2 text-sm font-semibold text-white">{item.question.en || "Question preview"}</span>
            <span className="line-clamp-2 text-sm text-white/62">{item.answer.en || "Answer preview"}</span>
          </button>
        ))}
        </div>
      <FocusedCollectionPanel
        title={current.question.en || current.question.ar || "FAQ item"}
        subtitle="FAQ works best when you focus on one objection and its answer at a time."
        open={editorOpen}
        onToggle={() => setEditorOpen((value) => !value)}
      >
        <LocalizedTextEditor label="Question" value={current.question} onChange={(next) => onChange(items.map((entry) => (entry.id === current.id ? { ...entry, question: next } : entry)))} englishPlaceholder="Customer question" arabicPlaceholder="سؤال العميل" rows={3} />
        <LocalizedTextEditor label="Answer" value={current.answer} onChange={(next) => onChange(items.map((entry) => (entry.id === current.id ? { ...entry, answer: next } : entry)))} englishPlaceholder="Answer paragraph" arabicPlaceholder="الإجابة" rows={4} />
      </FocusedCollectionPanel>
      </div>
    </CollectionEditor>
  );
}

export function PagesContentModule({ settings, mutateSettings, ui, t, activeSection, arEditPlaceholder, onPreviewFocus, onAskHazem }: Props) {
  const pages = settings.content.pages!;
  const layouts = settings.content.layouts!;
  const [pageFlow, setPageFlow] = useState<PageFlow>("choose");
  const [homeGroup, setHomeGroup] = useState("layout");
  const [projectsGroup, setProjectsGroup] = useState("layout");
  const [finishingGroup, setFinishingGroup] = useState("layout");
  const [smartGroup, setSmartGroup] = useState("layout");
  const [bookGroup, setBookGroup] = useState("layout");
  const activePreviewFocus = pageSectionMeta(
    activeSection,
    {
      home: homeGroup,
      projects: projectsGroup,
      finishing: finishingGroup,
      smart: smartGroup,
      book: bookGroup,
    },
    t,
  );
  const askHazemForLane = (mode: "admin" | "website") => {
    const pageLabel = activePreviewFocus?.title ?? t("Current page", "الصفحة الحالية");
    const laneLabel = activeGroupLabel ?? t("Current lane", "المسار الحالي");
    onAskHazem?.({
      id: Date.now(),
      mode,
      prompt:
        mode === "admin"
          ? t(
              `Review the ${laneLabel} lane on ${pageLabel}. Give me P1/P2/P3 improvements, the biggest UX risk, and the first action to execute now.`,
              `راجع مسار ${laneLabel} داخل ${pageLabel}. اديني تحسينات P1/P2/P3، وأكبر مخاطرة UX، وأول إجراء أنفذه الآن.`,
            )
          : t(
              `Rewrite the ${laneLabel} lane on ${pageLabel} for stronger conversion, a clearer CTA, and shorter copy.`,
              `أعد صياغة مسار ${laneLabel} داخل ${pageLabel} لتحويل أقوى، وCTA أوضح، ونص أقصر.`,
            ),
      sourceLabel: laneLabel,
      pageTitle: pageLabel,
      targetId: activePreviewFocus?.targetId ?? null,
      scope: "local",
    });
  };

  function updatePageText(page: keyof typeof pages, field: string, value: LocalizedText) {
    mutateSettings((draft) => {
      (draft.content.pages![page] as Record<string, LocalizedText>)[field] = value;
    });
  }

  function updateLayout(page: keyof typeof layouts, nextItems: SectionLayoutItem[]) {
    mutateSettings((draft) => {
      draft.content.layouts![page] = nextItems;
    });
  }

  function localizedPreview(value?: LocalizedText | null) {
    const ar = value?.ar?.trim();
    const en = value?.en?.trim();
    return ar || en || "";
  }

  function buildLayoutPreviews(
    pageKey: keyof typeof layoutFieldMap,
    pageContent: Record<string, LocalizedText>,
  ): Record<string, string[]> {
    const pageMap = layoutFieldMap[pageKey];
    return Object.fromEntries(
      (Object.entries(pageMap) as [string, readonly string[]][]).map(([blockId, fieldKeys]) => [
        blockId,
        fieldKeys.map((fieldKey: string) => localizedPreview(pageContent[fieldKey])).filter(Boolean),
      ]),
    );
  }

  function buildLayoutTextEditors(
    pageKey: keyof typeof layoutFieldMap,
    pageContent: Record<string, LocalizedText>,
  ) {
    const pageMap = layoutFieldMap[pageKey];
    const pageFieldMeta = fieldMetaMap[pageKey] as Record<string, { label: string; as: "input" | "textarea"; rows: number }>;
    return Object.fromEntries(
      (Object.entries(pageMap) as [string, readonly string[]][]).map(([blockId, fieldKeys]) => [
        blockId,
        fieldKeys
          .map((fieldKey: string) => {
            const fieldMeta = pageFieldMeta[fieldKey];
            if (!fieldMeta) return null;
            return {
              key: fieldKey,
              label: ui(fieldMeta.label),
              value: pageContent[fieldKey] ?? { en: "", ar: "", color: "#ffffff" },
              as: fieldMeta.as,
              rows: fieldMeta.rows,
              onChange: (next: LocalizedText) => updatePageText(pageKey as keyof typeof pages, fieldKey, next),
            };
          })
          .filter(Boolean),
      ]),
    ) as Record<string, Array<{
      key: string;
      label: string;
      value: LocalizedText;
      as?: "input" | "textarea";
      rows?: number;
      onChange: (next: LocalizedText) => void;
    }>>;
  }

  const pageIntro = useMemo(
    () => ({
      home: t("Start with one homepage lane that already includes the core structure and its key copy.", "ابدأ بمسار واحد في الصفحة الرئيسية يكون فيه الهيكل الأساسي ومعه نصوصه المهمة."),
      projects: t("Projects editing is lighter when structure and core copy live in one lane, then decisions come after.", "تحرير المشروعات أوضح عندما يجتمع الهيكل والنصوص الأساسية في مسار واحد ثم تأتي بطاقات القرار بعده."),
      finishing: t("Finishing now starts with one core lane, then proof and FAQ stay in their own lane.", "صفحة التشطيب تبدأ الآن بمسار أساسي واحد، ثم تبقى الثقة والأسئلة في مسار مستقل."),
      smart: t("Smart-home editing is easier when structure and labels live together before the setup steps.", "تحرير المنزل الذكي أسهل عندما يجتمع الهيكل والنصوص قبل خطوات التركيب."),
      book: t("Booking becomes easier when the structure already carries the core booking copy.", "صفحة الحجز تصبح أوضح عندما يحمل الهيكل نفسه النصوص الأساسية للحجز."),
      detail: t("Project detail labels are long, so they now open one by one.", "تسميات صفحة تفاصيل المشروع كثيرة، لذلك أصبحت تُفتح واحدة تلو الأخرى."),
    }),
    [t],
  );

  useEffect(() => {
    setPageFlow("choose");
  }, [activeSection]);

  const homeGroups = [
    { key: "core", label: t("Core structure", "الهيكل الأساسي") },
    { key: "services", label: t("Service cards", "بطاقات الخدمات") },
    { key: "signals", label: t("Signals + stats", "الإشارات والإحصاءات") },
    { key: "journeys", label: t("Journeys + trust", "الرحلات والثقة") },
    { key: "booking", label: t("Booking prompts", "رسائل الحجز") },
  ] as const;
  const projectsGroups = [
    { key: "core", label: t("Core structure", "الهيكل الأساسي") },
    { key: "journey", label: t("Decision journey", "رحلة القرار") },
  ] as const;
  const finishingGroups = [
    { key: "core", label: t("Core structure", "الهيكل الأساسي") },
    { key: "proof", label: t("Why + process + FAQ", "الثقة والخطوات والأسئلة") },
  ] as const;
  const smartGroups = [
    { key: "core", label: t("Core structure", "الهيكل الأساسي") },
    { key: "steps", label: t("Setup steps", "خطوات التركيب") },
  ] as const;
  const bookGroups = [
    { key: "core", label: t("Core structure", "الهيكل الأساسي") },
  ] as const;
  const detailGroups = [{ key: "copy", label: t("Detail labels", "تسميات التفاصيل") }] as const;
  const activeGroupLabel =
    activeSection === "home-builder"
      ? homeGroups.find((item) => item.key === homeGroup)?.label
      : activeSection === "projects-builder"
        ? projectsGroups.find((item) => item.key === projectsGroup)?.label
        : activeSection === "finishing-builder"
          ? finishingGroups.find((item) => item.key === finishingGroup)?.label
          : activeSection === "smart-builder"
            ? smartGroups.find((item) => item.key === smartGroup)?.label
            : activeSection === "book-builder"
              ? bookGroups.find((item) => item.key === bookGroup)?.label
              : detailGroups[0]?.label;
  const pageRailItems = [
    { key: "home-builder", label: t("Homepage", "الصفحة الرئيسية"), status: t("Hero, services, trust, and booking", "الهيرو والخدمات والثقة والحجز") },
    { key: "projects-builder", label: t("Projects", "المشروعات"), status: t("Browse, reasons, and project decisions", "التصفح وأسباب الاختيار وقرارات المشروع") },
    { key: "finishing-builder", label: t("Finishing", "التشطيب"), status: t("Packages, proof, and objections", "الباقات والإثبات والاعتراضات") },
    { key: "smart-builder", label: t("Smart home", "المنزل الذكي"), status: t("Steps, labels, and positioning", "الخطوات والتسميات والتموضع") },
    { key: "book-builder", label: t("Booking", "الحجز"), status: t("Request flow and booking language", "رحلة الطلب ولغة الحجز") },
    { key: "project-detail-builder", label: t("Project detail", "تفاصيل المشروع"), status: t("Highlights, units, gallery, and visit CTA", "المزايا والوحدات والمعرض وطلب الزيارة") },
  ] as const;
  const currentElementItems = useMemo(() => {
    if (activeSection === "home-builder") {
      if (homeGroup === "core") {
        return layouts.home.map((item) => ({
          label: item.label.en || item.label.ar || t("Homepage block", "بلوك الصفحة الرئيسية"),
          hint: item.enabled ? t("Contains the main text inside the block", "يحتوي النصوص الأساسية داخل البلوك") : t("Hidden right now", "مخفي حاليًا"),
        }));
      }
      if (homeGroup === "services") return pages.home.serviceLines.map((item) => ({ label: item.title.en || item.title.ar || t("Service card", "بطاقة خدمة"), hint: t("Service card in the homepage", "بطاقة خدمة داخل الصفحة الرئيسية") }));
      if (homeGroup === "signals") return [{ label: t("Market signals", "إشارات السوق"), hint: t("Short hero signals and ribbons", "إشارات الهيرو والشرائط القصيرة") }, { label: t("Dashboard stats", "إحصاءات الواجهة"), hint: t("Definitions shown near the homepage dashboard", "تعريفات تظهر مع إحصاءات الواجهة") }];
      if (homeGroup === "journeys") return [{ label: t("Intent cards", "بطاقات النية"), hint: t("Routes visitors to the right sales path", "توجّه الزائر للمسار البيعي المناسب") }, { label: t("Trust cards", "بطاقات الثقة"), hint: t("Explains why this funnel converts", "توضح لماذا هذا المسار يحوّل أفضل") }];
      return [{ label: t("Before-submit list", "قائمة ما قبل الإرسال"), hint: t("Final reminders next to the form", "تذكيرات نهائية بجوار النموذج") }];
    }
    if (activeSection === "projects-builder") {
      if (projectsGroup === "core") return layouts.projects.map((item) => ({ label: item.label.en || item.label.ar || t("Projects block", "بلوك المشروعات"), hint: item.enabled ? t("Contains the main text inside the block", "يحتوي النصوص الأساسية داخل البلوك") : t("Hidden right now", "مخفي حاليًا") }));
      return [{ label: t("Decision cards", "بطاقات القرار"), hint: t("Help visitors choose the right project path", "تساعد الزائر يختار مسار المشروع المناسب") }, { label: t("Visit reasons", "أسباب الزيارة"), hint: t("Short reasons that push the visit action", "أسباب قصيرة تدفع لإجراء الزيارة") }];
    }
    if (activeSection === "finishing-builder") {
      if (finishingGroup === "core") return layouts.finishing.map((item) => ({ label: item.label.en || item.label.ar || t("Finishing block", "بلوك التشطيب"), hint: item.enabled ? t("Contains the main text inside the block", "يحتوي النصوص الأساسية داخل البلوك") : t("Hidden right now", "مخفي حاليًا") }));
      return [{ label: t("Why cards", "بطاقات لماذا"), hint: t("Trust reasons for the finishing offer", "أسباب ثقة لعرض التشطيب") }, { label: t("Process steps", "خطوات التنفيذ"), hint: t("What happens after the lead submits", "ما الذي يحدث بعد إرسال العميل") }, { label: t("FAQ", "الأسئلة الشائعة"), hint: t("Objections and their answers", "الاعتراضات وإجاباتها") }];
    }
    if (activeSection === "smart-builder") {
      if (smartGroup === "core") return layouts.smartHome.map((item) => ({ label: item.label.en || item.label.ar || t("Smart-home block", "بلوك المنزل الذكي"), hint: item.enabled ? t("Contains the main text inside the block", "يحتوي النصوص الأساسية داخل البلوك") : t("Hidden right now", "مخفي حاليًا") }));
      return pages.smartHome.steps.map((item) => ({ label: item.text.en || item.text.ar || t("Setup step", "خطوة تركيب"), hint: t("Step shown in the setup journey", "خطوة تظهر في رحلة التركيب") }));
    }
    if (activeSection === "book-builder") {
      if (bookGroup === "core") return layouts.book.map((item) => ({ label: item.label.en || item.label.ar || t("Booking block", "بلوك الحجز"), hint: item.enabled ? t("Contains the main text inside the block", "يحتوي النصوص الأساسية داخل البلوك") : t("Hidden right now", "مخفي حاليًا") }));
    }
    return projectDetailFields.map(([, label]) => ({ label: ui(label), hint: t("Project detail label", "تسمية داخل صفحة تفاصيل المشروع") }));
  }, [activeSection, basicPageFields, bookGroup, finishingGroup, homeGroup, layouts.book, layouts.finishing, layouts.home, layouts.projects, layouts.smartHome, pages.home, pages.projects, pages.finishing, pages.smartHome, projectsGroup, smartGroup, t, ui]);

  return (
    <>
      <BuilderPane active={activeSection} current="home-builder">
        <BuilderSection eyebrow={t("Home builder", "منشئ الصفحة الرئيسية")} title={t("Homepage editor", "محرر الصفحة الرئيسية")} description={pageIntro.home}>
          <div className="grid gap-6">
            <PageRail items={pageRailItems} active={activeSection} />
            <PagePreviewActions focus={activePreviewFocus} t={t} onPreviewFocus={onPreviewFocus} />
            <div className="flex flex-wrap gap-2">
              <button type="button" onClick={() => askHazemForLane("admin")} className="rounded-full border border-white/10 bg-black/18 px-4 py-2 text-xs font-semibold text-white/72 transition hover:bg-white/[0.05]">
                {t("Ask Hazem about this lane", "اسأل حازم عن هذا المسار")}
              </button>
              <button type="button" onClick={() => askHazemForLane("website")} className="rounded-full border border-[#f2c16b]/35 bg-[#f2c16b]/10 px-4 py-2 text-xs font-semibold text-[#f8d28b] transition hover:bg-[#f2c16b]/15">
                {t("Ask Hazem for better copy", "اطلب من حازم تحسين النص")}
              </button>
            </div>
            <FlowTabs active={pageFlow} onChange={setPageFlow} t={t} />

            {pageFlow === "choose" && (
              <SectionCanvas
                title={t("Start with one homepage lane", "ابدأ بمسار واحد داخل الصفحة الرئيسية")}
                description={t("Pick one homepage lane that already contains the main structure and its core copy.", "اختر مسارًا واحدًا في الصفحة الرئيسية يحتوي على الهيكل الأساسي ونصوصه المهمة معًا.")}
                items={homeGroups}
                active={homeGroup}
                onPick={(key) => {
                  setHomeGroup(key);
                  setPageFlow("edit");
                }}
              />
            )}
            {pageFlow === "edit" && (
              <>
                <GroupTabs active={homeGroup} onChange={setHomeGroup} groups={homeGroups} />
                <ElementListStrip title={t("Elements in this lane", "عناصر هذا المسار")} description={t("These are the items you are touching in the selected section right now.", "هذه هي العناصر التي تعمل عليها الآن داخل القسم المختار.")} items={currentElementItems} />
                {homeGroup === "core" && <LayoutBlocksEditor title={t("Homepage structure", "هيكل الصفحة الرئيسية")} description={t("Reorder homepage sections while editing the main text directly inside each block.", "أعد ترتيب أقسام الصفحة الرئيسية وعدّل النصوص الأساسية مباشرة داخل كل بلوك.")} items={layouts.home} catalog={layouts.home} onChange={(next) => updateLayout("home", next)} blockPreviews={buildLayoutPreviews("home", pages.home as unknown as Record<string, LocalizedText>)} blockEditors={buildLayoutTextEditors("home", pages.home as unknown as Record<string, LocalizedText>)} />}
                {homeGroup === "services" && <>
                  <OwnershipNotice
                    scope="catalog"
                    ownerLabel={t("Services manager", "مدير الخدمات")}
                    ownerHint={t("These service cards should be driven from the services catalog. This lane should only control how they appear on the homepage.", "بطاقات الخدمات يجب أن تأتي من مدير الخدمات. هذا المسار ينبغي أن يتحكم فقط في طريقة ظهورها داخل الصفحة الرئيسية.")}
                    href="/admin/services"
                    t={t}
                  />
                  <HomeServiceLinesEditor items={pages.home.serviceLines} onChange={(next) => mutateSettings((draft) => { draft.content.pages!.home.serviceLines = next; })} />
                </>}
                {homeGroup === "signals" && (
              <>
                <HomeSignalsEditor items={pages.home.marketSignals} onChange={(next) => mutateSettings((draft) => { draft.content.pages!.home.marketSignals = next; })} />
                <LocalizedListCollectionEditor title="Homepage ribbons" description="These short ribbons appear near the hero." items={pages.home.ribbons} onChange={(next) => mutateSettings((draft) => { draft.content.pages!.home.ribbons = next; })} addLabel="New ribbon" englishPlaceholder="Ribbon label" arabicPlaceholder="عنوان الشريط" />
                <DashboardStatsEditor items={pages.home.dashboardStats} onChange={(next) => mutateSettings((draft) => { draft.content.pages!.home.dashboardStats = next; })} />
              </>
            )}
                {homeGroup === "journeys" && (
              <>
                <DecisionCardsEditor title="Intent cards" description="These cards route the visitor into the right sales journey." items={pages.home.intentCards} onChange={(next) => mutateSettings((draft) => { draft.content.pages!.home.intentCards = next; })} />
                <ValueCardsEditor title="Trust cards" description="Cards explaining why the homepage funnel converts better." items={pages.home.trustItems} onChange={(next) => mutateSettings((draft) => { draft.content.pages!.home.trustItems = next; })} />
              </>
            )}
                {homeGroup === "booking" && <LocalizedListCollectionEditor title="Before-submit list" description="Reminders next to the final form." items={pages.home.bookingItems} onChange={(next) => mutateSettings((draft) => { draft.content.pages!.home.bookingItems = next; })} addLabel="New reminder" englishPlaceholder="Add a short reminder" arabicPlaceholder="أضف تذكيرًا قصيرًا" />}
              </>
            )}
            {pageFlow === "review" && (
              <PageReviewSection
                title={t("Homepage review", "مراجعة الصفحة الرئيسية")}
                description={t("You are now focused on one lane only. Save it, preview it, then move to the next lane.", "أنت الآن تعمل على مسار واحد فقط. احفظه، راجعه، ثم انتقل للمسار التالي.")}
                stats={[
                  { label: t("Current lane", "المسار الحالي"), value: homeGroups.find((item) => item.key === homeGroup)?.label ?? "-" },
                  { label: t("Visible blocks", "البلوكات الظاهرة"), value: layouts.home.filter((item) => item.enabled).length },
                  { label: t("Service cards", "بطاقات الخدمات"), value: pages.home.serviceLines.length },
                ]}
              />
            )}
          </div>
        </BuilderSection>
      </BuilderPane>

      <BuilderPane active={activeSection} current="projects-builder">
        <BuilderSection eyebrow={t("Projects page", "صفحة المشروعات")} title={t("Projects editor", "محرر صفحة المشروعات")} description={pageIntro.projects}>
          <div className="grid gap-6">
            <PageRail items={pageRailItems} active={activeSection} />
            <PagePreviewActions focus={activePreviewFocus} t={t} onPreviewFocus={onPreviewFocus} />
            <div className="flex flex-wrap gap-2">
              <button type="button" onClick={() => askHazemForLane("admin")} className="rounded-full border border-white/10 bg-black/18 px-4 py-2 text-xs font-semibold text-white/72 transition hover:bg-white/[0.05]">
                {t("Ask Hazem about this lane", "اسأل حازم عن هذا المسار")}
              </button>
              <button type="button" onClick={() => askHazemForLane("website")} className="rounded-full border border-[#f2c16b]/35 bg-[#f2c16b]/10 px-4 py-2 text-xs font-semibold text-[#f8d28b] transition hover:bg-[#f2c16b]/15">
                {t("Ask Hazem for better copy", "اطلب من حازم تحسين النص")}
              </button>
            </div>
            <FlowTabs active={pageFlow} onChange={setPageFlow} t={t} />
            {pageFlow === "choose" && (
              <SectionCanvas title={t("Pick the projects lane", "اختر مسار صفحة المشروعات")} description={t("Start with the core projects lane so structure and key copy stay together before decisions.", "ابدأ بالمسار الأساسي لصفحة المشروعات حتى يبقى الهيكل والنصوص المهمة معًا قبل بطاقات القرار.")} items={projectsGroups} active={projectsGroup} onPick={(key) => { setProjectsGroup(key); setPageFlow("edit"); }} />
            )}
            {pageFlow === "edit" && (
              <>
                <GroupTabs active={projectsGroup} onChange={setProjectsGroup} groups={projectsGroups} />
                <ElementListStrip title={t("Elements in this lane", "عناصر هذا المسار")} description={t("These are the items you are touching in the selected section right now.", "هذه هي العناصر التي تعمل عليها الآن داخل القسم المختار.")} items={currentElementItems} />
                {projectsGroup === "core" && <>
                  <OwnershipNotice
                    scope="catalog"
                    ownerLabel={t("Projects manager", "مدير المشروعات")}
                    ownerHint={t("Project entities, inventory, and project facts belong to the projects manager. This page builder should only shape layout, section labels, and conversion copy.", "بيانات المشروعات والمخزون والحقائق الأساسية تخص مدير المشروعات. هذا المحرر ينبغي أن يشكّل فقط التخطيط وتسميات الأقسام ونصوص التحويل.")}
                    href="/admin/projects"
                    t={t}
                  />
                  <LayoutBlocksEditor title={t("Projects structure", "هيكل صفحة المشروعات")} description={t("Reorder the hero and catalog sections while editing their main text directly inside each block.", "أعد ترتيب أقسام صفحة المشروعات وعدّل النصوص الأساسية مباشرة داخل كل بلوك.")} items={layouts.projects} catalog={layouts.projects} onChange={(next) => updateLayout("projects", next)} blockPreviews={buildLayoutPreviews("projects", pages.projects as unknown as Record<string, LocalizedText>)} blockEditors={buildLayoutTextEditors("projects", pages.projects as unknown as Record<string, LocalizedText>)} />
                </>}
                {projectsGroup === "journey" && (
                <>
                <DecisionCardsEditor title="Decision cards" description="Cards helping pick the right project intent." items={pages.projects.compareItems} onChange={(next) => mutateSettings((draft) => { draft.content.pages!.projects.compareItems = next; })} />
                <LocalizedListCollectionEditor title="Visit reasons" description="Conversion reasons." items={pages.projects.visitReasons} onChange={(next) => mutateSettings((draft) => { draft.content.pages!.projects.visitReasons = next; })} addLabel="New reason" englishPlaceholder="Add reason" arabicPlaceholder="أضف سببًا" />
              </>
            )}
              </>
            )}
            {pageFlow === "review" && (
              <PageReviewSection
                title={t("Projects review", "مراجعة صفحة المشروعات")}
                description={t("Confirm the current lane, then open preview or continue to the next lane.", "أكد المسار الحالي ثم افتح المعاينة أو انتقل للمسار التالي.")}
                stats={[
                  { label: t("Current lane", "المسار الحالي"), value: projectsGroups.find((item) => item.key === projectsGroup)?.label ?? "-" },
                  { label: t("Visible blocks", "البلوكات الظاهرة"), value: layouts.projects.filter((item) => item.enabled).length },
                  { label: t("Decision cards", "بطاقات القرار"), value: pages.projects.compareItems.length },
                ]}
              />
            )}
          </div>
        </BuilderSection>
      </BuilderPane>

      <BuilderPane active={activeSection} current="finishing-builder">
        <BuilderSection eyebrow={t("Finishing page", "صفحة التشطيب")} title={t("Finishing editor", "محرر صفحة التشطيب")} description={pageIntro.finishing}>
          <div className="grid gap-6">
            <PageRail items={pageRailItems} active={activeSection} />
            <PagePreviewActions focus={activePreviewFocus} t={t} onPreviewFocus={onPreviewFocus} />
            <div className="flex flex-wrap gap-2">
              <button type="button" onClick={() => askHazemForLane("admin")} className="rounded-full border border-white/10 bg-black/18 px-4 py-2 text-xs font-semibold text-white/72 transition hover:bg-white/[0.05]">
                {t("Ask Hazem about this lane", "اسأل حازم عن هذا المسار")}
              </button>
              <button type="button" onClick={() => askHazemForLane("website")} className="rounded-full border border-[#f2c16b]/35 bg-[#f2c16b]/10 px-4 py-2 text-xs font-semibold text-[#f8d28b] transition hover:bg-[#f2c16b]/15">
                {t("Ask Hazem for better copy", "اطلب من حازم تحسين النص")}
              </button>
            </div>
            <FlowTabs active={pageFlow} onChange={setPageFlow} t={t} />
            {pageFlow === "choose" && (
              <SectionCanvas
                title={t("Pick the finishing lane", "اختر مسار صفحة التشطيب")}
                description={t("Start with one core finishing lane that already includes structure and key labels.", "ابدأ بمسار أساسي واحد لصفحة التشطيب يجمع الهيكل والنصوص المهمة معًا.")}
                items={finishingGroups}
                active={finishingGroup}
                onPick={(key) => {
                  setFinishingGroup(key);
                  setPageFlow("edit");
                }}
              />
            )}
            {pageFlow === "edit" && (
              <>
                <GroupTabs active={finishingGroup} onChange={setFinishingGroup} groups={finishingGroups} />
                <ElementListStrip title={t("Elements in this lane", "عناصر هذا المسار")} description={t("These are the items you are touching in the selected section right now.", "هذه هي العناصر التي تعمل عليها الآن داخل القسم المختار.")} items={currentElementItems} />
                {finishingGroup === "core" && <LayoutBlocksEditor title={t("Finishing structure", "هيكل صفحة التشطيب")} description={t("Reorder the finishing sections while editing the main text directly inside each block.", "أعد ترتيب أقسام صفحة التشطيب وعدّل النصوص الأساسية مباشرة داخل كل بلوك.")} items={layouts.finishing} catalog={layouts.finishing} onChange={(next) => updateLayout("finishing", next)} blockPreviews={buildLayoutPreviews("finishing", pages.finishing as unknown as Record<string, LocalizedText>)} blockEditors={buildLayoutTextEditors("finishing", pages.finishing as unknown as Record<string, LocalizedText>)} />}
                {finishingGroup === "proof" && (
                  <>
                    <ValueCardsEditor title="Why cards" description="Explain why finishing flow is safer." items={pages.finishing.whyCards} onChange={(next) => mutateSettings((draft) => { draft.content.pages!.finishing.whyCards = next; })} />
                    <LocalizedListCollectionEditor title="Process steps" description="What happens after lead is submitted." items={pages.finishing.processSteps} onChange={(next) => mutateSettings((draft) => { draft.content.pages!.finishing.processSteps = next; })} addLabel="New step" englishPlaceholder="Add process step" arabicPlaceholder="خطوة" />
                    <FaqItemsEditor title="Finishing FAQ" description="Edit the finishing objections." items={pages.finishing.faqs} onChange={(next) => mutateSettings((draft) => { draft.content.pages!.finishing.faqs = next; })} />
                  </>
                )}
              </>
            )}
            {pageFlow === "review" && (
              <PageReviewSection
                title={t("Finishing review", "مراجعة صفحة التشطيب")}
                description={t("Confirm the current lane, then preview the page or move to the next finishing lane.", "أكد المسار الحالي ثم راجع الصفحة أو انتقل للمسار التالي في التشطيب.")}
                stats={[
                  { label: t("Current lane", "المسار الحالي"), value: finishingGroups.find((item) => item.key === finishingGroup)?.label ?? "-" },
                  { label: t("Visible blocks", "البلوكات الظاهرة"), value: layouts.finishing.filter((item) => item.enabled).length },
                  { label: t("FAQ items", "عناصر الأسئلة"), value: pages.finishing.faqs.length },
                ]}
              />
            )}
          </div>
        </BuilderSection>
      </BuilderPane>

      <BuilderPane active={activeSection} current="smart-builder">
        <BuilderSection eyebrow={t("Smart home page", "صفحة المنزل الذكي")} title={t("Smart-home editor", "محرر صفحة المنزل الذكي")} description={pageIntro.smart}>
          <div className="grid gap-6">
            <PageRail items={pageRailItems} active={activeSection} />
            <PagePreviewActions focus={activePreviewFocus} t={t} onPreviewFocus={onPreviewFocus} />
            <div className="flex flex-wrap gap-2">
              <button type="button" onClick={() => askHazemForLane("admin")} className="rounded-full border border-white/10 bg-black/18 px-4 py-2 text-xs font-semibold text-white/72 transition hover:bg-white/[0.05]">
                {t("Ask Hazem about this lane", "اسأل حازم عن هذا المسار")}
              </button>
              <button type="button" onClick={() => askHazemForLane("website")} className="rounded-full border border-[#f2c16b]/35 bg-[#f2c16b]/10 px-4 py-2 text-xs font-semibold text-[#f8d28b] transition hover:bg-[#f2c16b]/15">
                {t("Ask Hazem for better copy", "اطلب من حازم تحسين النص")}
              </button>
            </div>
            <FlowTabs active={pageFlow} onChange={setPageFlow} t={t} />
            {pageFlow === "choose" && (
              <SectionCanvas
                title={t("Pick the smart-home lane", "اختر مسار صفحة المنزل الذكي")}
                description={t("Choose one smart-home lane that already contains the main structure and labels.", "اختر مسارًا واحدًا في صفحة المنزل الذكي يجمع الهيكل والنصوص الأساسية معًا.")}
                items={smartGroups}
                active={smartGroup}
                onPick={(key) => {
                  setSmartGroup(key);
                  setPageFlow("edit");
                }}
              />
            )}
            {pageFlow === "edit" && (
              <>
                <GroupTabs active={smartGroup} onChange={setSmartGroup} groups={smartGroups} />
                <ElementListStrip title={t("Elements in this lane", "عناصر هذا المسار")} description={t("These are the items you are touching in the selected section right now.", "هذه هي العناصر التي تعمل عليها الآن داخل القسم المختار.")} items={currentElementItems} />
                {smartGroup === "core" && <LayoutBlocksEditor title={t("Smart-home structure", "هيكل صفحة المنزل الذكي")} description={t("Reorder the smart-home sections while editing the main text directly inside each block.", "أعد ترتيب أقسام المنزل الذكي وعدّل النصوص الأساسية مباشرة داخل كل بلوك.")} items={layouts.smartHome} catalog={layouts.smartHome} onChange={(next) => updateLayout("smartHome", next)} blockPreviews={buildLayoutPreviews("smartHome", pages.smartHome as unknown as Record<string, LocalizedText>)} blockEditors={buildLayoutTextEditors("smartHome", pages.smartHome as unknown as Record<string, LocalizedText>)} />}
                {smartGroup === "steps" && <LocalizedListCollectionEditor title="Smart-home steps" description="These appear in the hero-side setup timeline." items={pages.smartHome.steps} onChange={(next) => mutateSettings((draft) => { draft.content.pages!.smartHome.steps = next; })} addLabel="New step" englishPlaceholder="Step label" arabicPlaceholder="خطوة" />}
              </>
            )}
            {pageFlow === "review" && (
              <PageReviewSection
                title={t("Smart-home review", "مراجعة صفحة المنزل الذكي")}
                description={t("Check the current lane, then preview the setup story before moving on.", "راجع المسار الحالي ثم افتح المعاينة قبل الانتقال للجزء التالي.")}
                stats={[
                  { label: t("Current lane", "المسار الحالي"), value: smartGroups.find((item) => item.key === smartGroup)?.label ?? "-" },
                  { label: t("Visible blocks", "البلوكات الظاهرة"), value: layouts.smartHome.filter((item) => item.enabled).length },
                  { label: t("Setup steps", "خطوات التركيب"), value: pages.smartHome.steps.length },
                ]}
              />
            )}
          </div>
        </BuilderSection>
      </BuilderPane>

      <BuilderPane active={activeSection} current="book-builder">
        <BuilderSection eyebrow={t("Booking page", "صفحة الحجز")} title={t("Booking editor", "محرر صفحة الحجز")} description={pageIntro.book}>
          <div className="grid gap-6">
            <PageRail items={pageRailItems} active={activeSection} />
            <PagePreviewActions focus={activePreviewFocus} t={t} onPreviewFocus={onPreviewFocus} />
            <div className="flex flex-wrap gap-2">
              <button type="button" onClick={() => askHazemForLane("admin")} className="rounded-full border border-white/10 bg-black/18 px-4 py-2 text-xs font-semibold text-white/72 transition hover:bg-white/[0.05]">
                {t("Ask Hazem about this lane", "اسأل حازم عن هذا المسار")}
              </button>
              <button type="button" onClick={() => askHazemForLane("website")} className="rounded-full border border-[#f2c16b]/35 bg-[#f2c16b]/10 px-4 py-2 text-xs font-semibold text-[#f8d28b] transition hover:bg-[#f2c16b]/15">
                {t("Ask Hazem for better copy", "اطلب من حازم تحسين النص")}
              </button>
            </div>
            <FlowTabs active={pageFlow} onChange={setPageFlow} t={t} />
            {pageFlow === "choose" && (
              <SectionCanvas
                title={t("Pick the booking lane", "اختر مسار صفحة الحجز")}
                description={t("Keep booking simple by using one core lane that includes both structure and booking copy.", "حافظ على بساطة صفحة الحجز بمسار أساسي واحد يجمع الهيكل ونصوص الحجز معًا.")}
                items={bookGroups}
                active={bookGroup}
                onPick={(key) => {
                  setBookGroup(key);
                  setPageFlow("edit");
                }}
              />
            )}
            {pageFlow === "edit" && (
              <>
                <GroupTabs active={bookGroup} onChange={setBookGroup} groups={bookGroups} />
                <ElementListStrip title={t("Elements in this lane", "عناصر هذا المسار")} description={t("These are the items you are touching in the selected section right now.", "هذه هي العناصر التي تعمل عليها الآن داخل القسم المختار.")} items={currentElementItems} />
                {bookGroup === "core" && <LayoutBlocksEditor title={t("Booking structure", "هيكل صفحة الحجز")} description={t("Reorder booking sections while editing the main booking text directly inside each block.", "أعد ترتيب أقسام الحجز وعدّل النصوص الأساسية مباشرة داخل كل بلوك.")} items={layouts.book} catalog={layouts.book} onChange={(next) => updateLayout("book", next)} blockPreviews={buildLayoutPreviews("book", pages.book as unknown as Record<string, LocalizedText>)} blockEditors={buildLayoutTextEditors("book", pages.book as unknown as Record<string, LocalizedText>)} />}
              </>
            )}
            {pageFlow === "review" && (
              <PageReviewSection
                title={t("Booking review", "مراجعة صفحة الحجز")}
                description={t("Confirm the booking lane, then preview the exact form entry point.", "أكد مسار الحجز ثم افتح المعاينة على نقطة الدخول الصحيحة للنموذج.")}
                stats={[
                  { label: t("Current lane", "المسار الحالي"), value: bookGroups.find((item) => item.key === bookGroup)?.label ?? "-" },
                  { label: t("Visible blocks", "البلوكات الظاهرة"), value: layouts.book.filter((item) => item.enabled).length },
                  { label: t("Core labels", "التسميات الأساسية"), value: basicPageFields.length },
                ]}
              />
            )}
          </div>
        </BuilderSection>
      </BuilderPane>

      <BuilderPane active={activeSection} current="project-detail-builder">
        <BuilderSection eyebrow={t("Project detail", "تفاصيل المشروع")} title={t("Project detail labels", "تسميات صفحة تفاصيل المشروع")} description={pageIntro.detail}>
          <div className="grid gap-6">
            <PageRail items={pageRailItems} active={activeSection} />
            <PagePreviewActions focus={activePreviewFocus} t={t} onPreviewFocus={onPreviewFocus} />
            <div className="flex flex-wrap gap-2">
              <button type="button" onClick={() => askHazemForLane("admin")} className="rounded-full border border-white/10 bg-black/18 px-4 py-2 text-xs font-semibold text-white/72 transition hover:bg-white/[0.05]">
                {t("Ask Hazem about this lane", "اسأل حازم عن هذا المسار")}
              </button>
              <button type="button" onClick={() => askHazemForLane("website")} className="rounded-full border border-[#f2c16b]/35 bg-[#f2c16b]/10 px-4 py-2 text-xs font-semibold text-[#f8d28b] transition hover:bg-[#f2c16b]/15">
                {t("Ask Hazem for better copy", "اطلب من حازم تحسين النص")}
              </button>
            </div>
            <FlowTabs active={pageFlow} onChange={setPageFlow} t={t} />
            {pageFlow === "choose" && (
              <SectionCanvas
                title={t("Pick the detail lane", "اختر مسار صفحة التفاصيل")}
                description={t("Project detail is long, so start with the exact label lane before editing.", "صفحة التفاصيل طويلة، لذلك ابدأ أولًا بمسار التسميات المطلوب قبل التحرير.")}
                items={detailGroups}
                active="copy"
                onPick={() => setPageFlow("edit")}
              />
            )}
            {pageFlow === "edit" && (
              <>
                <GroupTabs active="copy" onChange={() => undefined} groups={detailGroups} />
                <ElementListStrip title={t("Elements in this lane", "عناصر هذا المسار")} description={t("These are the items you are touching in the selected section right now.", "هذه هي العناصر التي تعمل عليها الآن داخل القسم المختار.")} items={currentElementItems} />
                <PreviewChoiceGrid title={t("Project detail labels", "تسميات صفحة تفاصيل المشروع")} description={t("This long page is now edited label-by-label instead of one huge form.", "هذه الصفحة الطويلة أصبحت تُعدل تسميةً تلو الأخرى بدل فورم ضخم واحد.")} items={projectDetailFields} valueMap={pages.projectDetail as unknown as Record<string, LocalizedText>} onChange={(field, next) => updatePageText("projectDetail", field, next)} ui={ui} arEditPlaceholder={arEditPlaceholder} />
              </>
            )}
            {pageFlow === "review" && (
              <PageReviewSection
                title={t("Project detail review", "مراجعة صفحة التفاصيل")}
                description={t("Review the long detail-page labels in one place before publishing.", "راجع تسميات صفحة التفاصيل الطويلة في مكان واحد قبل النشر.")}
                stats={[
                  { label: t("Focused lane", "المسار الحالي"), value: detailGroups[0].label },
                  { label: t("Detail labels", "تسميات التفاصيل"), value: projectDetailFields.length },
                  { label: t("Preview target", "هدف المعاينة"), value: t("Live project page", "صفحة مشروع فعلية") },
                ]}
              />
            )}
          </div>
        </BuilderSection>
      </BuilderPane>
    </>
  );
}

