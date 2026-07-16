
"use client";

import { useMemo, useState } from "react";
import { BuilderSection, LocalizedTextEditor } from "@/components/admin/builder-kit";
import type { HazemPromptRequest } from "@/components/admin/settings-builder";
import type { PreviewFocusTarget } from "@/components/admin/live-preview-panel";
import { Field } from "./shared-builder-ui";
import type { LocalizedText, SiteSettings, SystemBlockItem, SystemBlockPlacementPage } from "@/lib/types";

type Props = {
  settings: SiteSettings;
  mutateSettings: (recipe: (draft: SiteSettings) => void) => void;
  ui: (en: string, ar?: string) => string;
  t: (en: string, ar: string) => string;
  defaultText: (seed?: string) => LocalizedText;
  arEditPlaceholder: (label: string) => string;
  mode?: "all" | "header-footer" | "lead-only";
  onPreviewFocus?: (focus: PreviewFocusTarget) => void;
  onAskHazem?: (request: HazemPromptRequest) => void;
};

type BlockZone = "header" | "footer" | "lead";
type LibraryCategory = "media" | "text" | "cta" | "forms" | "crm";
type EditorStep = "select" | "arrange" | "edit" | "review";
type SharedCopyFlow = "choose" | "edit" | "review";
type CopySectionKey = "nav" | "leadForm" | "footer";
type CopyEditorState =
  | { section: CopySectionKey; field: string; label: string; as: "input" | "textarea"; rows: number }
  | null;
const PUBLIC_SITE_URL = process.env.NEXT_PUBLIC_PUBLIC_SITE_URL ?? "https://veyra-platform.vercel.app";

const PAGE_OPTIONS: Array<{ id: SystemBlockPlacementPage; en: string; ar: string }> = [
  { id: "home", en: "Home", ar: "الرئيسية" },
  { id: "projects", en: "Projects", ar: "المشروعات" },
  { id: "finishing", en: "Finishing", ar: "التشطيب" },
  { id: "smartHome", en: "Smart Home", ar: "المنزل الذكي" },
  { id: "book", en: "Book", ar: "الحجز" },
];

const DEFAULT_SYSTEM_BLOCKS: SystemBlockItem[] = [
  { id: "global-nav-shell", label: { en: "Main navigation shell", ar: "هيكل القائمة العلوية", color: "#ffffff" }, zone: "header", pages: ["home", "projects", "finishing", "smartHome", "book"], enabled: true, conditions: { locale: "all", visitorIntent: "all" } },
  { id: "global-top-cta", label: { en: "Top CTA button", ar: "زر الإجراء العلوي", color: "#ffffff" }, zone: "header", pages: ["home", "projects", "finishing", "smartHome", "book"], enabled: true, conditions: { locale: "all", visitorIntent: "all" } },
  { id: "shared-lead-entry", label: { en: "Lead form entry", ar: "مدخل نموذج العملاء", color: "#ffffff" }, zone: "lead", pages: ["home", "projects", "finishing", "smartHome", "book"], enabled: true, conditions: { locale: "all", visitorIntent: "all" } },
  { id: "global-footer-shell", label: { en: "Footer shell", ar: "هيكل أسفل الصفحة", color: "#ffffff" }, zone: "footer", pages: ["home", "projects", "finishing", "smartHome", "book"], enabled: true, conditions: { locale: "all", visitorIntent: "all" } },
];

const LIBRARY_BLOCKS = [
  { id: "hero-logo-chip", category: "media", zone: "header", titleEn: "Logo / brand strip", titleAr: "الشعار وشريط العلامة", subtitleEn: "Brand area shown at the very top.", subtitleAr: "منطقة الهوية الظاهرة أعلى الصفحة." },
  { id: "top-nav-link-set", category: "text", zone: "header", titleEn: "Navigation links", titleAr: "روابط التنقل", subtitleEn: "Top menu items with localized labels.", subtitleAr: "روابط القائمة العلوية مع نصوص باللغتين." },
  { id: "hero-cta-primary", category: "cta", zone: "header", titleEn: "Primary action button", titleAr: "زر الإجراء الرئيسي", subtitleEn: "Main button beside the top menu.", subtitleAr: "الزر الرئيسي بجوار القائمة العلوية." },
  { id: "lead-form-trigger", category: "forms", zone: "lead", titleEn: "Quick lead form", titleAr: "نموذج عملاء سريع", subtitleEn: "Fast inquiry entry for visitors.", subtitleAr: "مدخل سريع لاستفسار الزائر." },
  { id: "lead-qualification-note", category: "crm", zone: "lead", titleEn: "Lead qualification note", titleAr: "تعليمات تأهيل العميل", subtitleEn: "Short prompt to improve lead quality.", subtitleAr: "تعليمات مختصرة لرفع جودة العملاء." },
  { id: "footer-trust-row", category: "text", zone: "footer", titleEn: "Trust and legal row", titleAr: "سطر الثقة والقانوني", subtitleEn: "Shared footer trust and legal copy.", subtitleAr: "نصوص الثقة والقانونية بأسفل الصفحة." },
  { id: "footer-cta-strip", category: "cta", zone: "footer", titleEn: "Footer CTA", titleAr: "إجراء أسفل الصفحة", subtitleEn: "Final call to action before exit.", subtitleAr: "آخر دعوة للإجراء قبل خروج الزائر." },
] as const satisfies ReadonlyArray<{ id: string; category: LibraryCategory; zone: BlockZone; titleEn: string; titleAr: string; subtitleEn: string; subtitleAr: string }>;

function getSystemBlocks(settings: SiteSettings) {
  return settings.content.systemBlocks?.length ? settings.content.systemBlocks : DEFAULT_SYSTEM_BLOCKS;
}

function zoneMeta(zone: BlockZone, t: Props["t"]) {
  if (zone === "header") return { title: t("Top menu", "القائمة العلوية"), description: t("Shared top navigation and actions.", "التنقل العلوي والإجراءات المشتركة أعلى الصفحة."), add: t("Add top element", "أضف عنصرًا علويًا") };
  if (zone === "lead") return { title: t("Lead form", "نموذج العملاء"), description: t("Inquiry and conversion elements inside the page.", "عناصر الاستفسار والتحويل داخل الصفحة."), add: t("Add lead element", "أضف عنصرًا للنموذج") };
  return { title: t("Bottom section", "أسفل الصفحة"), description: t("Footer rows and final actions.", "عناصر أسفل الصفحة والإجراءات النهائية."), add: t("Add bottom element", "أضف عنصرًا سفليًا") };
}

function categoryLabel(category: LibraryCategory | "all", t: Props["t"]) {
  if (category === "all") return t("All", "الكل");
  if (category === "media") return t("Media", "وسائط");
  if (category === "text") return t("Text", "نصوص");
  if (category === "cta") return t("CTA", "أزرار");
  if (category === "forms") return t("Forms", "نماذج");
  return t("Smart", "ذكية");
}

function pageToPreviewRoute(page: SystemBlockPlacementPage): PreviewFocusTarget["page"] {
  if (page === "projects") return "/projects";
  if (page === "finishing") return "/finishing";
  if (page === "smartHome") return "/smart-home";
  if (page === "book") return "/book";
  return "/";
}

function pageToPublicRoute(page: SystemBlockPlacementPage) {
  if (page === "projects") return "/projects";
  if (page === "finishing") return "/finishing";
  if (page === "smartHome") return "/smart-home";
  if (page === "book") return "/book";
  return "/";
}

function zoneToTargetId(zone: BlockZone) {
  if (zone === "header") return "site-header";
  if (zone === "lead") return "lead-form";
  return "site-footer";
}

function SummaryCard({
  label,
  value,
  tone = "neutral",
}: {
  label: string;
  value: string | number;
  tone?: "neutral" | "accent";
}) {
  return (
    <div className={`rounded-[20px] border p-4 ${tone === "accent" ? "border-brand-gold/35 bg-brand-gold/10" : "border-white/10 bg-black/18"}`}>
      <p className="text-xs uppercase tracking-[0.16em] text-white/42">{label}</p>
      <strong className="mt-2 block text-white">{value}</strong>
    </div>
  );
}

export function SystemStructuresModule({ settings, mutateSettings, ui, t, defaultText, arEditPlaceholder, mode = "all", onPreviewFocus, onAskHazem }: Props) {
  const [editorStep, setEditorStep] = useState<EditorStep>("select");
  const [activeZoneView, setActiveZoneView] = useState<BlockZone | null>(null);
  const [libraryOpen, setLibraryOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [libraryCategory, setLibraryCategory] = useState<LibraryCategory | "all">("all");
  const [draggingBlockId, setDraggingBlockId] = useState<string | null>(null);
  const [activeDropZone, setActiveDropZone] = useState<BlockZone | null>(null);
  const [selectedBlockId, setSelectedBlockId] = useState<string | null>(null);
  const [copyEditor, setCopyEditor] = useState<CopyEditorState>(null);
  const [contentFocus, setContentFocus] = useState<CopySectionKey | null>(mode === "lead-only" ? "leadForm" : "nav");
  const [copyFlow, setCopyFlow] = useState<SharedCopyFlow>("choose");

  const blocks = getSystemBlocks(settings);
  const availableZones = mode === "lead-only" ? (["lead"] as const) : mode === "header-footer" ? (["header", "footer"] as const) : (["header", "lead", "footer"] as const);
  const hasZone = (zone: BlockZone) => (availableZones as readonly BlockZone[]).includes(zone);
  const currentZone = activeZoneView && hasZone(activeZoneView) ? activeZoneView : availableZones[0] ?? null;
  const askHazemForSystemArea = (chatMode: "admin" | "website", area?: string) => {
    const zoneLabel = area ?? (currentZone ? zoneMeta(currentZone, t).title : t("Current shared area", "الجزء المشترك الحالي"));
    onAskHazem?.({
      id: Date.now(),
      mode: chatMode,
      prompt:
        chatMode === "admin"
          ? t(
              `Review the shared area ${zoneLabel}. Tell me what is confusing, what is missing, and what should be fixed first.`,
              `راجع الجزء المشترك ${zoneLabel}. قولّي ما الذي يربك المستخدم، وما الذي ينقصه، وما الذي يجب إصلاحه أولًا.`,
            )
          : t(
              `Rewrite the shared area ${zoneLabel} for clearer visitor messaging and stronger conversion.`,
              `أعد صياغة الجزء المشترك ${zoneLabel} برسالة أوضح للزائر وتحويل أقوى.`,
            ),
      sourceLabel: zoneLabel,
      pageTitle: currentZone ? zoneMeta(currentZone, t).title : t("Shared structure", "الهيكل المشترك"),
      targetId: currentZone ? zoneToTargetId(currentZone) : null,
      scope: "shared",
    });
  };

  const updateSystemBlocks = (nextBlocks: SystemBlockItem[]) =>
    mutateSettings((draft) => {
      draft.content.systemBlocks = nextBlocks;
    });

  const patchBlock = (blockId: string, patch: Partial<SystemBlockItem>) =>
    updateSystemBlocks(blocks.map((block) => (block.id === blockId ? { ...block, ...patch } : block)));

  const createBlock = (zone: BlockZone) => {
    const block: SystemBlockItem = {
      id: `custom-${zone}-${Date.now().toString(36)}`,
      label: { en: `${zone} block`, ar: zone === "header" ? "عنصر علوي" : zone === "lead" ? "عنصر نموذج" : "عنصر سفلي", color: "#ffffff" },
      zone,
      enabled: true,
      pages: ["home"],
      conditions: { locale: "all", visitorIntent: "all" },
    };
    updateSystemBlocks([...blocks, block]);
    setSelectedBlockId(block.id);
    setEditorStep("edit");
  };

  const addLibraryBlock = (templateId: string) => {
    const template = LIBRARY_BLOCKS.find((item) => item.id === templateId);
    if (!template) return;
    const block: SystemBlockItem = {
      id: `${template.id}-${Date.now().toString(36)}`,
      label: { en: template.titleEn, ar: template.titleAr, color: "#ffffff" },
      zone: template.zone,
      enabled: true,
      pages: ["home"],
      conditions: { locale: "all", visitorIntent: "all" },
    };
    updateSystemBlocks([...blocks, block]);
    setActiveZoneView(template.zone);
    setSelectedBlockId(block.id);
    setLibraryOpen(false);
    setEditorStep("edit");
  };
  const duplicateBlock = (blockId: string) => {
    const source = blocks.find((item) => item.id === blockId);
    if (!source) return;
    const copy: SystemBlockItem = {
      ...source,
      id: `${source.id}-copy-${Date.now().toString(36)}`,
      label: { ...source.label, en: `${source.label.en} Copy`, ar: source.label.ar ? `${source.label.ar} نسخة` : "نسخة" },
    };
    updateSystemBlocks([...blocks, copy]);
    setSelectedBlockId(copy.id);
  };

  const moveBlock = (sourceId: string, targetZone: BlockZone, targetIndex?: number) => {
    const source = blocks.find((item) => item.id === sourceId);
    if (!source) return;
    const remaining = blocks.filter((item) => item.id !== sourceId);
    const moved: SystemBlockItem = { ...source, zone: targetZone };
    if (typeof targetIndex !== "number" || targetIndex < 0) {
      updateSystemBlocks([...remaining, moved]);
      return;
    }
    const result: SystemBlockItem[] = [];
    let zoneCounter = 0;
    let inserted = false;
    for (const item of remaining) {
      if (item.zone === targetZone && zoneCounter === targetIndex) {
        result.push(moved);
        inserted = true;
      }
      result.push(item);
      if (item.zone === targetZone) zoneCounter += 1;
    }
    if (!inserted) result.push(moved);
    updateSystemBlocks(result);
  };

  const togglePage = (blockId: string, pageId: SystemBlockPlacementPage) => {
    const block = blocks.find((item) => item.id === blockId);
    if (!block) return;
    const pages = block.pages.includes(pageId) ? block.pages.filter((item) => item !== pageId) : [...block.pages, pageId];
    patchBlock(blockId, { pages });
  };

  const updateSectionText = (category: "nav" | "footer" | "leadForm" | "hero", field: string, value: LocalizedText) =>
    mutateSettings((draft) => {
      if (!draft.content[category]) return;
      (draft.content[category] as Record<string, LocalizedText>)[field] = value;
    });

  const headerFields = [["contactLabel", "Contact label", "input", 2], ["projectsLabel", "Projects link", "input", 2], ["calculatorLabel", "Calculator link", "input", 2], ["leadLabel", "Header CTA", "input", 2]] as const;
  const footerFields = [["title", "Title", "input", 2], ["description", "Description", "textarea", 3], ["copyright", "Copyright", "input", 2], ["leadLabel", "Footer CTA", "input", 2], ["backToTop", "Back to top", "input", 2]] as const;
  const leadFields = [["triggerLabel", "Hero button", "input", 2], ["title", "Form title", "input", 2], ["subtitle", "Form subtitle", "textarea", 3], ["submitLabel", "Submit button", "input", 2], ["successTitle", "Success title", "input", 2], ["successMessage", "Success message", "textarea", 3]] as const;

  const coverage = useMemo(() => {
    const filled = (value?: LocalizedText) => Boolean(value?.en?.trim() || value?.ar?.trim());
    return {
      headerFilled: headerFields.filter(([field]) => filled((settings.content.nav as Record<string, LocalizedText>)[field])).length,
      footerFilled: footerFields.filter(([field]) => filled((settings.content.footer as Record<string, LocalizedText>)[field])).length,
      leadFilled: leadFields.filter(([field]) => filled((settings.content.leadForm as Record<string, LocalizedText>)[field])).length,
    };
  }, [settings.content.footer, settings.content.leadForm, settings.content.nav]);

  const normalizedSearch = search.trim().toLowerCase();
  const visibleLibraryBlocks = LIBRARY_BLOCKS.filter((item) => {
    const matchesCategory = libraryCategory === "all" || item.category === libraryCategory;
    const matchesZone = currentZone ? item.zone === currentZone : true;
    const matchesSearch = !normalizedSearch || item.id.toLowerCase().includes(normalizedSearch) || item.titleEn.toLowerCase().includes(normalizedSearch) || item.titleAr.toLowerCase().includes(normalizedSearch);
    return matchesCategory && matchesZone && matchesSearch;
  });

  const visibleBlocksByZone = (zone: BlockZone) =>
    blocks.filter((block) => {
      const matchesZone = block.zone === zone;
      const matchesSearch = !normalizedSearch || block.id.toLowerCase().includes(normalizedSearch) || block.label.en.toLowerCase().includes(normalizedSearch) || block.label.ar.toLowerCase().includes(normalizedSearch);
      return matchesZone && matchesSearch;
    });

  const selectedBlock = blocks.find((item) => item.id === selectedBlockId) ?? null;
  const currentZoneBlocks = currentZone ? visibleBlocksByZone(currentZone) : [];
  const zoneInventory = (zone: BlockZone) => {
    const zoneBlocks = blocks.filter((item) => item.zone === zone);
    return {
      total: zoneBlocks.length,
      visible: zoneBlocks.filter((item) => item.enabled).length,
      pages: new Set(zoneBlocks.flatMap((item) => item.pages)).size,
    };
  };
  const focusBlockPreview = (block: SystemBlockItem) => {
    const firstPage = block.pages[0] ?? "home";
    onPreviewFocus?.({
      page: pageToPreviewRoute(firstPage),
      publicUrl: pageToPublicRoute(firstPage),
      targetId: zoneToTargetId(block.zone),
      title: t(block.label.en || "Shared item", block.label.ar || "عنصر مشترك"),
      subtitle: `${zoneMeta(block.zone, t).title} - ${t("Appears in", "يظهر في")} ${block.pages.map((page) => {
        const option = PAGE_OPTIONS.find((item) => item.id === page);
        return option ? t(option.en, option.ar) : page;
      }).join(" / ")}`,
    });
  };

  const previewText = (value?: LocalizedText) => {
    const ar = value?.ar?.trim();
    const en = value?.en?.trim();
    return ar || en || t("Not edited yet", "لم يتم تعديله بعد");
  };

  const previewColor = (value?: LocalizedText) => value?.color?.trim() || "#ffffff";

  const availableCopySections = [
    hasZone("header")
      ? {
          id: "nav" as const,
          title: t("Top menu content", "محتوى القائمة العلوية"),
          description: t("Shared text used in the top menu and top actions.", "النصوص المشتركة داخل القائمة العلوية وإجراءاتها."),
          fields: headerFields,
        }
      : null,
    hasZone("lead")
      ? {
          id: "leadForm" as const,
          title: t("Lead form content", "محتوى نموذج العملاء"),
          description: t("Lead capture labels and conversion messaging.", "نصوص جمع العملاء ورسائل التحويل."),
          fields: leadFields,
        }
      : null,
    hasZone("footer")
      ? {
          id: "footer" as const,
          title: t("Bottom section content", "محتوى أسفل الصفحة"),
          description: t("Shared footer trust, support, and legal lines.", "نصوص الثقة والدعم والقانونية بأسفل الصفحة."),
          fields: footerFields,
        }
      : null,
  ].filter(Boolean) as Array<{
    id: CopySectionKey;
    title: string;
    description: string;
    fields: readonly (readonly [string, string, "input" | "textarea", number])[];
  }>;

  const currentCopySection =
    availableCopySections.find((section) => section.id === contentFocus) ?? availableCopySections[0] ?? null;

  const renderCopyCard = (
    section: "nav" | "leadForm" | "footer",
    field: string,
    label: string,
    as: "input" | "textarea",
    rows: number,
  ) => {
    const value = (settings.content[section] as Record<string, LocalizedText>)[field] ?? defaultText();
    const isActive = copyEditor?.section === section && copyEditor?.field === field;
    return (
      <button
        key={`${section}-${field}`}
        type="button"
        onClick={() => setCopyEditor({ section, field, label, as, rows })}
        className={`grid gap-3 rounded-[20px] border p-4 text-left transition ${isActive ? "border-brand-gold bg-brand-gold/8" : "border-white/10 bg-[#120f0d] hover:border-white/20"}`}
      >
        <div className="flex items-center justify-between gap-3">
          <span className="truncate text-sm font-semibold text-white">{ui(label)}</span>
          <span className="flex items-center gap-2 rounded-full border border-white/10 bg-black/25 px-2.5 py-1 text-[10px] text-white/65">
            <span className="h-2.5 w-2.5 rounded-full border border-white/15" style={{ backgroundColor: previewColor(value) }} />
            {value?.ar?.trim() && value?.en?.trim() ? t("AR + EN", "عربي + إنجليزي") : value?.ar?.trim() ? t("Arabic", "عربي") : value?.en?.trim() ? t("English", "إنجليزي") : t("Empty", "فارغ")}
          </span>
        </div>
        <p className="line-clamp-2 min-h-[42px] text-sm leading-6 text-white/58">{previewText(value)}</p>
        <div className="flex items-center justify-between">
          <span className="text-[11px] text-white/35">{field}</span>
          <span className="rounded-full border border-brand-gold/35 bg-brand-gold/10 px-2.5 py-1 text-[10px] text-[#f6d293]">{t("Edit", "تعديل")}</span>
        </div>
      </button>
    );
  };

  return (
    <div className="grid gap-6">
      <BuilderSection eyebrow={t("Website editor", "محرر الموقع")} title={t("Edit one decision at a time.", "عدّل قرارًا واحدًا في كل مرة.")} description={t("Choose the area first, then arrange items, then edit the selected item, then review.", "اختر الجزء أولًا، ثم رتّب العناصر، ثم عدّل العنصر المحدد، ثم راجع قبل النشر.")}>
        <div className="grid gap-4 rounded-[28px] border border-white/10 bg-black/20 p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-[0.22em] text-brand-gold">{t("Editing journey", "رحلة التحرير")}</p>
              <p className="mt-2 text-sm text-white/58">{t("This editor now hides extra decisions until you actually need them.", "هذا المحرر يخفي القرارات الزائدة حتى تحتاجها فعلًا.")}</p>
            </div>
            <div className="flex flex-wrap gap-2">
              {([
                ["select", t("1. Choose area", "1. اختر الجزء")],
                ["arrange", t("2. Arrange items", "2. رتّب العناصر")],
                ["edit", t("3. Edit item", "3. عدّل العنصر")],
                ["review", t("4. Review", "4. راجع")],
              ] as const).map(([step, label]) => (
                <button key={step} type="button" onClick={() => setEditorStep(step)} className={`rounded-full border px-4 py-2 text-xs transition ${editorStep === step ? "border-brand-gold bg-brand-gold/12 text-white" : "border-white/10 bg-black/25 text-white/65 hover:bg-white/6"}`}>
                  {label}
                </button>
              ))}
            </div>
          </div>

          {editorStep === "select" ? (
            <div className="grid gap-4 md:grid-cols-2 2xl:grid-cols-3">
              {(["header", "lead", "footer"] as const).filter((zone) => hasZone(zone)).map((zone) => {
                const meta = zoneMeta(zone, t);
                const readiness = zone === "header" ? `${coverage.headerFilled}/${headerFields.length}` : zone === "lead" ? `${coverage.leadFilled}/${leadFields.length}` : `${coverage.footerFilled}/${footerFields.length}`;
                const inventory = zoneInventory(zone);
                return (
                  <button key={zone} type="button" onClick={() => { setActiveZoneView(zone); setSelectedBlockId(null); setSearch(""); setLibraryOpen(false); setEditorStep("arrange"); }} className="grid gap-4 rounded-[24px] border border-white/10 bg-[#120f0d] p-5 text-left transition hover:border-brand-gold/45 hover:bg-white/[0.03]">
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-sm font-semibold text-white">{meta.title}</span>
                      <span className="rounded-full border border-white/10 bg-black/30 px-2.5 py-1 text-[11px] text-white/60">{readiness}</span>
                    </div>
                    <p className="text-sm leading-7 text-white/55">{meta.description}</p>
                    <div className="grid gap-2 lg:grid-cols-3">
                      <SummaryCard label={t("Items", "العناصر")} value={inventory.total} />
                      <SummaryCard label={t("Visible", "الظاهرة")} value={inventory.visible} />
                      <SummaryCard label={t("Pages", "الصفحات")} value={inventory.pages} tone="accent" />
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-white/45">{t("Existing items", "العناصر الحالية")}: {blocks.filter((item) => item.zone === zone).length}</span>
                      <span className="rounded-full border border-brand-gold/35 bg-brand-gold/10 px-3 py-1 text-[11px] text-[#f6d293]">{t("Open", "افتح")}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          ) : null}
          {editorStep === "select" ? (
            <div className="flex flex-wrap gap-2">
              <button type="button" onClick={() => askHazemForSystemArea("admin")} className="rounded-full border border-white/10 bg-black/18 px-4 py-2 text-xs font-semibold text-white/72 transition hover:bg-white/[0.05]">
                {t("Ask Hazem about shared structure", "اسأل حازم عن الهيكل المشترك")}
              </button>
              <button type="button" onClick={() => askHazemForSystemArea("website")} className="rounded-full border border-brand-gold/35 bg-brand-gold/10 px-4 py-2 text-xs font-semibold text-[#f8d28b] transition hover:bg-brand-gold/15">
                {t("Ask Hazem for better shared copy", "اطلب من حازم تحسين النص المشترك")}
              </button>
            </div>
          ) : null}
          {editorStep === "arrange" && currentZone ? (
            <div className="grid gap-4 2xl:grid-cols-[minmax(0,1fr)_400px]">
              <section className="rounded-[24px] border border-white/10 bg-[#120f0d] p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-xs uppercase tracking-[0.22em] text-brand-gold">{zoneMeta(currentZone, t).title}</p>
                    <p className="mt-2 text-sm text-white/58">{t("You are now arranging only this part of the page.", "أنت تعدّل الآن هذا الجزء فقط من الصفحة.")}</p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button type="button" onClick={() => setLibraryOpen((value) => !value)} className="rounded-xl border border-white/10 bg-black/25 px-3 py-2 text-xs text-white/76 transition hover:bg-white/6">
                      {libraryOpen ? t("Hide library", "إخفاء المكتبة") : t("Add from library", "أضف من المكتبة")}
                    </button>
                    <button type="button" onClick={() => createBlock(currentZone)} className="rounded-xl border border-white/10 bg-black/25 px-3 py-2 text-xs text-white/76 transition hover:bg-white/6">
                      {zoneMeta(currentZone, t).add}
                    </button>
                  </div>
                </div>

                <div onDragOver={(event) => { event.preventDefault(); setActiveDropZone(currentZone); }} onDrop={() => { if (!draggingBlockId) return; moveBlock(draggingBlockId, currentZone); setDraggingBlockId(null); setActiveDropZone(null); }} onDragLeave={() => { if (activeDropZone === currentZone) setActiveDropZone(null); }} className={`mt-4 grid gap-3 rounded-[22px] border p-3 transition ${activeDropZone === currentZone ? "border-brand-gold/60 bg-brand-gold/8" : "border-white/10 bg-black/10"}`}>
                  {currentZoneBlocks.map((block, index) => (
                    <article key={block.id} draggable onDragStart={() => setDraggingBlockId(block.id)} onDragOver={(event) => event.preventDefault()} onDrop={() => { if (!draggingBlockId) return; moveBlock(draggingBlockId, currentZone, index); setDraggingBlockId(null); setActiveDropZone(null); }} onDragEnd={() => { setDraggingBlockId(null); setActiveDropZone(null); }} className="grid gap-3 rounded-[20px] border border-white/10 bg-black/20 p-4 lg:grid-cols-[minmax(0,1fr)_auto]">
                      <div className="grid gap-2">
                        <div className="flex items-center gap-2">
                          <span className="rounded-full border border-white/10 bg-white/5 px-2 py-1 text-[10px] text-white/55">#{index + 1}</span>
                          <span className={`rounded-full border px-2 py-1 text-[10px] ${block.enabled ? "border-emerald-400/30 bg-emerald-500/10 text-emerald-200" : "border-white/10 bg-black/30 text-white/55"}`}>{block.enabled ? t("Visible", "ظاهر") : t("Hidden", "مخفي")}</span>
                          <span className="ms-auto rounded-full border border-dashed border-white/20 px-2 py-1 text-[10px] text-white/40">{t("Drag", "اسحب")}</span>
                        </div>
                        <p className="truncate text-base font-semibold text-white">{t(block.label.en, block.label.ar)}</p>
                        <p className="text-xs text-white/50">{t("Appears on", "يظهر في")}: {block.pages.length ? block.pages.map((pageId) => { const page = PAGE_OPTIONS.find((item) => item.id === pageId); return t(page?.en ?? pageId, page?.ar ?? pageId); }).join(" • ") : t("No pages yet", "لا صفحات بعد")}</p>
                      </div>
                      <div className="flex flex-wrap items-start justify-end gap-2">
                        <button type="button" onClick={() => { setSelectedBlockId(block.id); setEditorStep("edit"); }} className="rounded-xl border border-white/10 bg-black/25 px-3 py-2 text-xs text-white/76 transition hover:bg-white/6">{t("Edit", "تعديل")}</button>
                        <button type="button" onClick={() => focusBlockPreview(block)} className="rounded-xl border border-brand-gold/30 bg-brand-gold/8 px-3 py-2 text-xs text-[#f6d293] transition hover:bg-brand-gold/12">{t("Show in preview", "اعرضه في المعاينة")}</button>
                        <button type="button" onClick={() => duplicateBlock(block.id)} className="rounded-xl border border-white/10 bg-black/25 px-3 py-2 text-xs text-white/76 transition hover:bg-white/6">{t("Duplicate", "نسخ")}</button>
                        <button type="button" onClick={() => patchBlock(block.id, { enabled: !block.enabled })} className="rounded-xl border border-white/10 bg-black/25 px-3 py-2 text-xs text-white/76 transition hover:bg-white/6">{block.enabled ? t("Hide", "إخفاء") : t("Show", "إظهار")}</button>
                        <button type="button" onClick={() => { updateSystemBlocks(blocks.filter((item) => item.id !== block.id)); if (selectedBlockId === block.id) setSelectedBlockId(null); }} className="rounded-xl border border-red-400/30 bg-red-500/10 px-3 py-2 text-xs text-red-200 transition hover:bg-red-500/15">{t("Delete", "حذف")}</button>
                      </div>
                    </article>
                  ))}

                  {!currentZoneBlocks.length ? <div className="rounded-[22px] border border-dashed border-white/10 px-6 py-10 text-center text-sm text-white/45">{t("This area is empty. Add the first item from the library.", "هذا الجزء فارغ. أضف أول عنصر من المكتبة.")}</div> : null}
                </div>
              </section>

              <aside className="grid min-w-0 gap-4">
                <div className="rounded-[24px] border border-white/10 bg-[#120f0d] p-4">
                  <p className="text-xs uppercase tracking-[0.22em] text-brand-gold">{t("Choose another area", "اختر جزءًا آخر")}</p>
                  <div className="mt-4 grid gap-2">
                    {(["header", "lead", "footer"] as const).filter((zone) => hasZone(zone)).map((zone) => (
                      <button key={zone} type="button" onClick={() => { setActiveZoneView(zone); setLibraryOpen(false); setSearch(""); }} className={`min-w-0 rounded-xl border px-3 py-3 text-sm text-left leading-6 transition ${currentZone === zone ? "border-brand-gold bg-brand-gold/10 text-white" : "border-white/10 bg-black/25 text-white/65 hover:bg-white/6"}`}>
                        {zoneMeta(zone, t).title}
                      </button>
                    ))}
                  </div>
                </div>

                {libraryOpen ? (
                  <div className="rounded-[24px] border border-white/10 bg-[#120f0d] p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-xs uppercase tracking-[0.22em] text-brand-gold">{t("Element library", "مكتبة العناصر")}</p>
                        <p className="mt-2 text-sm text-white/58">{t("Only the items for the current area are shown here.", "هنا تظهر فقط العناصر المناسبة للجزء الحالي.")}</p>
                      </div>
                      <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-[10px] text-white/60">{visibleLibraryBlocks.length}</span>
                    </div>

                    <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder={t("Search an item...", "ابحث عن عنصر...")} className="mt-4 w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-white placeholder:text-white/35 focus:border-brand-gold/50 focus:outline-none" />
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {(["all", "media", "text", "cta", "forms", "crm"] as const).map((category) => (
                        <button key={category} type="button" onClick={() => setLibraryCategory(category)} className={`rounded-full border px-3 py-2 text-[11px] ${libraryCategory === category ? "border-brand-gold/70 bg-brand-gold/15 text-white" : "border-white/10 bg-black/20 text-white/65"}`}>
                          {categoryLabel(category, t)}
                        </button>
                      ))}
                    </div>

                    <div className="mt-4 grid gap-3">
                      {visibleLibraryBlocks.map((item) => (
                        <button key={item.id} type="button" onClick={() => addLibraryBlock(item.id)} className="grid gap-2 rounded-[18px] border border-white/10 bg-black/20 p-3 text-left transition hover:border-brand-gold/40 hover:bg-white/5">
                          <div className="flex items-center justify-between gap-3">
                            <span className="truncate text-sm font-semibold text-white">{t(item.titleEn, item.titleAr)}</span>
                            <span className="rounded-full border border-brand-gold/35 bg-brand-gold/10 px-2.5 py-1 text-[10px] text-[#f6d293]">{t("Add", "إضافة")}</span>
                          </div>
                          <p className="text-xs leading-6 text-white/52">{t(item.subtitleEn, item.subtitleAr)}</p>
                        </button>
                      ))}
                    </div>
                  </div>
                ) : null}
              </aside>
            </div>
          ) : null}
          {editorStep === "edit" ? (
            <div className="grid gap-4 2xl:grid-cols-[minmax(0,1fr)_380px]">
              <section className="rounded-[24px] border border-white/10 bg-[#120f0d] p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-xs uppercase tracking-[0.22em] text-brand-gold">{t("Edit selected item", "عدّل العنصر المحدد")}</p>
                    <p className="mt-2 text-sm text-white/58">{t("Only the chosen item is shown here to keep focus.", "هنا يظهر العنصر المختار فقط للحفاظ على التركيز.")}</p>
                  </div>
                  <button type="button" onClick={() => setEditorStep("arrange")} className="rounded-xl border border-white/10 bg-black/25 px-3 py-2 text-xs text-white/76 transition hover:bg-white/6">{t("Back to arrangement", "العودة للترتيب")}</button>
                </div>

                {selectedBlock ? (
                  <div className="mt-4 grid gap-4">
                    <div className="rounded-[22px] border border-white/10 bg-black/20 p-4">
                      <p className="text-sm font-semibold text-white">{t(selectedBlock.label.en, selectedBlock.label.ar)}</p>
                      <p className="mt-2 text-xs text-white/45">{selectedBlock.id}</p>
                      <div className="mt-3 flex flex-wrap gap-2">
                        {selectedBlock.pages.map((page) => {
                          const option = PAGE_OPTIONS.find((item) => item.id === page);
                          const pageLabel = option ? t(option.en, option.ar) : page;
                          return (
                            <span key={page} className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-[10px] text-white/60">
                              {pageLabel}
                            </span>
                          );
                        })}
                      </div>
                    </div>

                    <LocalizedTextEditor label={t("Item title", "عنوان العنصر")} value={selectedBlock.label} onChange={(next) => patchBlock(selectedBlock.id, { label: next })} as="input" englishPlaceholder="Item title" arabicPlaceholder="عنوان العنصر" />

                    <Field label={t("Pages where it appears", "الصفحات التي يظهر فيها")}>
                      <div className="flex flex-wrap gap-2">
                        {PAGE_OPTIONS.map((page) => {
                          const on = selectedBlock.pages.includes(page.id);
                          return <button key={page.id} type="button" onClick={() => togglePage(selectedBlock.id, page.id)} className={`rounded-full border px-3 py-2 text-xs ${on ? "border-brand-gold bg-brand-gold/10 text-white" : "border-white/10 bg-black/25 text-white/65"}`}>{t(page.en, page.ar)}</button>;
                        })}
                      </div>
                    </Field>

                    <Field label={t("Item area", "مكان العنصر")}>
                      <div className="grid gap-2 lg:grid-cols-3">
                        {(["header", "lead", "footer"] as const).filter((zone) => hasZone(zone)).map((zone) => (
                          <button key={zone} type="button" onClick={() => patchBlock(selectedBlock.id, { zone })} className={`rounded-xl border px-3 py-3 text-sm transition ${selectedBlock.zone === zone ? "border-brand-gold bg-brand-gold/10 text-white" : "border-white/10 bg-black/25 text-white/65 hover:bg-white/6"}`}>
                            {zoneMeta(zone, t).title}
                          </button>
                        ))}
                      </div>
                    </Field>

                    <div className="grid gap-3 md:grid-cols-2 2xl:grid-cols-3">
                      <SummaryCard label={t("Current area", "الجزء الحالي")} value={zoneMeta(selectedBlock.zone, t).title} tone="accent" />
                      <SummaryCard label={t("Visible pages", "الصفحات الظاهرة")} value={selectedBlock.pages.length} />
                      <SummaryCard label={t("State", "الحالة")} value={selectedBlock.enabled ? t("Visible", "ظاهر") : t("Hidden", "مخفي")} />
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <button type="button" onClick={() => askHazemForSystemArea("admin", zoneMeta(selectedBlock.zone, t).title)} className="rounded-full border border-white/10 bg-black/18 px-4 py-2 text-xs font-semibold text-white/72 transition hover:bg-white/[0.05]">
                        {t("Ask Hazem about this item", "اسأل حازم عن هذا العنصر")}
                      </button>
                      <button type="button" onClick={() => askHazemForSystemArea("website", zoneMeta(selectedBlock.zone, t).title)} className="rounded-full border border-brand-gold/35 bg-brand-gold/10 px-4 py-2 text-xs font-semibold text-[#f8d28b] transition hover:bg-brand-gold/15">
                        {t("Ask Hazem for stronger copy", "اطلب من حازم تحسين النص")}
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="mt-4 rounded-[22px] border border-dashed border-white/10 px-6 py-14 text-center text-sm text-white/45">{t("Choose an item first from the arrangement step.", "اختر عنصرًا أولًا من خطوة الترتيب.")}</div>
                )}
              </section>

              <aside className="rounded-[24px] border border-white/10 bg-[#120f0d] p-4">
                <p className="text-xs uppercase tracking-[0.22em] text-brand-gold">{t("Quick actions", "إجراءات سريعة")}</p>
                {selectedBlock ? (
                  <div className="mt-4 grid gap-2">
                    <button type="button" onClick={() => patchBlock(selectedBlock.id, { enabled: !selectedBlock.enabled })} className={`rounded-xl border px-4 py-3 text-sm transition ${selectedBlock.enabled ? "border-emerald-400/35 bg-emerald-500/10 text-emerald-200" : "border-white/10 bg-black/25 text-white/70 hover:bg-white/6"}`}>{selectedBlock.enabled ? t("Visible now", "ظاهر الآن") : t("Hidden now", "مخفي الآن")}</button>
                    <button type="button" onClick={() => focusBlockPreview(selectedBlock)} className="rounded-xl border border-brand-gold/30 bg-brand-gold/8 px-4 py-3 text-sm text-[#f6d293] transition hover:bg-brand-gold/12">{t("Show on live preview", "اعرضه في المعاينة الحية")}</button>
                    <a href={`${PUBLIC_SITE_URL}${pageToPublicRoute(selectedBlock.pages[0] ?? "home")}?focus=${zoneToTargetId(selectedBlock.zone)}`} target="_blank" rel="noreferrer" className="rounded-xl border border-white/10 bg-black/25 px-4 py-3 text-sm text-white/76 transition hover:bg-white/6">{t("Open on website", "افتحه على الموقع")}</a>
                    <button type="button" onClick={() => duplicateBlock(selectedBlock.id)} className="rounded-xl border border-white/10 bg-black/25 px-4 py-3 text-sm text-white/76 transition hover:bg-white/6">{t("Duplicate item", "نسخ العنصر")}</button>
                    <button type="button" onClick={() => setEditorStep("review")} className="rounded-xl border border-white/10 bg-black/25 px-4 py-3 text-sm text-white/76 transition hover:bg-white/6">{t("Go to review", "اذهب للمراجعة")}</button>
                    <button type="button" onClick={() => { updateSystemBlocks(blocks.filter((item) => item.id !== selectedBlock.id)); setSelectedBlockId(null); setEditorStep("arrange"); }} className="rounded-xl border border-red-400/30 bg-red-500/10 px-4 py-3 text-sm text-red-200 transition hover:bg-red-500/15">{t("Delete item", "حذف العنصر")}</button>
                  </div>
                ) : null}
              </aside>
            </div>
          ) : null}

          {editorStep === "review" ? (
            <div className="grid gap-4 md:grid-cols-2 2xl:grid-cols-3">
              <SummaryCard label={t("Top menu readiness", "جاهزية القائمة العلوية")} value={`${coverage.headerFilled}/${headerFields.length}`} tone="accent" />
              <SummaryCard label={t("Lead form readiness", "جاهزية نموذج العملاء")} value={`${coverage.leadFilled}/${leadFields.length}`} />
              <SummaryCard label={t("Bottom section readiness", "جاهزية أسفل الصفحة")} value={`${coverage.footerFilled}/${footerFields.length}`} />
              <SummaryCard label={t("Visible shared items", "العناصر المشتركة الظاهرة")} value={blocks.filter((item) => item.enabled).length} />
              <SummaryCard label={t("Hidden shared items", "العناصر المخفية")} value={blocks.filter((item) => !item.enabled).length} />
              <SummaryCard label={t("Total shared items", "إجمالي العناصر")} value={blocks.length} tone="accent" />
            </div>
          ) : null}
        </div>
      </BuilderSection>

      {currentCopySection ? (
        <BuilderSection
          eyebrow={t("Shared content", "المحتوى المشترك")}
          title={t("Edit one shared content area at a time.", "عدّل جزءًا مشتركًا واحدًا في كل مرة.")}
          description={t(
            "Choose the exact shared area first, then edit only the items that belong to it.",
            "اختر أولًا الجزء المشترك المطلوب، ثم عدّل فقط العناصر التابعة له.",
          )}
        >
          <div className="grid gap-4">
            <div className="flex flex-wrap gap-2">
              {([
                ["choose", t("1. Choose area", "1. اختر الجزء")],
                ["edit", t("2. Edit item", "2. عدّل العنصر")],
                ["review", t("3. Review", "3. راجع")],
              ] as const).map(([step, label]) => (
                <button
                  key={step}
                  type="button"
                  onClick={() => setCopyFlow(step)}
                  className={`rounded-full border px-4 py-2 text-xs font-semibold uppercase tracking-[0.16em] transition ${
                    copyFlow === step
                      ? "border-brand-gold/60 bg-brand-gold/14 text-[#f8d28b]"
                      : "border-white/10 bg-black/18 text-white/68 hover:border-white/20 hover:bg-white/[0.04]"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>

            {copyFlow === "choose" ? (
              <div className="grid gap-4 md:grid-cols-2 2xl:grid-cols-3">
                {availableCopySections.map((section) => (
                  <button
                    key={section.id}
                    type="button"
                    onClick={() => {
                      setContentFocus(section.id);
                      setCopyEditor(null);
                      setCopyFlow("edit");
                    }}
                    className={`grid gap-3 rounded-[24px] border p-4 text-left transition ${
                      currentCopySection.id === section.id
                        ? "border-brand-gold/60 bg-white/8 shadow-[0_0_0_1px_rgba(242,193,107,0.18)]"
                        : "border-white/10 bg-black/18 hover:border-white/20 hover:bg-white/[0.04]"
                    }`}
                  >
                    <span className="text-sm font-semibold text-white">{section.title}</span>
                    <span className="text-xs leading-6 text-white/48">{section.description}</span>
                  </button>
                ))}
              </div>
            ) : null}

            {copyFlow !== "choose" ? (
              <>
                <div className="flex flex-wrap gap-2">
                  {availableCopySections.map((section) => (
                    <button
                      key={section.id}
                      type="button"
                      onClick={() => {
                        setContentFocus(section.id);
                        setCopyEditor(null);
                        setCopyFlow("edit");
                      }}
                      className={`rounded-xl border px-4 py-2 text-sm transition ${
                        currentCopySection.id === section.id
                          ? "border-brand-gold bg-brand-gold/10 text-white"
                          : "border-white/10 bg-black/20 text-white/70 hover:bg-white/6"
                      }`}
                    >
                      {section.title}
                    </button>
                  ))}
                </div>

                {copyFlow === "edit" ? (
                  <>
                    <div className="rounded-[24px] border border-white/10 bg-black/20 p-4">
                      <h3 className="text-xl font-semibold text-white">{currentCopySection.title}</h3>
                      <p className="mt-2 text-sm leading-7 text-white/58">{currentCopySection.description}</p>
                    </div>

                    <div className="grid gap-4 2xl:grid-cols-[minmax(0,1fr)_400px]">
                      <div className="grid gap-3 2xl:grid-cols-2">
                        {currentCopySection.id === "nav"
                          ? renderCopyCard("nav", "eyebrow", "Eyebrow message", "input", 2)
                          : null}
                        {currentCopySection.fields.map(([field, label, as, rows]) =>
                          renderCopyCard(currentCopySection.id, field, label, as, rows),
                        )}
                      </div>
                      <div className="rounded-[24px] border border-white/10 bg-[#120f0d] p-4">
                        {copyEditor?.section === currentCopySection.id ? (
                          <LocalizedTextEditor
                            label={ui(copyEditor.label)}
                            value={(settings.content[currentCopySection.id] as Record<string, LocalizedText>)[copyEditor.field] ?? defaultText()}
                            onChange={(next) => updateSectionText(currentCopySection.id, copyEditor.field, next)}
                            as={copyEditor.as}
                            englishPlaceholder={`Edit ${copyEditor.label.toLowerCase()}`}
                            arabicPlaceholder={arEditPlaceholder(copyEditor.label)}
                            rows={copyEditor.rows}
                          />
                        ) : (
                          <div className="flex min-h-[220px] items-center justify-center rounded-[18px] border border-dashed border-white/10 px-6 text-center text-sm text-white/45">
                            {t("Pick one item from this area to edit it here.", "اختر عنصرًا واحدًا من هذا الجزء لتعديله هنا.")}
                          </div>
                        )}
                      </div>
                    </div>
                  </>
                ) : null}

                {copyFlow === "review" ? (
                  <div className="grid gap-4 md:grid-cols-2 2xl:grid-cols-3">
                    <SummaryCard label={t("Current shared area", "الجزء المشترك الحالي")} value={currentCopySection.title} tone="accent" />
                    <SummaryCard label={t("Header readiness", "جاهزية العلوي")} value={`${coverage.headerFilled}/${headerFields.length}`} />
                    <SummaryCard label={t("Lead readiness", "جاهزية النموذج")} value={`${coverage.leadFilled}/${leadFields.length}`} />
                    <SummaryCard label={t("Footer readiness", "جاهزية السفلي")} value={`${coverage.footerFilled}/${footerFields.length}`} />
                    <SummaryCard label={t("Visible shared items", "العناصر المشتركة الظاهرة")} value={blocks.filter((item) => item.enabled).length} />
                    <SummaryCard label={t("Current area items", "عناصر الجزء الحالي")} value={currentZone ? blocks.filter((item) => item.zone === currentZone).length : blocks.length} />
                  </div>
                ) : null}
              </>
            ) : null}
          </div>
        </BuilderSection>
      ) : null}
    </div>
  );
}
