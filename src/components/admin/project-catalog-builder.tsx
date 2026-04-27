"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { BuilderSection, LocalizedTextEditor } from "@/components/admin/builder-kit";
import { MediaDropzone, MediaGalleryField } from "@/components/admin/media-fields";
import { useAdminLocale } from "@/components/admin/admin-locale-provider";
import { AdminStickyActions } from "@/components/admin/admin-design-system";
import { ProjectIdentityTab, ProjectMediaTab, ProjectCopyTab, ProjectHighlightsTab, ProjectUnitsTab } from "./builder-modules/project-tabs-module";
import type { LocalizedListItem, LocalizedText, Project, Unit } from "@/lib/types";

type ProjectCatalogBuilderProps = { initialProjects: Project[] };
type ProjectEditorTab = "identity" | "media" | "copy" | "highlights" | "units";
type ProjectActivityItem = {
  id: string;
  kind: "bulk" | "quick_edit" | "create" | "delete" | "save";
  message: string;
  at: string;
};
const PROJECT_DRAFT_KEY = "veyra:admin:projects:draft:v1";
const t = (en: string, ar?: string) => {
  void ar;
  return en;
};

function loadDraftProjects(): Project[] | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(PROJECT_DRAFT_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Project[];
    if (!Array.isArray(parsed) || parsed.length === 0) return null;
    return parsed;
  } catch {
    return null;
  }
}

const cloneProjects = (projects: Project[]) => structuredClone(projects);
const textSeed = (value = ""): LocalizedText => ({ en: value, ar: "", color: "#f5eee6" });
const makeLocalizedItem = (seed: string): LocalizedListItem => ({
  id: `item-${crypto.randomUUID()}`,
  text: textSeed(seed),
});
const makeUnit = (): Unit => ({
  id: `unit-${crypto.randomUUID()}`,
  type: "Residential",
  image: "/scenes/residences.svg",
  area: 120,
  floor: 1,
  bedrooms: 2,
  price: 0,
  status: "available",
});
const makeProject = (): Project => {
  const id = `prj-${crypto.randomUUID()}`;

  return {
    id,
    slug: id,
    name: "New Project",
    location: "New Location",
    category: "Residential",
    description: "Project description",
    heroImage: "/scenes/tower-close.svg",
    gallery: ["/scenes/tower-close.svg"],
    startingPricePerMeter: 20000,
    installmentYears: 6,
    featured: false,
    highlights: ["Primary project highlight"],
    content: {
      name: textSeed("New Project"),
      location: textSeed("New Location"),
      category: textSeed("Residential"),
      description: textSeed("Project description"),
      highlights: [makeLocalizedItem("Primary project highlight")],
      operations: {
        siteState: "under_construction",
        progressPercent: 0,
        currentPhase: "Initial setup",
        note: "",
      },
    },
    units: [makeUnit()],
  };
};

function Box({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid gap-3 rounded-[24px] border border-white/10 bg-black/20 p-4">
      <p className="text-sm font-semibold text-white/86">{label}</p>
      {children}
    </div>
  );
}

const PROJECT_EDITOR_TABS: Array<{
  id: ProjectEditorTab;
  label: { en: string; ar: string };
  description: { en: string; ar: string };
}> = [
  {
    id: "identity",
    label: { en: "Identity", ar: "الهوية" },
    description: {
      en: "Project identifiers, pricing, and visibility flags.",
      ar: "معرفات المشروع، التسعير، وحالات الظهور.",
    },
  },
  {
    id: "media",
    label: { en: "Media", ar: "الوسائط" },
    description: {
      en: "Hero image and project gallery.",
      ar: "الصورة الرئيسية ومعرض صور المشروع.",
    },
  },
  {
    id: "copy",
    label: { en: "Copy", ar: "المحتوى" },
    description: {
      en: "Translated project copy and text colors.",
      ar: "نصوص المشروع المترجمة وألوانها.",
    },
  },
  {
    id: "highlights",
    label: { en: "Highlights", ar: "المميزات" },
    description: {
      en: "Selling points and promotional bullets.",
      ar: "نقاط البيع والنصوص الترويجية.",
    },
  },
  {
    id: "units",
    label: { en: "Units", ar: "الوحدات" },
    description: {
      en: "Available units, metadata, and pricing.",
      ar: "الوحدات المتاحة وبياناتها وتسعيرها.",
    },
  },
];

export function ProjectCatalogBuilder({ initialProjects }: ProjectCatalogBuilderProps) {
  const { locale, t } = useAdminLocale();
  const [projects, setProjects] = useState(() => loadDraftProjects() ?? cloneProjects(initialProjects));
  const [savedSnapshot, setSavedSnapshot] = useState(() => JSON.stringify(initialProjects));
  const [message, setMessage] = useState("");
  const [isPending, startTransition] = useTransition();
  const [selectedProjectId, setSelectedProjectId] = useState(
    () => (loadDraftProjects() ?? initialProjects)[0]?.id ?? "",
  );
  const [activeTab, setActiveTab] = useState<ProjectEditorTab>("identity");
  const [selectedProjectIds, setSelectedProjectIds] = useState<string[]>([]);
  const [activityLog, setActivityLog] = useState<ProjectActivityItem[]>([]);
  const [hasRecoveredDraft, setHasRecoveredDraft] = useState(() => Boolean(loadDraftProjects()));
  const activityKindLabel = (kind: ProjectActivityItem["kind"]) =>
    kind === "bulk"
      ? t("bulk", "جماعي")
      : kind === "quick_edit"
        ? t("quick edit", "تعديل سريع")
        : kind === "create"
          ? t("create", "إنشاء")
          : kind === "delete"
            ? t("delete", "حذف")
            : t("save", "حفظ");

  function logActivity(kind: ProjectActivityItem["kind"], message: string) {
    setActivityLog((current) =>
      [{ id: `act-${crypto.randomUUID()}`, kind, message, at: new Date().toISOString() }, ...current].slice(0, 20),
    );
  }

  useEffect(() => {
    try {
      window.localStorage.setItem(PROJECT_DRAFT_KEY, JSON.stringify(projects));
    } catch {
      // Ignore storage quota/security errors.
    }
  }, [projects]);

  function updateProject(index: number, patch: Partial<Project>) {
    setProjects((current) => {
      const next = [...current];
      next[index] = { ...next[index], ...patch };
      return next;
    });
  }

  function updateProjectText(
    index: number,
    field: keyof NonNullable<Project["content"]>,
    value: LocalizedText,
  ) {
    setProjects((current) => {
      const next = [...current];
      const project = next[index];
      const content = { ...(project.content ?? {}) };
      next[index] = {
        ...project,
        ...(field === "name" ? { name: value.en || project.name } : {}),
        ...(field === "location" ? { location: value.en || project.location } : {}),
        ...(field === "category" ? { category: value.en || project.category } : {}),
        ...(field === "description" ? { description: value.en || project.description } : {}),
        content: { ...content, [field]: value },
      };
      return next;
    });
  }

  function updateUnit(projectIndex: number, unitIndex: number, patch: Partial<Unit>) {
    setProjects((current) => {
      const next = [...current];
      const units = [...next[projectIndex].units];
      units[unitIndex] = { ...units[unitIndex], ...patch };
      next[projectIndex] = { ...next[projectIndex], units };
      return next;
    });
  }

  function updateHighlight(projectIndex: number, highlightIndex: number, value: LocalizedText) {
    setProjects((current) => {
      const next = [...current];
      const project = next[projectIndex];
      const highlights = [...(project.content?.highlights ?? [])];
      highlights[highlightIndex] = {
        ...(highlights[highlightIndex] ?? makeLocalizedItem("")),
        text: value,
      };
      next[projectIndex] = {
        ...project,
        highlights: highlights.map((item) => item.text.en).filter(Boolean),
        content: { ...(project.content ?? {}), highlights },
      };
      return next;
    });
  }

  function addHighlight(projectIndex: number) {
    setProjects((current) => {
      const next = [...current];
      const project = next[projectIndex];
      const highlights = [...(project.content?.highlights ?? []), makeLocalizedItem("New highlight")];
      next[projectIndex] = {
        ...project,
        highlights: highlights.map((item) => item.text.en).filter(Boolean),
        content: { ...(project.content ?? {}), highlights },
      };
      return next;
    });
  }

  function removeHighlight(projectIndex: number, highlightIndex: number) {
    setProjects((current) => {
      const next = [...current];
      const project = next[projectIndex];
      const highlights = (project.content?.highlights ?? []).filter((_, index) => index !== highlightIndex);
      next[projectIndex] = {
        ...project,
        highlights: highlights.map((item) => item.text.en).filter(Boolean),
        content: { ...(project.content ?? {}), highlights },
      };
      return next;
    });
  }

  function addProject() {
    const nextProject = makeProject();
    setProjects((current) => [...current, nextProject]);
    setSelectedProjectId(nextProject.id);
    setActiveTab("identity");
    logActivity("create", t(`Created project ${nextProject.name}`, `تم إنشاء المشروع ${nextProject.name}`));
  }

  function removeProject(projectIndex: number) {
    setProjects((current) => {
      const removedProject = current[projectIndex];
      const next = current.filter((_, index) => index !== projectIndex);
      const nextSelection = next[Math.min(projectIndex, next.length - 1)]?.id ?? "";
      setSelectedProjectId(nextSelection);
      if (removedProject) {
        setSelectedProjectIds((selected) => selected.filter((id) => id !== removedProject.id));
        logActivity("delete", t(`Deleted project ${removedProject.name}`, `تم حذف المشروع ${removedProject.name}`));
      }
      return next;
    });
  }

  function saveProjects() {
    setMessage("");
    startTransition(async () => {
      const response = await fetch("/api/admin/projects", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(projects),
      });
      const data = (await response.json()) as { message: string; projects?: Project[] };
      setMessage(data.message);
      if (response.ok && data.projects) {
        setProjects(data.projects);
        setSavedSnapshot(JSON.stringify(data.projects));
        setHasRecoveredDraft(false);
        try {
          window.localStorage.removeItem(PROJECT_DRAFT_KEY);
        } catch {
          // Ignore storage cleanup errors.
        }
        logActivity("save", t(`Saved ${data.projects.length} project records`, `تم حفظ ${data.projects.length} سجل مشروع`));
      }
    });
  }

  function toggleProjectSelection(projectId: string) {
    setSelectedProjectIds((current) =>
      current.includes(projectId) ? current.filter((id) => id !== projectId) : [...current, projectId],
    );
  }

  function toggleSelectAllProjects() {
    if (selectedProjectIds.length === projects.length) {
      setSelectedProjectIds([]);
      return;
    }
    setSelectedProjectIds(projects.map((project) => project.id));
  }

  function applyBulkFeatured(featured: boolean) {
    if (!selectedProjectIds.length) return;
    setProjects((current) =>
      current.map((project) => (selectedProjectIds.includes(project.id) ? { ...project, featured } : project)),
    );
    logActivity(
      "bulk",
      featured
        ? t(`Marked ${selectedProjectIds.length} projects as featured`, `تم تمييز ${selectedProjectIds.length} مشروعًا`)
        : t(`Removed featured flag from ${selectedProjectIds.length} projects`, `تمت إزالة التمييز من ${selectedProjectIds.length} مشروعًا`),
    );
  }

  function bulkDeleteSelected() {
    if (!selectedProjectIds.length) return;
    const selected = new Set(selectedProjectIds);
    const next = projects.filter((project) => !selected.has(project.id));
    const removedCount = projects.length - next.length;
    setProjects(next);
    setSelectedProjectIds([]);
    if (!next.some((project) => project.id === selectedProjectId)) {
      setSelectedProjectId(next[0]?.id ?? "");
    }
    logActivity("bulk", t(`Deleted ${removedCount} selected projects`, `تم حذف ${removedCount} مشروعًا محددًا`));
  }

  function clearDraft() {
    try {
      window.localStorage.removeItem(PROJECT_DRAFT_KEY);
    } catch {
      // Ignore storage cleanup errors.
    }
    setHasRecoveredDraft(false);
    logActivity("bulk", t("Cleared local draft cache", "تم مسح كاش المسودة المحلي"));
  }

  const selectedProjectIndex = Math.max(
    projects.findIndex((project) => project.id === selectedProjectId),
    0,
  );
  const selectedProject = projects[selectedProjectIndex];
  const currentSnapshot = useMemo(() => JSON.stringify(projects), [projects]);
  const isDirty = currentSnapshot !== savedSnapshot;
  const selectedCount = selectedProjectIds.length;
  const selectedMissingCount = useMemo(() => {
    if (!selectedProject) return 0;
    let missing = 0;
    if (!selectedProject.name?.trim()) missing += 1;
    if (!selectedProject.slug?.trim()) missing += 1;
    if (!selectedProject.location?.trim()) missing += 1;
    if (!selectedProject.heroImage?.trim()) missing += 1;
    if (!selectedProject.gallery?.length) missing += 1;
    if (!selectedProject.units?.length) missing += 1;
    if (!(selectedProject.startingPricePerMeter > 0)) missing += 1;
    if (!(selectedProject.installmentYears > 0)) missing += 1;
    return missing;
  }, [selectedProject]);

  return (
    <div className="grid gap-6">
      <section className="rounded-[32px] border border-white/10 bg-white/5 p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="font-serif text-4xl text-white">{t("Projects & units builder", "منشئ المشروعات والوحدات")}</h2>
            <p className="mt-2 text-white/68">
              {t(
                "Edit one project at a time through a clean workspace with focused tabs for each area.",
                "قم بتعديل مشروع واحد في كل مرة من خلال مساحة عمل نظيفة بتبويبات مركزة لكل قسم.",
              )}
            </p>
          </div>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={addProject}
              className="rounded-full border border-white/10 px-5 py-3 text-sm text-white transition hover:bg-white/5"
            >
              {t("Add project", "إضافة مشروع")}
            </button>
            <button
              type="button"
              onClick={saveProjects}
              disabled={isPending}
              className="rounded-full bg-gradient-to-r from-[#f2c16b] to-[#c68f43] px-5 py-3 text-sm font-semibold text-[#1f150d]"
            >
              {isPending ? t("Saving...", "جارٍ الحفظ...") : t("Save projects", "حفظ المشروعات")}
            </button>
          </div>
        </div>
        {message ? <p className="mt-4 text-sm text-[#f2c16b]">{message}</p> : null}
        <div className="mt-4 rounded-xl border border-amber-400/30 bg-amber-500/5 px-4 py-3 text-sm text-white/80">
          {t("Missing required fields in selected project:", "الحقول المطلوبة الناقصة في المشروع المحدد:")}{" "}
          <span className="font-semibold text-white">{selectedMissingCount}</span>
        </div>
        {hasRecoveredDraft ? (
          <div className="mt-4 flex flex-wrap items-center justify-between gap-2 rounded-xl border border-sky-400/30 bg-sky-500/10 px-4 py-3 text-sm text-sky-100">
            <span>{t("Draft recovered from local autosave.", "تم استرجاع مسودة من الحفظ التلقائي المحلي.")}</span>
            <button
              type="button"
              onClick={clearDraft}
              className="rounded-full border border-sky-200/30 px-3 py-1.5 text-xs text-sky-100 hover:bg-sky-400/10"
            >
              {t("Clear draft cache", "مسح كاش المسودة")}
            </button>
          </div>
        ) : null}
        <div className="mt-4 grid gap-3 rounded-xl border border-white/10 bg-black/20 px-4 py-3 md:grid-cols-[1fr_auto] md:items-center">
          <p className="text-sm text-white/75">
            {t("Bulk selection:", "التحديد الجماعي:")} <span className="font-semibold text-white">{selectedCount}</span>
          </p>
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={toggleSelectAllProjects} className="rounded-full border border-white/10 px-3 py-2 text-xs text-white/80 hover:bg-white/5">
              {selectedCount === projects.length ? t("Clear all", "إلغاء الكل") : t("Select all", "تحديد الكل")}
            </button>
            <button type="button" onClick={() => applyBulkFeatured(true)} disabled={!selectedCount} className="rounded-full border border-white/10 px-3 py-2 text-xs text-white/80 hover:bg-white/5 disabled:cursor-not-allowed disabled:opacity-40">
              {t("Mark featured", "وضع كمميز")}
            </button>
            <button type="button" onClick={() => applyBulkFeatured(false)} disabled={!selectedCount} className="rounded-full border border-white/10 px-3 py-2 text-xs text-white/80 hover:bg-white/5 disabled:cursor-not-allowed disabled:opacity-40">
              {t("Unmark featured", "إزالة التمييز")}
            </button>
            <button type="button" onClick={bulkDeleteSelected} disabled={!selectedCount} className="rounded-full border border-red-400/30 px-3 py-2 text-xs text-red-200 hover:bg-red-500/10 disabled:cursor-not-allowed disabled:opacity-40">
              {t("Delete selected", "حذف المحدد")}
            </button>
          </div>
        </div>
      </section>

      {projects.length ? (
        <div className="grid gap-6 xl:grid-cols-[320px_minmax(0,1fr)] xl:items-start">
          <aside className="xl:sticky xl:top-24">
            <section className="rounded-[30px] border border-white/10 bg-white/5 p-5 shadow-[0_22px_50px_rgba(0,0,0,0.18)]">
              <p className="text-xs uppercase tracking-[0.2em] text-white/42">{t("Project navigator", "ملاح المشروعات")}</p>
              <h3 className="mt-3 font-serif text-3xl text-white">{t("Choose a project", "اختر مشروعًا")}</h3>
              <p className="mt-3 text-sm leading-7 text-white/62">
                {t(
                  "Work on one project, then move through identity, media, copy, and inventory without visual overload.",
                  "اعمل على مشروع واحد ثم تنقّل بين الهوية والوسائط والمحتوى والمخزون بدون تكدس بصري.",
                )}
              </p>
              <div className="mt-5 grid gap-3">
                {projects.map((project, index) => {
                  const isActive = project.id === selectedProject?.id;
                  return (
                    <button
                      key={project.id}
                      type="button"
                      onClick={() => setSelectedProjectId(project.id)}
                      className={`rounded-[22px] border px-4 py-4 text-left transition ${
                        isActive
                          ? "border-[#f2c16b] bg-white/10 text-white"
                          : "border-white/10 bg-black/20 text-white/76 hover:bg-white/6"
                      }`}
                    >
                      <p className="text-[11px] uppercase tracking-[0.22em] text-[#f2c16b]">
                        {t("Project", "مشروع")} {index + 1}
                      </p>
                      <label
                        className="mt-2 inline-flex items-center gap-2 text-xs text-white/70"
                        onClick={(event) => event.stopPropagation()}
                      >
                        <input
                          type="checkbox"
                          checked={selectedProjectIds.includes(project.id)}
                          onChange={() => toggleProjectSelection(project.id)}
                        />
                        {t("Select", "تحديد")}
                      </label>
                      <p className="mt-2 text-sm font-semibold text-white">
                        {project.content?.name?.en ?? project.name}
                      </p>
                      <p className="mt-1 text-xs text-white/52">
                        {project.location} · {project.units.length} {t("units", "وحدات")}
                      </p>
                    </button>
                  );
                })}
              </div>
            </section>
          </aside>

          <div className="grid min-w-0 gap-6">
            <section className="rounded-[30px] border border-white/10 bg-white/5 p-5 shadow-[0_22px_50px_rgba(0,0,0,0.18)]">
              <div className="flex flex-col gap-4 2xl:flex-row 2xl:items-center 2xl:justify-between">
                <div>
                  <p className="text-xs uppercase tracking-[0.2em] text-white/42">{t("Project editor", "تعديل المشروع")}</p>
                  <h3 className="mt-2 font-serif text-3xl text-white">
                    {selectedProject?.content?.name?.en ?? selectedProject?.name}
                  </h3>
                  <p className="mt-3 text-sm leading-7 text-white/62">
                    {t(
                      "Each group lives in its own tab to keep complex project data readable and quick to edit.",
                      "كل قسم معزول في تبويب مستقل لتظل بيانات المشروع مقروءة وسريعة التعديل.",
                    )}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {PROJECT_EDITOR_TABS.map((tab) => (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => setActiveTab(tab.id)}
                      className={`rounded-full border px-4 py-2 text-xs uppercase tracking-[0.16em] transition ${
                        activeTab === tab.id
                          ? "border-[#f2c16b] bg-white/10 text-white"
                          : "border-white/10 bg-black/20 text-white/70 hover:bg-white/6"
                      }`}
                    >
                      {locale === "ar" ? tab.label.ar : tab.label.en}
                    </button>
                  ))}
                </div>
              </div>
              <p className="mt-4 text-sm text-white/56">
                {locale === "ar"
                  ? PROJECT_EDITOR_TABS.find((tab) => tab.id === activeTab)?.description.ar
                  : PROJECT_EDITOR_TABS.find((tab) => tab.id === activeTab)?.description.en}
              </p>
              {selectedProject ? (
                <div className="mt-4 grid gap-3 rounded-xl border border-white/10 bg-black/20 p-4 md:grid-cols-4">
                  <label className="grid gap-2 text-xs text-white/65">
                    {t("Quick name", "اسم سريع")}
                    <input
                      value={selectedProject.name}
                      onChange={(event) => {
                        updateProject(selectedProjectIndex, { name: event.target.value });
                        logActivity("quick_edit", t(`Updated name for ${selectedProject.id}`, `تم تحديث الاسم للمشروع ${selectedProject.id}`));
                      }}
                      className="rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-sm text-white outline-none"
                    />
                  </label>
                  <label className="grid gap-2 text-xs text-white/65">
                    {t("Quick location", "موقع سريع")}
                    <input
                      value={selectedProject.location}
                      onChange={(event) => {
                        updateProject(selectedProjectIndex, { location: event.target.value });
                        logActivity("quick_edit", t(`Updated location for ${selectedProject.id}`, `تم تحديث الموقع للمشروع ${selectedProject.id}`));
                      }}
                      className="rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-sm text-white outline-none"
                    />
                  </label>
                  <label className="grid gap-2 text-xs text-white/65">
                    {t("Price / m²", "السعر / م²")}
                    <input
                      type="number"
                      value={selectedProject.startingPricePerMeter}
                      onChange={(event) => {
                        updateProject(selectedProjectIndex, { startingPricePerMeter: Number(event.target.value) || 0 });
                        logActivity("quick_edit", t(`Updated price for ${selectedProject.id}`, `تم تحديث السعر للمشروع ${selectedProject.id}`));
                      }}
                      className="rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-sm text-white outline-none"
                    />
                  </label>
                  <label className="grid gap-2 text-xs text-white/65">
                    {t("Installment years", "سنوات التقسيط")}
                    <input
                      type="number"
                      value={selectedProject.installmentYears}
                      onChange={(event) => {
                        updateProject(selectedProjectIndex, { installmentYears: Number(event.target.value) || 0 });
                        logActivity("quick_edit", t(`Updated installment years for ${selectedProject.id}`, `تم تحديث سنوات التقسيط للمشروع ${selectedProject.id}`));
                      }}
                      className="rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-sm text-white outline-none"
                    />
                  </label>
                </div>
              ) : null}
            </section>

            <section className="rounded-[30px] border border-white/10 bg-white/5 p-5 shadow-[0_18px_40px_rgba(0,0,0,0.16)]">
              <div className="flex items-center justify-between gap-3">
                <h4 className="font-serif text-2xl text-white">{t("Activity log", "سجل النشاط")}</h4>
                <button
                  type="button"
                  onClick={() => setActivityLog([])}
                  className="rounded-full border border-white/10 px-3 py-2 text-xs text-white/70 hover:bg-white/5"
                >
                  {t("Clear", "مسح")}
                </button>
              </div>
              <div className="mt-4 grid gap-2">
                {activityLog.length ? (
                  activityLog.map((item) => (
                    <div key={item.id} className="rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-sm text-white/80">
                      <span className="font-semibold text-white">{activityKindLabel(item.kind)}</span> - {item.message}
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-white/55">{t("No actions recorded yet.", "لا توجد أحداث حتى الآن.")}</p>
                )}
              </div>
            </section>

            {selectedProject ? (
              <BuilderSection
                eyebrow={`${t("Project", "مشروع")} ${selectedProjectIndex + 1}`}
                title={selectedProject.content?.name?.en ?? selectedProject.name}
                description={t(
                  "Fields are isolated so project management stays structured and visually calm.",
                  "يتم عزل الحقول لتظل إدارة المشروع منظمة وخالية من التكدس المرئي.",
                )}
              >
                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={() => removeProject(selectedProjectIndex)}
                    className="rounded-full border border-red-400/30 px-4 py-2 text-sm text-red-200 transition hover:bg-red-500/10"
                  >
                    {t("Delete project", "حذف المشروع")}
                  </button>
                </div>

                {activeTab === "identity" ? (
                  <ProjectIdentityTab selectedProject={selectedProject} selectedProjectIndex={selectedProjectIndex} updateProject={updateProject} t={t} />
                ) : null}

                {activeTab === "media" ? (
                  <ProjectMediaTab selectedProject={selectedProject} selectedProjectIndex={selectedProjectIndex} updateProject={updateProject} t={t} />
                ) : null}

                {activeTab === "copy" ? (
                  <ProjectCopyTab selectedProject={selectedProject} selectedProjectIndex={selectedProjectIndex} updateProjectText={updateProjectText} t={t} />
                ) : null}

                {activeTab === "highlights" ? (
                  <ProjectHighlightsTab selectedProject={selectedProject} selectedProjectIndex={selectedProjectIndex} updateHighlight={updateHighlight} addHighlight={addHighlight} removeHighlight={removeHighlight} t={t} />
                ) : null}

                {activeTab === "units" ? (
                  <ProjectUnitsTab selectedProject={selectedProject} selectedProjectIndex={selectedProjectIndex} updateUnit={updateUnit} setProjects={setProjects} t={t} />
                ) : null}
              </BuilderSection>
            ) : null}
          </div>
        </div>
      ) : (
        <section className="rounded-[30px] border border-white/10 bg-white/5 p-10 text-center">
          <h3 className="font-serif text-3xl text-white">{t("No projects added yet", "لا توجد مشروعات مضافة")}</h3>
          <p className="mt-3 text-white/62">
            {t(
              "Add your first project to start building the inventory, media, and copy structure.",
              "قم بإضافة أول مشروع لبناء قاعدة المخزون والمحتوى والنصوص.",
            )}
          </p>
          <button
            type="button"
            onClick={addProject}
            className="mt-6 rounded-full border border-white/10 px-5 py-3 text-sm text-white transition hover:bg-white/5"
          >
            {t("Add project", "إضافة مشروع")}
          </button>
        </section>
      )}
      <AdminStickyActions
        onSave={saveProjects}
        isSaving={isPending}
        isDirty={isDirty}
        saveLabel={t("Save projects", "حفظ المشروعات")}
        savedLabel={t("Saved", "تم الحفظ")}
      />
    </div>
  );
}
  const activityKindLabel = (kind: ProjectActivityItem["kind"]) =>
    kind === "bulk"
      ? t("bulk", "جماعي")
      : kind === "quick_edit"
        ? t("quick edit", "تعديل سريع")
        : kind === "create"
          ? t("create", "إنشاء")
          : kind === "delete"
            ? t("delete", "حذف")
            : t("save", "حفظ");
void 0;
void activityKindLabel;
