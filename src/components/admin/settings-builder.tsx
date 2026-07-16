"use client";

import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { toast } from "sonner";
import { BuilderSection, LocalizedTextEditor, TEXT_COLOR_PRESETS } from "@/components/admin/builder-kit";
import { MediaDropzone } from "@/components/admin/media-fields";
import { AdminStickyActions } from "@/components/admin/admin-design-system";
import { useAdminLocale } from "@/components/admin/admin-locale-provider";
import type { PreviewFocusTarget } from "@/components/admin/live-preview-panel";
import { defaultSiteLayouts } from "@/lib/site-content-defaults";
import { repairTextDeep } from "@/lib/text-fixes";
import { BrandThemeModule } from "./builder-modules/brand-theme-module";
import { SystemStructuresModule } from "./builder-modules/system-structures-module";
import { CalculatorsModule } from "./builder-modules/calculators-module";
import { HazemAIModule } from "./builder-modules/hazem-ai-module";
import { PagesContentModule } from "./builder-modules/pages-content-module";
import type {
  CalculatorAddOn,
  DecisionCardCopy,
  FaqItemCopy,
  FinishingTier,
  HomeDashboardStatCopy,
  HomeServiceLine,
  HomeSignal,
  InstallmentPlan,
  InstallmentUnitType,
  LocaleCode,
  LocalizedListItem,
  LocalizedText,
  SectionLayoutItem,
  SiteLayouts,
  SitePageContent,
  SiteSettings,
  ValueCardCopy,
} from "@/lib/types";

type SettingsBuilderProps = {
  initialSettings: SiteSettings;
  onSettingsChange?: (next: SiteSettings) => void;
  onPreviewFocus?: (focus: PreviewFocusTarget) => void;
  onContextChange?: (context: BuilderContext) => void;
  onAskHazem?: (request: HazemPromptRequest) => void;
};
type ContentSectionKey = "nav" | "footer" | "hero" | "leadForm";
type CalculatorKey = keyof SiteSettings["content"]["calculators"];
type PageKey = keyof SitePageContent;
type LayoutKey = keyof SiteLayouts;
type QuickLinkId =
  | "brand-core"
  | "theme"
  | "header-footer"
  | "hero-lead"
  | "calculators"
  | "hazem-ai"
  | "home-builder"
  | "projects-builder"
  | "finishing-builder"
  | "smart-builder"
  | "book-builder"
  | "project-detail-builder";
type WorkspaceArea = "foundation" | "operations" | "pages";
export type BuilderContext = {
  workspace: WorkspaceArea;
  sectionId: QuickLinkId;
  sectionLabel: string;
  sectionDescription: string;
};
export type HazemPromptRequest = {
  id: number;
  mode: "admin" | "website";
  prompt: string;
  sourceLabel?: string;
  pageTitle?: string;
  targetId?: string | null;
  scope?: "shared" | "local";
};
type SettingsActivityItem = {
  id: string;
  kind: "save" | "draft" | "reset";
  message: string;
  at: string;
};
const SETTINGS_DRAFT_KEY = "veyra:admin:settings:draft:v1";

const quickLinks: ReadonlyArray<readonly [QuickLinkId, string]> = [
  ["brand-core", "Business Identity"],
  ["theme", "Colors & Typography"],
  ["header-footer", "Top Menu + Bottom Section"],
  ["hero-lead", "Main Hero + Lead Form"],
  ["calculators", "Calculators"],
  ["hazem-ai", "Hazem AI"],
  ["home-builder", "Home Page"],
  ["projects-builder", "Projects Page"],
  ["finishing-builder", "Finishing Page"],
  ["smart-builder", "Smart Home Page"],
  ["book-builder", "Visit Booking Page"],
  ["project-detail-builder", "Project Details Page"],
] as const;

const workspaceSections: Readonly<Record<WorkspaceArea, readonly QuickLinkId[]>> = {
  foundation: ["brand-core", "theme", "header-footer", "hero-lead"],
  operations: ["calculators", "hazem-ai"],
  pages: ["home-builder", "projects-builder", "finishing-builder", "smart-builder", "book-builder", "project-detail-builder"],
} as const;

const workspaceMeta: Record<
  WorkspaceArea,
  {
    titleEn: string;
    titleAr: string;
    descriptionEn: string;
    descriptionAr: string;
  }
> = {
  foundation: {
    titleEn: "Website basics",
    titleAr: "أساسيات الموقع",
    descriptionEn: "Brand, colors, header, footer, and the lead entry points visitors see first.",
    descriptionAr: "الهوية والألوان والقائمة العلوية وأسفل الصفحة ومدخل العملاء الذي يراه الزائر أولًا.",
  },
  operations: {
    titleEn: "Sales logic",
    titleAr: "منطق المبيعات",
    descriptionEn: "Calculators, pricing logic, and Hazem controls that support conversion and operations.",
    descriptionAr: "الحاسبات ومنطق التسعير وتحكمات حازم التي تدعم التحويل والتشغيل.",
  },
  pages: {
    titleEn: "Pages content",
    titleAr: "محتوى الصفحات",
    descriptionEn: "Edit each public page separately so the task stays focused and lighter.",
    descriptionAr: "عدّل كل صفحة عامة بشكل منفصل حتى تبقى المهمة أخف وأكثر تركيزًا.",
  },
};

const sectionMeta: Record<
  QuickLinkId,
  {
    titleEn: string;
    titleAr: string;
    descriptionEn: string;
    descriptionAr: string;
  }
> = {
  "brand-core": {
    titleEn: "Business identity",
    titleAr: "هوية النشاط",
    descriptionEn: "Company name, logo, and the core identity that appears across the whole experience.",
    descriptionAr: "اسم الشركة والشعار والهوية الأساسية التي تظهر عبر التجربة كلها.",
  },
  theme: {
    titleEn: "Colors & typography",
    titleAr: "الألوان والخطوط",
    descriptionEn: "Core tones and text styling that shape the public look and feel.",
    descriptionAr: "الدرجات الأساسية وتنسيق النصوص التي تشكل مظهر الموقع العام.",
  },
  "header-footer": {
    titleEn: "Top menu + bottom section",
    titleAr: "القائمة العلوية + أسفل الصفحة",
    descriptionEn: "Shared navigation and footer blocks used across the public pages.",
    descriptionAr: "التنقل العلوي والعناصر السفلية المشتركة عبر الصفحات العامة.",
  },
  "hero-lead": {
    titleEn: "Homepage entry + lead form",
    titleAr: "واجهة البداية + نموذج العملاء",
    descriptionEn: "The first conversion surface visitors interact with before they submit a request.",
    descriptionAr: "أول مساحة تحويل يتفاعل معها الزائر قبل إرسال الطلب.",
  },
  calculators: {
    titleEn: "Calculators",
    titleAr: "الحاسبات",
    descriptionEn: "Installment and finishing logic that supports pricing conversations.",
    descriptionAr: "منطق التقسيط والتشطيب الذي يدعم محادثات التسعير.",
  },
  "hazem-ai": {
    titleEn: "Hazem AI",
    titleAr: "حازم AI",
    descriptionEn: "Assistant prompts, provider setup, and advisor behaviors for admin and website.",
    descriptionAr: "برومبتات المساعد وإعداد المزوّد وسلوك المستشار في الأدمن والموقع.",
  },
  "home-builder": {
    titleEn: "Home page",
    titleAr: "الصفحة الرئيسية",
    descriptionEn: "Hero, services, signals, trust, and booking prompts for the homepage journey.",
    descriptionAr: "الهيرو والخدمات والإشارات والثقة ورسائل الحجز داخل رحلة الصفحة الرئيسية.",
  },
  "projects-builder": {
    titleEn: "Projects page",
    titleAr: "صفحة المشروعات",
    descriptionEn: "The projects listing, decision cards, and conversion reasons around browsing projects.",
    descriptionAr: "قائمة المشروعات وبطاقات القرار وأسباب التحويل أثناء تصفح المشروعات.",
  },
  "finishing-builder": {
    titleEn: "Finishing page",
    titleAr: "صفحة التشطيب",
    descriptionEn: "Packages, process proof, and objections for the finishing experience.",
    descriptionAr: "الباقات ومحتوى الإثبات والخطوات والاعتراضات في تجربة التشطيب.",
  },
  "smart-builder": {
    titleEn: "Smart home page",
    titleAr: "صفحة المنزل الذكي",
    descriptionEn: "Labels, setup steps, and smart-home messaging.",
    descriptionAr: "التسميات وخطوات التركيب ورسائل المنزل الذكي.",
  },
  "book-builder": {
    titleEn: "Visit booking page",
    titleAr: "صفحة الحجز",
    descriptionEn: "Shared booking language and the final request experience.",
    descriptionAr: "لغة الحجز المشتركة وتجربة الطلب النهائية.",
  },
  "project-detail-builder": {
    titleEn: "Project details page",
    titleAr: "صفحة تفاصيل المشروع",
    descriptionEn: "Long-form labels for project highlights, units, gallery, and visit request.",
    descriptionAr: "تسميات صفحة تفاصيل المشروع مثل المزايا والوحدات والمعرض وطلب الزيارة.",
  },
};

const quickLinkArLabels: Partial<Record<QuickLinkId, string>> = {
  "brand-core": "\u0627\u0644\u0639\u0644\u0627\u0645\u0629 \u0648\u0627\u0644\u0647\u0648\u064a\u0629",
  theme: "\u0627\u0644\u062b\u064a\u0645",
  "header-footer": "\u0627\u0644\u0642\u0627\u0626\u0645\u0629 + \u0627\u0644\u0641\u0648\u062a\u0631",
  "hero-lead": "\u0627\u0644\u0628\u062f\u0627\u064a\u0629 + \u0627\u0644\u0639\u0645\u0644\u0627\u0621",
  calculators: "\u0627\u0644\u062d\u0627\u0633\u0628\u0627\u062a",
  "home-builder": "\u0627\u0644\u0635\u0641\u062d\u0629 \u0627\u0644\u0631\u0626\u064a\u0633\u064a\u0629",
  "projects-builder": "\u0635\u0641\u062d\u0629 \u0627\u0644\u0645\u0634\u0631\u0648\u0639\u0627\u062a",
  "finishing-builder": "\u0635\u0641\u062d\u0629 \u0627\u0644\u062a\u0634\u0637\u064a\u0628",
  "smart-builder": "\u0635\u0641\u062d\u0629 \u0627\u0644\u0645\u0646\u0632\u0644 \u0627\u0644\u0630\u0643\u064a",
  "book-builder": "\u0635\u0641\u062d\u0629 \u0627\u0644\u062d\u062c\u0632",
  "project-detail-builder": "\u062a\u0641\u0627\u0635\u064a\u0644 \u0627\u0644\u0645\u0634\u0631\u0648\u0639",
};

function quickLinkArabicLabel(id: QuickLinkId) {
  const overrides: Record<QuickLinkId, string> = {
    "brand-core": "\u0647\u0648\u064a\u0629 \u0627\u0644\u0645\u0648\u0642\u0639",
    theme: "\u0627\u0644\u0623\u0644\u0648\u0627\u0646 \u0648\u0627\u0644\u062e\u0637\u0648\u0637",
    "header-footer": "\u0627\u0644\u0642\u0627\u0626\u0645\u0629 \u0627\u0644\u0639\u0644\u0648\u064a\u0629 + \u0623\u0633\u0641\u0644 \u0627\u0644\u0635\u0641\u062d\u0629",
    "hero-lead": "\u0648\u0627\u062c\u0647\u0629 \u0627\u0644\u0628\u062f\u0627\u064a\u0629 + \u0646\u0645\u0648\u0630\u062c \u0627\u0644\u0639\u0645\u0644\u0627\u0621",
    calculators: "\u0627\u0644\u062d\u0627\u0633\u0628\u0627\u062a",
    "hazem-ai": "\u062d\u0627\u0632\u0645 AI",
    "home-builder": "\u0627\u0644\u0635\u0641\u062d\u0629 \u0627\u0644\u0631\u0626\u064a\u0633\u064a\u0629",
    "projects-builder": "\u0635\u0641\u062d\u0629 \u0627\u0644\u0645\u0634\u0631\u0648\u0639\u0627\u062a",
    "finishing-builder": "\u0635\u0641\u062d\u0629 \u0627\u0644\u062a\u0634\u0637\u064a\u0628",
    "smart-builder": "\u0635\u0641\u062d\u0629 \u0627\u0644\u0645\u0646\u0632\u0644 \u0627\u0644\u0630\u0643\u064a",
    "book-builder": "\u0635\u0641\u062d\u0629 \u0637\u0644\u0628 \u0627\u0644\u0632\u064a\u0627\u0631\u0629",
    "project-detail-builder": "\u0635\u0641\u062d\u0629 \u062a\u0641\u0627\u0635\u064a\u0644 \u0627\u0644\u0645\u0634\u0631\u0648\u0639",
  };
  return overrides[id] ?? quickLinkArLabels[id] ?? id;
}

const cloneSettings = (settings: SiteSettings) => structuredClone(settings);
function buildInitialSettings(initialSettings: SiteSettings): SiteSettings {
  const safeInitial = repairTextDeep(cloneSettings(initialSettings));
  const draft = loadDraftSettings();
  if (!draft) return safeInitial;
  return {
    ...safeInitial,
    ...draft,
    hazemAi: {
      ...safeInitial.hazemAi,
      ...draft.hazemAi,
      systemPrompts: {
        ...safeInitial.hazemAi.systemPrompts,
        ...draft.hazemAi?.systemPrompts,
      },
      analysis: {
        ...safeInitial.hazemAi.analysis,
        ...draft.hazemAi?.analysis,
        autoInsights: draft.hazemAi?.analysis?.autoInsights ?? safeInitial.hazemAi.analysis.autoInsights,
      },
    },
  };
}
function loadDraftSettings(): SiteSettings | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(SETTINGS_DRAFT_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as SiteSettings;
    if (!parsed || typeof parsed !== "object") return null;
    return repairTextDeep(parsed);
  } catch {
    return null;
  }
}
const makeLocalizedItem = (seed = "New item"): LocalizedListItem => ({
  id: `item-${crypto.randomUUID()}`,
  text: defaultText(seed),
});
const defaultText = (seed = ""): LocalizedText => ({ en: seed, ar: "", color: TEXT_COLOR_PRESETS[0]?.value });
const hasText = (value?: LocalizedText) => Boolean(value?.en?.trim() || value?.ar?.trim());

function stableSerialize(value: unknown): string {
  const sortDeep = (input: unknown): unknown => {
    if (typeof input === "string") {
      return input.replace(/\r\n/g, "\n").trimEnd();
    }
    if (Array.isArray(input)) {
      return input.map(sortDeep);
    }
    if (input && typeof input === "object") {
      const record = input as Record<string, unknown>;
      return Object.keys(record)
        .sort()
        .reduce<Record<string, unknown>>((acc, key) => {
          acc[key] = sortDeep(record[key]);
          return acc;
        }, {});
    }
    return input;
  };
  return JSON.stringify(sortDeep(value));
}

function MiniSection({ title, description, children }: { title: string; description?: string; children: React.ReactNode }) {
  return (
    <div className="grid gap-4 rounded-[28px] border border-white/10 bg-black/18 p-5">
      <div>
        <h4 className="font-serif text-2xl text-white">{title}</h4>
        {description ? <p className="mt-2 text-sm text-white/62">{description}</p> : null}
      </div>
      {children}
    </div>
  );
}

const uiButtonPrimary = "admin-shell-button-primary disabled:cursor-wait disabled:opacity-80";
const uiButtonSecondary = "admin-shell-button-secondary";
const uiButtonGhost = "admin-shell-button-ghost";

function BuilderPane({
  active,
  current,
  children,
}: {
  active: QuickLinkId;
  current: QuickLinkId;
  children: React.ReactNode;
}) {
  if (active !== current) return null;
  return <>{children}</>;
}

export function SettingsBuilder({
  initialSettings,
  onSettingsChange,
  onPreviewFocus,
  onContextChange,
  onAskHazem,
}: SettingsBuilderProps) {
  const { t, locale } = useAdminLocale();
  const [settings, setSettings] = useState(() => buildInitialSettings(initialSettings));
  const [savedSnapshot, setSavedSnapshot] = useState(() =>
    stableSerialize(buildInitialSettings(initialSettings)),
  );
  const [message, setMessage] = useState("");
  const [isPending, startTransition] = useTransition();
  const [activeSection, setActiveSection] = useState<QuickLinkId>(quickLinks[0][0]);
  const [activeWorkspace, setActiveWorkspace] = useState<WorkspaceArea>("foundation");
  const [sectionFilter, setSectionFilter] = useState("");
  const [showActivity, setShowActivity] = useState(false);
  const [activityLog, setActivityLog] = useState<SettingsActivityItem[]>([]);
  const [hasRecoveredDraft, setHasRecoveredDraft] = useState(() => Boolean(loadDraftSettings()));
  const [hazemTestMode, setHazemTestMode] = useState<"website" | "admin">("admin");
  const [hazemTestMessage, setHazemTestMessage] = useState("");
  const [hazemTestResponse, setHazemTestResponse] = useState("");
  const [hazemTestLoading, setHazemTestLoading] = useState(false);
  const sectionSearchRef = useRef<HTMLInputElement | null>(null);

  const pages = settings.content.pages!;
  const layouts = settings.content.layouts!;
  const activeSectionLabel = (() => {
    const raw = quickLinks.find(([id]) => id === activeSection)?.[1] ?? "Builder section";
    return t(raw, quickLinkArabicLabel(activeSection));
  })();
  const normalizedFilter = sectionFilter.trim().toLowerCase();
  const scopedGroupIds = workspaceSections[activeWorkspace];
  const filteredSectionIds = scopedGroupIds.filter((id) => {
    if (!normalizedFilter) return true;
    const item = quickLinks.find(([candidate]) => candidate === id);
    if (!item) return false;
    const en = item[1].toLowerCase();
    const ar = quickLinkArabicLabel(id).toLowerCase();
    const meta = sectionMeta[id];
    return (
      en.includes(normalizedFilter) ||
      ar.includes(normalizedFilter) ||
      meta.titleEn.toLowerCase().includes(normalizedFilter) ||
      meta.titleAr.toLowerCase().includes(normalizedFilter)
    );
  });
  const visibleSectionCount = filteredSectionIds.length;
  const visibleSectionIds = filteredSectionIds;
  const activeSectionIndex = visibleSectionIds.findIndex((id) => id === activeSection);
  const hasPrevSection = activeSectionIndex > 0;
  const hasNextSection = activeSectionIndex >= 0 && activeSectionIndex < visibleSectionIds.length - 1;
  const nextSectionId = hasNextSection ? visibleSectionIds[activeSectionIndex + 1] : null;
  const completionPercent = Math.round(
    visibleSectionCount > 0 ? ((activeSectionIndex + 1) / visibleSectionCount) * 100 : 0,
  );
  const activeWorkspaceMeta = workspaceMeta[activeWorkspace];
  const activeSectionMeta = sectionMeta[activeSection];
  const nextSectionLabel = nextSectionId
    ? t(
        quickLinks.find(([id]) => id === nextSectionId)?.[1] ?? "Next section",
        quickLinkArabicLabel(nextSectionId),
      )
    : null;
  const activeSectionDescription = t(activeSectionMeta.descriptionEn, activeSectionMeta.descriptionAr);

  useEffect(() => {
    onContextChange?.({
      workspace: activeWorkspace,
      sectionId: activeSection,
      sectionLabel: activeSectionLabel,
      sectionDescription: activeSectionDescription,
    });
  }, [activeSection, activeSectionDescription, activeSectionLabel, activeWorkspace, onContextChange]);

  const fieldArLabels: Record<string, string> = {
    "Company name": "\u0627\u0633\u0645 \u0627\u0644\u0634\u0631\u0643\u0629",
    "Primary locale": "\u0627\u0644\u0644\u063a\u0629 \u0627\u0644\u0623\u0633\u0627\u0633\u064a\u0629",
    "Supported locales": "\u0627\u0644\u0644\u063a\u0627\u062a \u0627\u0644\u0645\u062f\u0639\u0648\u0645\u0629",
    "Logo source": "\u0645\u0635\u062f\u0631 \u0627\u0644\u0634\u0639\u0627\u0631",
    "Primary logo": "\u0627\u0644\u0634\u0639\u0627\u0631 \u0627\u0644\u0623\u0633\u0627\u0633\u064a",
    "Logo alt text": "\u0627\u0644\u0646\u0635 \u0627\u0644\u0628\u062f\u064a\u0644 \u0644\u0644\u0634\u0639\u0627\u0631",
    "Installment calculator": "\u062d\u0627\u0633\u0628\u0629 \u0627\u0644\u062a\u0642\u0633\u064a\u0637",
    "Finishing calculator": "\u062d\u0627\u0633\u0628\u0629 \u0627\u0644\u062a\u0634\u0637\u064a\u0628",
    "Area options": "\u062e\u064a\u0627\u0631\u0627\u062a \u0627\u0644\u0645\u0633\u0627\u062d\u0629",
    "Down payment percentages": "\u0646\u0633\u0628 \u0627\u0644\u062f\u0641\u0639\u0629 \u0627\u0644\u0645\u0642\u062f\u0645\u0629",
    "Default area": "\u0627\u0644\u0645\u0633\u0627\u062d\u0629 \u0627\u0644\u0627\u0641\u062a\u0631\u0627\u0636\u064a\u0629",
    "Default down payment %": "\u0627\u0644\u062f\u0641\u0639\u0629 \u0627\u0644\u0645\u0642\u062f\u0645\u0629 \u0627\u0644\u0627\u0641\u062a\u0631\u0627\u0636\u064a\u0629 %",
    "Unit id": "\u0645\u0639\u0631\u0641 \u0627\u0644\u0648\u062d\u062f\u0629",
    "Price per meter": "\u0633\u0639\u0631 \u0627\u0644\u0645\u062a\u0631",
    "Unit type label": "\u0627\u0633\u0645 \u0646\u0648\u0639 \u0627\u0644\u0648\u062d\u062f\u0629",
    "Plan id": "\u0645\u0639\u0631\u0641 \u0627\u0644\u062e\u0637\u0629",
    "Years": "\u0627\u0644\u0633\u0646\u0648\u0627\u062a",
    "Interest multiplier": "\u0645\u0639\u0627\u0645\u0644 \u0627\u0644\u0641\u0627\u0626\u062f\u0629",
    "Plan label": "\u0627\u0633\u0645 \u0627\u0644\u062e\u0637\u0629",
    "Activity log": "\u0633\u062c\u0644 \u0627\u0644\u0646\u0634\u0627\u0637",
    Clear: "\u0645\u0633\u062d",
    "No activity yet.": "\u0644\u0627 \u064a\u0648\u062c\u062f \u0646\u0634\u0627\u0637 \u062d\u062a\u0649 \u0627\u0644\u0622\u0646.",
    English: "\u0627\u0644\u0625\u0646\u062c\u0644\u064a\u0632\u064a\u0629",
    Arabic: "\u0627\u0644\u0639\u0631\u0628\u064a\u0629",
  };
  const ui = (en: string, ar?: string) => t(en, ar ?? fieldArLabels[en] ?? en);
  const arEditPlaceholder = (label: string) => `\u062a\u0639\u062f\u064a\u0644 ${fieldArLabels[label] ?? label}`;

  function mutateSettings(mutator: (draft: SiteSettings) => void) {
    setSettings((current) => {
      const next = cloneSettings(current);
      mutator(next);
      onSettingsChange?.(next);
      return next;
    });
  }

  function logActivity(kind: SettingsActivityItem["kind"], message: string) {
    setActivityLog((current) =>
      [{ id: `act-${crypto.randomUUID()}`, kind, message, at: new Date().toISOString() }, ...current].slice(0, 25),
    );
  }

  useEffect(() => {
    try {
      window.localStorage.setItem(SETTINGS_DRAFT_KEY, JSON.stringify(settings));
    } catch {
      // Ignore storage errors.
    }
  }, [settings]);

  useEffect(() => {
    if (!workspaceSections[activeWorkspace].includes(activeSection)) {
      setActiveSection(workspaceSections[activeWorkspace][0]);
    }
  }, [activeWorkspace, activeSection]);

  useEffect(() => {
    if (visibleSectionIds.length > 0 && !visibleSectionIds.includes(activeSection)) {
      setActiveSection(visibleSectionIds[0]);
    }
  }, [activeSection, visibleSectionIds]);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      const key = event.key.toLowerCase();
      const ctrlOrCmd = event.ctrlKey || event.metaKey;

      if (ctrlOrCmd && key === "s") {
        event.preventDefault();
        void saveSettings();
        return;
      }

      if (ctrlOrCmd && key === "k") {
        event.preventDefault();
        sectionSearchRef.current?.focus();
        return;
      }

      if (event.altKey && event.key === "ArrowRight") {
        event.preventDefault();
        const group = workspaceSections[activeWorkspace];
        const currentIndex = group.findIndex((id) => id === activeSection);
        if (currentIndex >= 0 && currentIndex < group.length - 1) {
          setActiveSection(group[currentIndex + 1]);
        }
      }

      if (event.altKey && event.key === "ArrowLeft") {
        event.preventDefault();
        const group = workspaceSections[activeWorkspace];
        const currentIndex = group.findIndex((id) => id === activeSection);
        if (currentIndex > 0) {
          setActiveSection(group[currentIndex - 1]);
        }
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [activeSection, activeWorkspace]);

  function updateSectionText(section: ContentSectionKey, field: string, value: LocalizedText) {
    mutateSettings((draft) => {
      (draft.content[section] as Record<string, LocalizedText>)[field] = value;
    });
  }

  function updateCalculatorText(calculator: CalculatorKey, field: string, value: LocalizedText) {
    mutateSettings((draft) => {
      (draft.content.calculators[calculator] as Record<string, LocalizedText>)[field] = value;
    });
  }

  function updatePageText(page: PageKey, field: string, value: LocalizedText) {
    mutateSettings((draft) => {
      (draft.content.pages![page] as Record<string, LocalizedText>)[field] = value;
    });
  }

  function updateLayout(page: LayoutKey, nextItems: SectionLayoutItem[]) {
    mutateSettings((draft) => {
      draft.content.layouts![page] = nextItems;
    });
  }

  function updateInstallmentUnit(index: number, patch: Partial<InstallmentUnitType>) {
    mutateSettings((draft) => {
      draft.installmentCalculator.unitTypes[index] = { ...draft.installmentCalculator.unitTypes[index], ...patch };
    });
  }

  function updateInstallmentPlan(index: number, patch: Partial<InstallmentPlan>) {
    mutateSettings((draft) => {
      draft.installmentCalculator.plans[index] = { ...draft.installmentCalculator.plans[index], ...patch };
    });
  }

  function updateFinishingTier(index: number, patch: Partial<FinishingTier>) {
    mutateSettings((draft) => {
      draft.finishingCalculator.tiers[index] = { ...draft.finishingCalculator.tiers[index], ...patch };
    });
  }

  function updateFinishingAddOn(index: number, patch: Partial<CalculatorAddOn>) {
    mutateSettings((draft) => {
      draft.finishingCalculator.addOns[index] = { ...draft.finishingCalculator.addOns[index], ...patch };
    });
  }

  function toggleLocale(locale: LocaleCode) {
    mutateSettings((draft) => {
      const exists = draft.supportedLocales.includes(locale);
      const supportedLocales = exists ? draft.supportedLocales.filter((item) => item !== locale) : [...draft.supportedLocales, locale];
      draft.supportedLocales = supportedLocales.length ? supportedLocales : [draft.primaryLocale];
      if (!draft.supportedLocales.includes(draft.primaryLocale)) {
        draft.primaryLocale = draft.supportedLocales[0] ?? "en";
      }
    });
  }

  function saveSettings() {
    setMessage("");
    startTransition(async () => {
      try {
        const response = await fetch("/api/admin/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });
      const data = (await response.json()) as { message?: string; settings?: SiteSettings };
      if (!response.ok || !data.settings) {
        const errorMsg = data.message ?? t("Failed to save settings.", "\u0641\u0634\u0644 \u062d\u0641\u0638 \u0627\u0644\u0625\u0639\u062f\u0627\u062f\u0627\u062a.");
        setMessage(errorMsg);
        toast.error(errorMsg);
        logActivity("save", t("Save failed", "\u0641\u0634\u0644 \u0627\u0644\u062d\u0641\u0638"));
        return;
      }

      const normalizedSaved = cloneSettings(data.settings);
      setSettings(normalizedSaved);
      setSavedSnapshot(stableSerialize(normalizedSaved));
      const successMsg = data.message ?? t("Settings updated successfully.", "\u062a\u0645 \u062a\u062d\u062f\u064a\u062b \u0627\u0644\u0625\u0639\u062f\u0627\u062f\u0627\u062a \u0628\u0646\u062c\u0627\u062d.");
      setMessage(successMsg);
      toast.success(successMsg);
        logActivity("save", t("Saved builder settings", "\u062a\u0645 \u062d\u0641\u0638 \u0625\u0639\u062f\u0627\u062f\u0627\u062a \u0627\u0644\u0645\u0646\u0634\u0626"));
        try {
          window.localStorage.removeItem(SETTINGS_DRAFT_KEY);
          setHasRecoveredDraft(false);
        } catch {
          // Ignore storage errors.
        }
      } catch {
        const errMsg = t("Failed to save settings.", "\u0641\u0634\u0644 \u062d\u0641\u0638 \u0627\u0644\u0625\u0639\u062f\u0627\u062f\u0627\u062a.");
        setMessage(errMsg);
        toast.error(errMsg);
        logActivity("save", t("Save failed", "\u0641\u0634\u0644 \u0627\u0644\u062d\u0641\u0638"));
      }
    });
  }

  async function runHazemTest() {
    if (!hazemTestMessage.trim()) return;
    setHazemTestLoading(true);
    setHazemTestResponse("");
    try {
      const response = await fetch("/api/admin/hazem/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode: hazemTestMode,
          message: hazemTestMessage,
          hazemAi: settings.hazemAi,
        }),
      });
      const data = (await response.json()) as { reply?: string; message?: string };
      if (!response.ok) {
        setHazemTestResponse(data.message ?? "Failed to run Hazem test.");
        return;
      }
      setHazemTestResponse(data.reply ?? "");
    } catch {
      setHazemTestResponse("Technical issue while testing Hazem.");
    } finally {
      setHazemTestLoading(false);
    }
  }

  function resetDraft() {
    setSettings(cloneSettings(initialSettings));
    try {
      window.localStorage.removeItem(SETTINGS_DRAFT_KEY);
      setHasRecoveredDraft(false);
    } catch {
      // Ignore storage errors.
    }
    logActivity("reset", t("Reset draft to last loaded state", "\u062a\u0645\u062a \u0625\u0639\u0627\u062f\u0629 \u0627\u0644\u0645\u0633\u0648\u062f\u0629 \u0644\u0622\u062e\u0631 \u062d\u0627\u0644\u0629 \u062a\u0645 \u062a\u062d\u0645\u064a\u0644\u0647\u0627"));
  }

  function clearDraftCache() {
    try {
      window.localStorage.removeItem(SETTINGS_DRAFT_KEY);
      setHasRecoveredDraft(false);
    } catch {
      // Ignore storage errors.
    }
    logActivity("draft", t("Cleared local draft cache", "\u062a\u0645 \u0645\u0633\u062d \u0643\u0627\u0634 \u0627\u0644\u0645\u0633\u0648\u062f\u0629 \u0627\u0644\u0645\u062d\u0644\u064a"));
  }

  const totalLayoutBlocks = Object.values(layouts).reduce((count, items) => count + items.length, 0);
  const visibleLayoutBlocks = Object.values(layouts).reduce(
    (count, items) => count + items.filter((item) => item.enabled).length,
    0,
  );
  const currentSnapshot = useMemo(() => stableSerialize(settings), [settings]);
  const isDirty = currentSnapshot !== savedSnapshot;
  const missingRequiredCount = useMemo(() => {
    let missing = 0;
    if (!settings.companyName?.trim()) missing += 1;
    if (!settings.branding.logoAlt?.en?.trim()) missing += 1;
    if (!settings.branding.logoUrl?.trim()) missing += 1;
    if (!hasText(settings.content.hero?.title)) missing += 1;
    if (!hasText(settings.content.hero?.description)) missing += 1;
    if (!hasText(settings.content.nav?.home)) missing += 1;
    if (!hasText(settings.content.nav?.cta)) missing += 1;
    if (!hasText(settings.content.leadForm?.title)) missing += 1;
    if (!hasText(settings.content.leadForm?.submitLabel)) missing += 1;
    if (!hasText(settings.content.footer?.copyright)) missing += 1;
    return missing;
  }, [settings]);

  return (
    <div className="grid gap-6">
      <section className="admin-shell-surface rounded-[32px] p-6">
        <div className="flex flex-col gap-5 2xl:flex-row 2xl:items-center 2xl:justify-between">
          <div className="max-w-4xl">
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-brand-gold">
              {t("Builder nucleus", "\u0646\u0648\u0627\u0629 \u0627\u0644\u0645\u0646\u0634\u0626")}
            </p>
            <h2 className="mt-3 font-serif text-4xl text-white">
              {t(
                "All public copy, color, and block structure now lives in one cleaner builder workspace.",
                "\u0643\u0644 \u0646\u0635\u0648\u0635 \u0627\u0644\u0645\u0648\u0642\u0639 \u0648\u0627\u0644\u0623\u0644\u0648\u0627\u0646 \u0648\u0647\u064a\u0643\u0644 \u0627\u0644\u0623\u0642\u0633\u0627\u0645 \u0623\u0635\u0628\u062d\u062a \u0627\u0644\u0622\u0646 \u0641\u064a \u0645\u0633\u0627\u062d\u0629 \u0645\u0646\u0634\u0626 \u0648\u0627\u062d\u062f\u0629 \u0623\u0643\u062b\u0631 \u062a\u0646\u0638\u064a\u0645\u064b\u0627.",
              )}
            </h2>
            <p className="mt-3 text-white/66">
              {t(
                "Every editable website text here supports its own color. You can pick from four core tones or paste any hex value, then reorder or hide page sections without touching code.",
                "\u0643\u0644 \u0646\u0635 \u0642\u0627\u0628\u0644 \u0644\u0644\u062a\u0639\u062f\u064a\u0644 \u0647\u0646\u0627 \u064a\u062f\u0639\u0645 \u0644\u0648\u0646\u064b\u0627 \u062e\u0627\u0635\u064b\u0627 \u0628\u0647. \u064a\u0645\u0643\u0646\u0643 \u0627\u0644\u0627\u062e\u062a\u064a\u0627\u0631 \u0645\u0646 \u0623\u0631\u0628\u0639 \u062f\u0631\u062c\u0627\u062a \u0623\u0633\u0627\u0633\u064a\u0629 \u0623\u0648 \u0625\u062f\u062e\u0627\u0644 \u0623\u064a \u0643\u0648\u062f \u0644\u0648\u0646\u060c \u062b\u0645 \u0625\u0639\u0627\u062f\u0629 \u062a\u0631\u062a\u064a\u0628 \u0623\u0648 \u0625\u062e\u0641\u0627\u0621 \u0627\u0644\u0623\u0642\u0633\u0627\u0645 \u0628\u062f\u0648\u0646 \u062a\u0639\u062f\u064a\u0644 \u0627\u0644\u0643\u0648\u062f.",
              )}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <button type="button" onClick={resetDraft} className={uiButtonGhost}>
              {t("Reset draft", "\u0625\u0639\u0627\u062f\u0629 \u062a\u0639\u064a\u064a\u0646 \u0627\u0644\u0645\u0633\u0648\u062f\u0629")}
            </button>
            <button type="button" onClick={clearDraftCache} className={uiButtonSecondary}>
              {t("Clear draft cache", "\u0645\u0633\u062d \u0643\u0627\u0634 \u0627\u0644\u0645\u0633\u0648\u062f\u0629")}
            </button>
            <button type="button" onClick={saveSettings} disabled={isPending} className={uiButtonPrimary}>
              {isPending ? t("Saving...", "\u062c\u0627\u0631\u064d \u0627\u0644\u062d\u0641\u0638...") : t("Save settings", "\u062d\u0641\u0638 \u0627\u0644\u0625\u0639\u062f\u0627\u062f\u0627\u062a")}
            </button>
          </div>
        </div>
        <div className="mt-6 flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setActiveWorkspace("foundation")}
            className={`rounded-full px-4 py-2 text-xs tracking-[0.16em] transition ${
              activeWorkspace === "foundation"
                ? "admin-shell-nav-item admin-shell-nav-item-active text-white"
                : "admin-shell-nav-item text-white/75 hover:bg-white/7"
            }`}
          >
            {t("Foundation", "\u0627\u0644\u0623\u0633\u0627\u0633")}
          </button>
          <button
            type="button"
            onClick={() => setActiveWorkspace("operations")}
            className={`rounded-full px-4 py-2 text-xs tracking-[0.16em] transition ${
              activeWorkspace === "operations"
                ? "admin-shell-nav-item admin-shell-nav-item-active text-white"
                : "admin-shell-nav-item text-white/75 hover:bg-white/7"
            }`}
          >
            {t("Operations", "\u0627\u0644\u0639\u0645\u0644\u064a\u0627\u062a")}
          </button>
          <button
            type="button"
            onClick={() => setActiveWorkspace("pages")}
            className={`rounded-full px-4 py-2 text-xs tracking-[0.16em] transition ${
              activeWorkspace === "pages"
                ? "admin-shell-nav-item admin-shell-nav-item-active text-white"
                : "admin-shell-nav-item text-white/75 hover:bg-white/7"
            }`}
          >
            {t("Pages", "\u0627\u0644\u0635\u0641\u062d\u0627\u062a")}
          </button>
        </div>
        <div className="mt-5 grid gap-3 md:grid-cols-4">
          <div className="admin-shell-card rounded-[22px] p-4">
            <p className="text-[11px] uppercase tracking-[0.18em] text-white/45">{t("Workspace", "\u0645\u0633\u0627\u062d\u0629 \u0627\u0644\u0639\u0645\u0644")}</p>
            <strong className="mt-2 block text-lg text-white">
              {activeWorkspace === "foundation"
                ? t("Website basics", "\u0623\u0633\u0627\u0633\u064a\u0627\u062a \u0627\u0644\u0645\u0648\u0642\u0639")
                : activeWorkspace === "operations"
                  ? t("Sales logic", "\u0645\u0646\u0637\u0642 \u0627\u0644\u0645\u0628\u064a\u0639\u0627\u062a")
                  : t("Pages content", "\u0645\u062d\u062a\u0648\u0649 \u0627\u0644\u0635\u0641\u062d\u0627\u062a")}
            </strong>
          </div>
          <div className="admin-shell-card rounded-[22px] p-4">
            <p className="text-[11px] uppercase tracking-[0.18em] text-white/45">{t("Current section", "\u0627\u0644\u0642\u0633\u0645 \u0627\u0644\u062d\u0627\u0644\u064a")}</p>
            <strong className="mt-2 block text-lg text-white">{activeSectionLabel}</strong>
          </div>
          <div className="admin-shell-card rounded-[22px] p-4">
            <p className="text-[11px] uppercase tracking-[0.18em] text-white/45">{t("Visible sections", "\u0627\u0644\u0623\u0642\u0633\u0627\u0645 \u0627\u0644\u0638\u0627\u0647\u0631\u0629")}</p>
            <strong className="mt-2 block text-lg text-white">{visibleSectionCount}</strong>
          </div>
          <div className="rounded-[22px] border border-amber-400/30 bg-amber-500/5 p-4">
            <p className="text-[11px] uppercase tracking-[0.18em] text-amber-300/90">{t("Missing required content", "\u0627\u0644\u0645\u062d\u062a\u0648\u0649 \u0627\u0644\u0646\u0627\u0642\u0635")}</p>
            <strong className="mt-2 block text-lg text-white">{missingRequiredCount}</strong>
          </div>
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          {TEXT_COLOR_PRESETS.map((preset) => (
            <span key={preset.value} className="admin-shell-muted-card inline-flex items-center gap-2 whitespace-nowrap rounded-full px-3 py-2 text-xs text-white/72">
              <span className="h-3 w-3 rounded-full border border-white/15" style={{ backgroundColor: preset.value }} />
              {locale === "ar" ? preset.label.ar : preset.label.en}
            </span>
          ))}
        </div>
        {message ? <p className="mt-4 text-sm text-brand-gold">{message}</p> : null}
        {hasRecoveredDraft ? (
          <p className="mt-3 rounded-lg border border-emerald-400/30 bg-emerald-500/10 px-3 py-2 text-xs text-emerald-200">
            {t("Draft recovered from local autosave.", "\u062a\u0645 \u0627\u0633\u062a\u0631\u062c\u0627\u0639 \u0627\u0644\u0645\u0633\u0648\u062f\u0629 \u0645\u0646 \u0627\u0644\u062d\u0641\u0638 \u0627\u0644\u0645\u062d\u0644\u064a \u0627\u0644\u062a\u0644\u0642\u0627\u0626\u064a.")}
          </p>
        ) : null}
      </section>

      <div className="grid gap-6 xl:grid-cols-[260px_minmax(0,1fr)] xl:items-start">
        <aside className="xl:sticky xl:top-24">
          <section className="admin-shell-panel rounded-[30px] p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-brand-gold">{t("Settings navigator", "\u0642\u0627\u0626\u0645\u0629 \u0627\u0644\u0625\u0639\u062f\u0627\u062f\u0627\u062a")}</p>
            <h3 className="mt-3 font-serif text-3xl text-white">{t("Builder map", "\u062e\u0631\u064a\u0637\u0629 \u0627\u0644\u0645\u0646\u0634\u0626")}</h3>
            <div className="mt-4">
              <input
                ref={sectionSearchRef}
                value={sectionFilter}
                onChange={(event) => setSectionFilter(event.target.value)}
                placeholder={t("Search section...", "\u0627\u0628\u062d\u062b \u0639\u0646 \u0642\u0633\u0645...")}
                className="w-full rounded-2xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-white placeholder:text-white/35 focus:border-brand-gold/50 focus:outline-none"
              />
            </div>
            <div className="admin-shell-muted-card mt-3 grid gap-2 rounded-2xl p-2">
              <p className="px-2 text-[10px] uppercase tracking-[0.18em] text-white/42">{t("Quick controls", "\u062a\u062d\u0643\u0645 \u0633\u0631\u064a\u0639")}</p>
              <span className="text-[11px] text-white/45">
                {t("Navigation", "\u0627\u0644\u062a\u0646\u0642\u0644")}: {activeSectionIndex + 1}/{visibleSectionCount}
              </span>
              <span className="text-[11px] text-white/45">
                {t("Now editing", "\u062a\u0639\u062f\u064a\u0644 \u0627\u0644\u0622\u0646")}: {activeSectionLabel}
              </span>
            </div>
            <div className="mt-6 grid gap-3">
              <div className="admin-shell-card rounded-2xl p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-brand-gold">
                  {t(activeWorkspaceMeta.titleEn, activeWorkspaceMeta.titleAr)}
                </p>
                <p className="mt-3 text-sm leading-7 text-white/58">
                  {t(activeWorkspaceMeta.descriptionEn, activeWorkspaceMeta.descriptionAr)}
                </p>
              </div>
              {filteredSectionIds.map((id) => {
                const item = quickLinks.find(([candidate]) => candidate === id);
                if (!item) return null;
                const isActive = activeSection === id;
                const meta = sectionMeta[id];

                return (
                  <button
                    key={id}
                    type="button"
                    onClick={() => setActiveSection(id)}
                    className={`grid gap-2 rounded-[20px] px-4 py-3 text-left transition ${
                      isActive
                        ? "admin-shell-nav-item admin-shell-nav-item-active text-white"
                        : "admin-shell-nav-item text-white/74 hover:text-white"
                    }`}
                  >
                    <span className="text-sm font-semibold">
                      {t(item[1], quickLinkArabicLabel(id))}
                    </span>
                    {isActive ? (
                      <span className="text-xs leading-6 text-white/48">
                        {t(meta.descriptionEn, meta.descriptionAr)}
                      </span>
                    ) : null}
                  </button>
                );
              })}
              {!filteredSectionIds.length ? (
                <div className="admin-shell-muted-card rounded-2xl px-4 py-3 text-xs text-white/60">
                  {t("No section matches your search in this workspace.", "\u0644\u0627 \u064a\u0648\u062c\u062f \u0642\u0633\u0645 \u0645\u0637\u0627\u0628\u0642 \u062f\u0627\u062e\u0644 \u0645\u0633\u0627\u062d\u0629 \u0627\u0644\u0639\u0645\u0644 \u0627\u0644\u062d\u0627\u0644\u064a\u0629.")}
                </div>
              ) : null}
            </div>

          </section>
        </aside>

        <div className="grid min-w-0 gap-5">
          <section className="admin-shell-panel rounded-[30px] p-5">
            <div className="flex flex-col gap-4 2xl:flex-row 2xl:items-center 2xl:justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-white/42">
                  {t(activeWorkspaceMeta.titleEn, activeWorkspaceMeta.titleAr)}
                </p>
                <h3 className="mt-2 font-serif text-3xl text-white">{activeSectionLabel}</h3>
                <p className="mt-3 max-w-3xl text-sm leading-7 text-white/62">
                  {t(activeSectionMeta.descriptionEn, activeSectionMeta.descriptionAr)}
                </p>
              </div>
              <div className="flex flex-col items-start gap-3 2xl:items-end">
                {nextSectionId ? (
                  <div className="admin-shell-card rounded-2xl px-4 py-3 text-sm text-white/72">
                    <p className="text-[11px] uppercase tracking-[0.18em] text-brand-gold">
                      {t("Next suggested task", "\u0627\u0644\u0645\u0647\u0645\u0629 \u0627\u0644\u062a\u0627\u0644\u064a\u0629 \u0627\u0644\u0645\u0642\u062a\u0631\u062d\u0629")}
                    </p>
                    <strong className="mt-2 block text-white">{nextSectionLabel}</strong>
                    <button
                      type="button"
                      onClick={() => setActiveSection(nextSectionId)}
                      className="admin-shell-button-secondary mt-3 text-xs"
                    >
                      {t("Move to next task", "\u0627\u0646\u062a\u0642\u0644 \u0644\u0644\u0645\u0647\u0645\u0629 \u0627\u0644\u062a\u0627\u0644\u064a\u0629")}
                    </button>
                  </div>
                ) : null}
                <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  disabled={!hasPrevSection}
                  onClick={() => hasPrevSection && setActiveSection(visibleSectionIds[activeSectionIndex - 1])}
                  className="admin-shell-button-secondary rounded-full px-3 py-2 text-xs disabled:cursor-not-allowed disabled:opacity-40"
                >
                  {t("Prev", "\u0627\u0644\u0633\u0627\u0628\u0642")}
                </button>
                <button
                  type="button"
                  disabled={!hasNextSection}
                  onClick={() => hasNextSection && setActiveSection(visibleSectionIds[activeSectionIndex + 1])}
                  className="admin-shell-button-secondary rounded-full px-3 py-2 text-xs disabled:cursor-not-allowed disabled:opacity-40"
                >
                  {t("Next", "\u0627\u0644\u062a\u0627\u0644\u064a")}
                </button>
                <span className="admin-shell-muted-card rounded-full px-3 py-1 text-[11px] text-white/65">
                  {t("Progress", "\u0627\u0644\u062a\u0642\u062f\u0645")}: {Number.isFinite(completionPercent) ? completionPercent : 0}%
                </span>
                </div>
              </div>
            </div>
          </section>

      
      <BuilderPane active={activeSection} current="brand-core">
        <BrandThemeModule settings={settings} mutateSettings={mutateSettings} ui={ui} t={t} />
      </BuilderPane>
      <BuilderPane active={activeSection} current="theme">
        <BrandThemeModule settings={settings} mutateSettings={mutateSettings} ui={ui} t={t} />
      </BuilderPane>
      
      <BuilderPane active={activeSection} current="header-footer">
        <SystemStructuresModule settings={settings} mutateSettings={mutateSettings} ui={ui} t={t} defaultText={defaultText} arEditPlaceholder={arEditPlaceholder} mode="header-footer" onPreviewFocus={onPreviewFocus} onAskHazem={onAskHazem} />
      </BuilderPane>
      <BuilderPane active={activeSection} current="hero-lead">
        <SystemStructuresModule settings={settings} mutateSettings={mutateSettings} ui={ui} t={t} defaultText={defaultText} arEditPlaceholder={arEditPlaceholder} mode="lead-only" onPreviewFocus={onPreviewFocus} onAskHazem={onAskHazem} />
      </BuilderPane>

      <BuilderPane active={activeSection} current="calculators">
        <CalculatorsModule settings={settings} mutateSettings={mutateSettings} ui={ui} t={t} defaultText={defaultText} arEditPlaceholder={arEditPlaceholder} />
      </BuilderPane>

      <BuilderPane active={activeSection} current="hazem-ai">
        <HazemAIModule
          settings={settings}
          mutateSettings={mutateSettings}
          ui={ui}
          t={t}
          onSaveSettings={saveSettings}
          isSavingSettings={isPending}
        />
      </BuilderPane>

      <PagesContentModule settings={settings} mutateSettings={mutateSettings} ui={ui} t={t} activeSection={activeSection} arEditPlaceholder={arEditPlaceholder} onPreviewFocus={onPreviewFocus} onAskHazem={onAskHazem} />

        </div>
      </div>
      <section className="rounded-[30px] border border-white/10 bg-white/5 p-5">
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
          <div className="rounded-[24px] border border-white/10 bg-black/20 p-4">
            <p className="text-xs uppercase tracking-[0.2em] text-brand-gold">
              {t("Review before publish", "\u0645\u0631\u0627\u062c\u0639\u0629 \u0642\u0628\u0644 \u0627\u0644\u0646\u0634\u0631")}
            </p>
            <h3 className="mt-3 font-serif text-2xl text-white">
              {t("End this pass with a quick confidence check.", "\u0627\u062e\u062a\u0645 \u0647\u0630\u0647 \u0627\u0644\u062c\u0648\u0644\u0629 \u0628\u0645\u0631\u0627\u062c\u0639\u0629 \u0633\u0631\u064a\u0639\u0629 \u062a\u0639\u0637\u064a\u0643 \u062b\u0642\u0629 \u0642\u0628\u0644 \u0627\u0644\u062d\u0641\u0638.")}
            </h3>
            <div className="mt-4 grid gap-3 md:grid-cols-3">
              <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
                <p className="text-[11px] uppercase tracking-[0.18em] text-white/42">{t("Current task", "\u0627\u0644\u0645\u0647\u0645\u0629 \u0627\u0644\u062d\u0627\u0644\u064a\u0629")}</p>
                <strong className="mt-2 block text-base text-white">{activeSectionLabel}</strong>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
                <p className="text-[11px] uppercase tracking-[0.18em] text-white/42">{t("Unsaved changes", "\u062a\u0639\u062f\u064a\u0644\u0627\u062a \u063a\u064a\u0631 \u0645\u062d\u0641\u0648\u0638\u0629")}</p>
                <strong className="mt-2 block text-base text-white">
                  {isDirty ? t("Need saving", "\u062a\u062d\u062a\u0627\u062c \u062d\u0641\u0638") : t("All saved", "\u0643\u0644 \u0634\u064a\u0621 \u0645\u062d\u0641\u0648\u0638")}
                </strong>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
                <p className="text-[11px] uppercase tracking-[0.18em] text-white/42">{t("Missing content", "\u0627\u0644\u0645\u062d\u062a\u0648\u0649 \u0627\u0644\u0646\u0627\u0642\u0635")}</p>
                <strong className="mt-2 block text-base text-white">{missingRequiredCount}</strong>
              </div>
            </div>
            <div className="mt-4 rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white/62">
              {isDirty
                ? t(
                    "Save this task now so the preview and public experience stay in sync.",
                    "\u0627\u062d\u0641\u0638 \u0647\u0630\u0647 \u0627\u0644\u0645\u0647\u0645\u0629 \u0627\u0644\u0622\u0646 \u062d\u062a\u0649 \u062a\u0638\u0644 \u0627\u0644\u0645\u0639\u0627\u064a\u0646\u0629 \u0648\u0627\u0644\u0645\u0648\u0642\u0639 \u0627\u0644\u0639\u0627\u0645 \u0645\u062a\u0632\u0627\u0645\u0646\u064a\u0646."
                  )
                : t(
                    "This task is stable. You can move to the next section or review the public preview.",
                    "\u0647\u0630\u0647 \u0627\u0644\u0645\u0647\u0645\u0629 \u0645\u0633\u062a\u0642\u0631\u0629. \u064a\u0645\u0643\u0646\u0643 \u0627\u0644\u0627\u0646\u062a\u0642\u0627\u0644 \u0644\u0644\u0642\u0633\u0645 \u0627\u0644\u062a\u0627\u0644\u064a \u0623\u0648 \u0645\u0631\u0627\u062c\u0639\u0629 \u0627\u0644\u0645\u0639\u0627\u064a\u0646\u0629 \u0627\u0644\u0639\u0627\u0645\u0629."
                  )}
            </div>
          </div>

          <div className="rounded-[24px] border border-white/10 bg-black/20 p-4">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-brand-gold">{ui("Activity log")}</p>
                <p className="mt-2 text-sm text-white/55">
                  {t(
                    "Keep this hidden by default and open it only when you need context.",
                    "\u0627\u062c\u0639\u0644 \u0647\u0630\u0627 \u0627\u0644\u0633\u062c\u0644 \u0645\u062e\u0641\u064a\u064b\u0627 \u0627\u0641\u062a\u0631\u0627\u0636\u064a\u064b\u0627 \u0648\u0627\u0641\u062a\u062d\u0647 \u0641\u0642\u0637 \u0639\u0646\u062f\u0645\u0627 \u062a\u062d\u062a\u0627\u062c \u0644\u0644\u0633\u064a\u0627\u0642."
                  )}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowActivity((value) => !value)}
                  className="rounded-full border border-white/10 px-3 py-2 text-xs text-white/72 hover:bg-white/5"
                >
                  {showActivity ? t("Hide", "\u0625\u062e\u0641\u0627\u0621") : t("Show", "\u0625\u0638\u0647\u0627\u0631")}
                </button>
                <button
                  type="button"
                  onClick={() => setActivityLog([])}
                  className="rounded-full border border-white/10 px-3 py-2 text-xs text-white/72 hover:bg-white/5"
                >
                  {ui("Clear")}
                </button>
              </div>
            </div>
            {showActivity ? activityLog.length ? (
              <ul className="grid max-h-72 gap-2 overflow-y-auto pr-1">
                {activityLog.map((item) => (
                  <li key={item.id} className="rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-xs text-white/72">
                    <span className="text-brand-gold">{item.kind}</span> - {item.message}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-white/55">{ui("No activity yet.")}</p>
            ) : (
              <div className="rounded-2xl border border-dashed border-white/10 bg-white/[0.03] px-4 py-6 text-sm text-white/55">
                {t(
                  "Recent saves, draft recovery, and reset events will appear here when you need them.",
                  "\u0633\u062a\u0638\u0647\u0631 \u0647\u0646\u0627 \u0622\u062e\u0631 \u0639\u0645\u0644\u064a\u0627\u062a \u0627\u0644\u062d\u0641\u0638 \u0648\u0627\u0633\u062a\u0631\u062c\u0627\u0639 \u0627\u0644\u0645\u0633\u0648\u062f\u0629 \u0648\u0625\u0639\u0627\u062f\u0629 \u0627\u0644\u0636\u0628\u0637 \u0639\u0646\u062f\u0645\u0627 \u062a\u062d\u062a\u0627\u062c \u0644\u0647\u0627."
                )}
              </div>
            )}
          </div>
        </div>
      </section>
      <AdminStickyActions
        onSave={saveSettings}
        isSaving={isPending}
        isDirty={isDirty}
        saveLabel={t("Save settings", "\u062d\u0641\u0638 \u0627\u0644\u0625\u0639\u062f\u0627\u062f\u0627\u062a")}
        savedLabel={t("Saved", "\u062a\u0645 \u0627\u0644\u062d\u0641\u0638")}
      />
    </div>
  );
}


