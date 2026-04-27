"use client";

import { useState } from "react";
import { useAdminLocale } from "@/components/admin/admin-locale-provider";
import { LocalizedTextEditor, TEXT_COLOR_PRESETS } from "@/components/admin/builder-kit";
import type { LocalizedListItem, LocalizedText, SectionLayoutItem } from "@/lib/types";

export const defaultText = (seed = ""): LocalizedText => ({ en: seed, ar: "", color: TEXT_COLOR_PRESETS[0]?.value });
export const makeLocalizedItem = (seed = "New item"): LocalizedListItem => ({
  id: `item-${crypto.randomUUID()}`,
  text: defaultText(seed),
});

export function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid gap-3 rounded-[24px] border border-white/10 bg-black/20 p-4">
      <p className="text-sm font-semibold text-white/88">{label}</p>
      {children}
    </div>
  );
}

export function MiniSection({ title, description, children }: { title: string; description?: string; children: React.ReactNode }) {
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

export function LayoutBlocksEditor({
  title,
  description,
  items,
  catalog,
  onChange,
}: {
  title: string;
  description: string;
  items: SectionLayoutItem[];
  catalog: SectionLayoutItem[];
  onChange: (next: SectionLayoutItem[]) => void;
}) {
  const { locale, t } = useAdminLocale();
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const missingItems = catalog.filter((candidate) => !items.some((item) => item.id === candidate.id));

  function moveItem(fromIndex: number, toIndex: number) {
    if (fromIndex === toIndex || fromIndex < 0 || toIndex < 0) return;
    const next = [...items];
    const [moved] = next.splice(fromIndex, 1);
    next.splice(toIndex, 0, moved);
    onChange(next);
  }

  return (
    <MiniSection title={title} description={description}>
      {missingItems.length ? (
        <div className="mb-4 flex flex-wrap gap-2">
          {missingItems.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => onChange([...items, { ...item, enabled: true }])}
              className="rounded-full border border-white/10 bg-black/20 px-4 py-2 text-xs uppercase tracking-[0.16em] text-white/72 transition hover:border-[#f2c16b]/40 hover:bg-white/6"
            >
              {t("Add", "إضافة")} {locale === "ar" ? item.label.ar || item.label.en || item.id : item.label.en || item.id}
            </button>
          ))}
        </div>
      ) : null}
      <div className="grid gap-3">
        {items.map((item, index) => (
          <div
            key={item.id}
            draggable
            onDragStart={() => setDraggingId(item.id)}
            onDragOver={(event) => event.preventDefault()}
            onDrop={() => {
              if (!draggingId) return;
              moveItem(items.findIndex((entry) => entry.id === draggingId), index);
              setDraggingId(null);
            }}
            onDragEnd={() => setDraggingId(null)}
            className={`grid gap-4 rounded-[24px] border px-4 py-4 transition md:grid-cols-[1.3fr_auto_auto_auto] md:items-center ${
              draggingId === item.id ? "border-[#f2c16b] bg-white/10" : "border-white/10 bg-black/20"
            }`}
          >
            <div className="grid gap-2">
              <div className="flex items-center gap-3">
                <span className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-white/10 bg-white/5 text-xs font-semibold text-white/72">
                  {index + 1}
                </span>
                <div>
                  <p className="text-sm font-semibold text-white">{locale === "ar" ? item.label.ar || item.label.en || item.id : item.label.en || item.id}</p>
                  <p className="text-xs text-white/52">{locale === "ar" ? item.label.en || "الاسم الإنجليزي اختياري" : item.label.ar || "Arabic label optional"}</p>
                </div>
              </div>
              <LocalizedTextEditor
                label={t("Block label", "اسم البلوك")}
                value={item.label}
                onChange={(nextLabel) => onChange(items.map((entry) => (entry.id === item.id ? { ...entry, label: nextLabel } : entry)))}
                as="input"
                englishPlaceholder="Section label"
                arabicPlaceholder="اسم البلوك"
                rows={2}
              />
            </div>
            <label className={`inline-flex items-center justify-center gap-2 rounded-full border px-4 py-3 text-sm transition ${
              item.enabled ? "border-[#f2c16b] bg-white/10 text-white" : "border-white/10 bg-black/25 text-white/60"
            }`}>
              <input type="checkbox" checked={item.enabled} onChange={(event) => onChange(items.map((entry) => (entry.id === item.id ? { ...entry, enabled: event.target.checked } : entry)))} />
              {item.enabled ? t("Visible", "ظاهر") : t("Hidden", "مخفي")}
            </label>
            <div className="flex items-center gap-2">
              <button type="button" onClick={() => moveItem(index, index - 1)} disabled={index === 0} className="rounded-full border border-white/10 px-4 py-3 text-xs text-white/72 transition hover:bg-white/5 disabled:cursor-not-allowed disabled:opacity-40">{t("Move up", "لأعلى")}</button>
              <button type="button" onClick={() => moveItem(index, index + 1)} disabled={index === items.length - 1} className="rounded-full border border-white/10 px-4 py-3 text-xs text-white/72 transition hover:bg-white/5 disabled:cursor-not-allowed disabled:opacity-40">{t("Move down", "لأسفل")}</button>
              <button type="button" onClick={() => onChange(items.filter((entry) => entry.id !== item.id))} className="rounded-full border border-red-400/30 px-4 py-3 text-xs text-red-200 transition hover:bg-red-500/10">{t("Remove", "إزالة")}</button>
            </div>
            <div className="rounded-full border border-dashed border-white/10 px-4 py-3 text-center text-xs uppercase tracking-[0.18em] text-white/45">{t("Drag block", "اسحب البلوك")}</div>
          </div>
        ))}
      </div>
    </MiniSection>
  );
}

export function LocalizedListCollectionEditor({
  title, description, items, onChange, addLabel, englishPlaceholder, arabicPlaceholder,
}: {
  title: string; description: string; items: LocalizedListItem[];
  onChange: (next: LocalizedListItem[]) => void;
  addLabel: string; englishPlaceholder: string; arabicPlaceholder: string;
}) {
  const { t } = useAdminLocale();
  return (
    <MiniSection title={title} description={description}>
      <div className="flex justify-end">
        <button type="button" onClick={() => onChange([...items, makeLocalizedItem(addLabel)])} className="rounded-full border border-white/10 px-4 py-2 text-xs text-white/76 transition hover:bg-white/5">{t("Add item", "إضافة عنصر")}</button>
      </div>
      <div className="grid gap-4">
        {items.map((item, index) => (
          <div key={item.id} className="grid gap-3 rounded-[22px] border border-white/10 bg-[#120f0d] p-4">
            <LocalizedTextEditor label={`${title} ${index + 1}`} value={item.text} onChange={(nextText) => onChange(items.map((entry) => (entry.id === item.id ? { ...entry, text: nextText } : entry)))} as="input" englishPlaceholder={englishPlaceholder} arabicPlaceholder={arabicPlaceholder} rows={2} />
            <div className="flex justify-end">
              <button type="button" onClick={() => onChange(items.filter((entry) => entry.id !== item.id))} className="rounded-full border border-red-400/30 px-4 py-2 text-xs text-red-200 transition hover:bg-red-500/10">{t("Remove item", "حذف العنصر")}</button>
            </div>
          </div>
        ))}
      </div>
    </MiniSection>
  );
}
