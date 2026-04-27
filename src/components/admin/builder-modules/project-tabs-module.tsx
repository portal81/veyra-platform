"use client";

import { LocalizedTextEditor } from "@/components/admin/builder-kit";
import { MediaDropzone, MediaGalleryField } from "@/components/admin/media-fields";
import type { DeliverySiteState, Project, LocalizedText, Unit } from "@/lib/types";

// Box primitive from main file
function Box({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid gap-3 rounded-[24px] border border-white/10 bg-black/20 p-4">
      <p className="text-sm font-semibold text-white/86">{label}</p>
      {children}
    </div>
  );
}

// Re-use textSeed from parent
const textSeed = (value = ""): LocalizedText => ({ en: value, ar: "", color: "#f5eee6" });
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

export function ProjectIdentityTab({
  selectedProject,
  selectedProjectIndex,
  updateProject,
  t,
}: {
  selectedProject: Project;
  selectedProjectIndex: number;
  updateProject: (index: number, patch: Partial<Project>) => void;
  t: (en: string, ar: string) => string;
}) {
  const operations = selectedProject.content?.operations ?? {};

  return (
    <div className="mt-6 grid gap-4 lg:grid-cols-4">
      <Box label={t("Project ID", "معرف المشروع")}>
        <input
          value={selectedProject.id}
          onChange={(event) => updateProject(selectedProjectIndex, { id: event.target.value })}
          className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-white outline-none"
        />
      </Box>
      <Box label={t("Slug", "الرابط المختصر")}>
        <input
          value={selectedProject.slug}
          onChange={(event) => updateProject(selectedProjectIndex, { slug: event.target.value })}
          className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-white outline-none"
        />
      </Box>
      <Box label={t("Price per meter", "سعر المتر")}>
        <input
          type="number"
          value={selectedProject.startingPricePerMeter}
          onChange={(event) =>
            updateProject(selectedProjectIndex, { startingPricePerMeter: Number(event.target.value) || 0 })
          }
          className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-white outline-none"
        />
      </Box>
      <Box label={t("Installment years", "سنوات التقسيط")}>
        <div className="flex items-center gap-4">
          <input
            type="number"
            value={selectedProject.installmentYears}
            onChange={(event) =>
              updateProject(selectedProjectIndex, { installmentYears: Number(event.target.value) || 0 })
            }
            className="min-w-0 flex-1 rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-white outline-none"
          />
          <label className="inline-flex items-center gap-2 text-white/76">
            <input
              type="checkbox"
              checked={selectedProject.featured}
              onChange={(event) => updateProject(selectedProjectIndex, { featured: event.target.checked })}
            />
            {t("Featured", "مميز")}
          </label>
        </div>
      </Box>
      <Box label={t("Operational site state", "حالة الموقع التشغيلية")}>
        <select
          value={operations.siteState ?? "not_started"}
          onChange={(event) =>
            updateProject(selectedProjectIndex, {
              content: {
                ...(selectedProject.content ?? {}),
                operations: {
                  ...operations,
                  siteState: event.target.value as DeliverySiteState,
                },
              },
            })
          }
          className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-white outline-none"
        >
          <option value="not_started">{t("Not started", "لم يبدأ")}</option>
          <option value="existing">{t("Built / existing", "مبني / قائم")}</option>
          <option value="under_construction">{t("Under construction", "تحت الإنشاء")}</option>
        </select>
      </Box>
      <Box label={t("Project progress", "تقدم المشروع")}>
        <input
          type="number"
          min={0}
          max={100}
          value={operations.progressPercent ?? 0}
          onChange={(event) =>
            updateProject(selectedProjectIndex, {
              content: {
                ...(selectedProject.content ?? {}),
                operations: {
                  ...operations,
                  progressPercent: Math.max(0, Math.min(100, Number(event.target.value) || 0)),
                },
              },
            })
          }
          className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-white outline-none"
        />
      </Box>
      <Box label={t("Current phase", "المرحلة الحالية")}>
        <input
          value={operations.currentPhase ?? ""}
          onChange={(event) =>
            updateProject(selectedProjectIndex, {
              content: {
                ...(selectedProject.content ?? {}),
                operations: {
                  ...operations,
                  currentPhase: event.target.value,
                },
              },
            })
          }
          className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-white outline-none"
        />
      </Box>
      <Box label={t("Operations note", "ملاحظة تشغيلية")}>
        <input
          value={operations.note ?? ""}
          onChange={(event) =>
            updateProject(selectedProjectIndex, {
              content: {
                ...(selectedProject.content ?? {}),
                operations: {
                  ...operations,
                  note: event.target.value,
                },
              },
            })
          }
          className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-white outline-none"
        />
      </Box>
    </div>
  );
}

export function ProjectMediaTab({
  selectedProject,
  selectedProjectIndex,
  updateProject,
  t,
}: {
  selectedProject: Project;
  selectedProjectIndex: number;
  updateProject: (index: number, patch: Partial<Project>) => void;
  t: (en: string, ar: string) => string;
}) {
  return (
    <div className="mt-6 grid gap-4 xl:grid-cols-2">
      <MediaDropzone
        label={t("Project hero image", "الصورة الرئيسية للمشروع")}
        value={selectedProject.heroImage}
        helperText={t(
          "Used in listing cards and the main project hero.",
          "تستخدم في البطاقات الرئيسية وواجهة تفاصيل المشروع.",
        )}
        onChange={(url) => updateProject(selectedProjectIndex, { heroImage: url })}
      />
      <MediaGalleryField
        label={t("Project gallery", "مكتبة صور المشروع")}
        values={selectedProject.gallery}
        helperText={t(
          "Upload multiple images or videos for the project gallery.",
          "ارفع صورًا متعددة أو مقاطع لعرضها في معرض صفحة المشروع.",
        )}
        onChange={(urls) => updateProject(selectedProjectIndex, { gallery: urls })}
      />
    </div>
  );
}

export function ProjectCopyTab({
  selectedProject,
  selectedProjectIndex,
  updateProjectText,
  t,
}: {
  selectedProject: Project;
  selectedProjectIndex: number;
  updateProjectText: (index: number, field: keyof NonNullable<Project["content"]>, value: LocalizedText) => void;
  t: (en: string, ar: string) => string;
}) {
  return (
    <div className="mt-6 grid gap-4">
      <LocalizedTextEditor
        label={t("Project name", "اسم المشروع")}
        value={selectedProject.content?.name ?? textSeed(selectedProject.name)}
        onChange={(next) => updateProjectText(selectedProjectIndex, "name", next)}
        as="input"
        englishPlaceholder="Project name"
        arabicPlaceholder="اسم المشروع"
        rows={2}
      />
      <LocalizedTextEditor
        label={t("Project location", "موقع المشروع")}
        value={selectedProject.content?.location ?? textSeed(selectedProject.location)}
        onChange={(next) => updateProjectText(selectedProjectIndex, "location", next)}
        as="input"
        englishPlaceholder="Location"
        arabicPlaceholder="الموقع"
        rows={2}
      />
      <LocalizedTextEditor
        label={t("Project category", "فئة المشروع")}
        value={selectedProject.content?.category ?? textSeed(selectedProject.category)}
        onChange={(next) => updateProjectText(selectedProjectIndex, "category", next)}
        as="input"
        englishPlaceholder="Category"
        arabicPlaceholder="الفئة"
        rows={2}
      />
      <LocalizedTextEditor
        label={t("Project description", "وصف المشروع")}
        value={selectedProject.content?.description ?? textSeed(selectedProject.description)}
        onChange={(next) => updateProjectText(selectedProjectIndex, "description", next)}
        as="textarea"
        englishPlaceholder="Project description"
        arabicPlaceholder="وصف المشروع"
        rows={4}
      />
    </div>
  );
}

export function ProjectHighlightsTab({
  selectedProject,
  selectedProjectIndex,
  updateHighlight,
  addHighlight,
  removeHighlight,
  t,
}: {
  selectedProject: Project;
  selectedProjectIndex: number;
  updateHighlight: (projectIndex: number, highlightIndex: number, value: LocalizedText) => void;
  addHighlight: (projectIndex: number) => void;
  removeHighlight: (projectIndex: number, highlightIndex: number) => void;
  t: (en: string, ar: string) => string;
}) {
  return (
    <div className="mt-6 grid gap-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#f2c16b]">{t("Highlights", "المميزات")}</p>
          <h3 className="mt-2 font-serif text-3xl text-white">{t("Project selling points", "نقاط قوة المشروع")}</h3>
        </div>
        <button
          type="button"
          onClick={() => addHighlight(selectedProjectIndex)}
          className="rounded-full border border-white/10 px-4 py-2 text-xs text-white hover:bg-white/5"
        >
          {t("Add highlight", "إضافة ميزة")}
        </button>
      </div>
      {(selectedProject.content?.highlights ?? []).map((highlight, highlightIndex) => (
        <div key={highlight.id} className="grid gap-3">
          <LocalizedTextEditor
            label={`${t("Highlight", "ميزة")} ${highlightIndex + 1}`}
            value={highlight.text}
            onChange={(next) => updateHighlight(selectedProjectIndex, highlightIndex, next)}
            as="input"
            englishPlaceholder="Highlight"
            arabicPlaceholder="ميزة"
            rows={2}
          />
          <div className="flex justify-end">
            <button
              type="button"
              onClick={() => removeHighlight(selectedProjectIndex, highlightIndex)}
              className="rounded-full border border-red-400/30 px-4 py-2 text-xs text-red-200 hover:bg-red-500/10"
            >
              {t("Delete highlight", "حذف الميزة")}
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

export function ProjectUnitsTab({
  selectedProject,
  selectedProjectIndex,
  updateUnit,
  setProjects,
  t,
}: {
  selectedProject: Project;
  selectedProjectIndex: number;
  updateUnit: (projectIndex: number, unitIndex: number, patch: Partial<Unit>) => void;
  setProjects: React.Dispatch<React.SetStateAction<Project[]>>;
  t: (en: string, ar: string) => string;
}) {
  return (
    <div className="mt-6 grid gap-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#f2c16b]">{t("Units", "الوحدات")}</p>
          <h3 className="mt-2 font-serif text-3xl text-white">{t("Project units and pricing", "وحدات المشروع وتسعيرها")}</h3>
        </div>
        <button
          type="button"
          onClick={() =>
            setProjects((current) => {
              const next = [...current];
              next[selectedProjectIndex] = {
                ...next[selectedProjectIndex],
                units: [...next[selectedProjectIndex].units, makeUnit()],
              };
              return next;
            })
          }
          className="rounded-full border border-white/10 px-4 py-2 text-xs text-white hover:bg-white/5"
        >
          {t("Add unit", "إضافة وحدة")}
        </button>
      </div>
      {selectedProject.units.map((unit, unitIndex) => (
        <div
          key={unit.id}
          className="grid gap-4 rounded-[24px] border border-white/10 bg-[#120f0d] p-5"
        >
          <MediaDropzone
            label={`${t("Unit image", "صورة الوحدة")} ${unitIndex + 1}`}
            value={unit.image ?? ""}
            helperText={t("Used in unit cards and detail view.", "تستخدم في بطاقات الوحدات وواجهة العرض.")}
            onChange={(url) => updateUnit(selectedProjectIndex, unitIndex, { image: url })}
          />
          <div className="grid gap-4 lg:grid-cols-8">
            <input
              value={unit.id}
              onChange={(event) => updateUnit(selectedProjectIndex, unitIndex, { id: event.target.value })}
              className="rounded-2xl border border-white/10 bg-black/20 px-3 py-3 text-white outline-none"
              placeholder={t("Unit id", "معرف الوحدة")}
            />
            <select
              value={unit.type}
              onChange={(event) =>
                updateUnit(selectedProjectIndex, unitIndex, { type: event.target.value as Unit["type"] })
              }
              className="rounded-2xl border border-white/10 bg-black/20 px-3 py-3 text-white outline-none"
            >
              <option value="Residential">{t("Residential", "سكني")}</option>
              <option value="Administrative">{t("Administrative", "إداري")}</option>
              <option value="Penthouse">{t("Penthouse", "بنتهاوس")}</option>
            </select>
            <input
              type="number"
              value={unit.area}
              onChange={(event) => updateUnit(selectedProjectIndex, unitIndex, { area: Number(event.target.value) || 0 })}
              className="rounded-2xl border border-white/10 bg-black/20 px-3 py-3 text-white outline-none"
              placeholder={t("Area", "المساحة")}
            />
            <input
              type="number"
              value={unit.floor}
              onChange={(event) => updateUnit(selectedProjectIndex, unitIndex, { floor: Number(event.target.value) || 0 })}
              className="rounded-2xl border border-white/10 bg-black/20 px-3 py-3 text-white outline-none"
              placeholder={t("Floor", "الطابق")}
            />
            <input
              type="number"
              value={unit.bedrooms ?? 0}
              onChange={(event) =>
                updateUnit(selectedProjectIndex, unitIndex, { bedrooms: Number(event.target.value) || 0 })
              }
              className="rounded-2xl border border-white/10 bg-black/20 px-3 py-3 text-white outline-none"
              placeholder={t("Bedrooms", "غرف النوم")}
            />
            <input
              type="number"
              value={unit.price}
              onChange={(event) => updateUnit(selectedProjectIndex, unitIndex, { price: Number(event.target.value) || 0 })}
              className="rounded-2xl border border-white/10 bg-black/20 px-3 py-3 text-white outline-none"
              placeholder={t("Price", "السعر")}
            />
            <select
              value={unit.status}
              onChange={(event) =>
                updateUnit(selectedProjectIndex, unitIndex, { status: event.target.value as Unit["status"] })
              }
              className="rounded-2xl border border-white/10 bg-black/20 px-3 py-3 text-white outline-none"
            >
              <option value="available">{t("Available", "متاح")}</option>
              <option value="reserved">{t("Reserved", "محجوز")}</option>
            </select>
            <button
              type="button"
              onClick={() =>
                setProjects((current) => {
                  const next = [...current];
                  next[selectedProjectIndex] = {
                    ...next[selectedProjectIndex],
                    units: next[selectedProjectIndex].units.filter((_, index) => index !== unitIndex),
                  };
                  return next;
                })
              }
              className="rounded-2xl border border-red-400/30 px-3 py-3 text-xs text-red-200 hover:bg-red-500/10"
            >
              {t("Remove", "إزالة")}
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
