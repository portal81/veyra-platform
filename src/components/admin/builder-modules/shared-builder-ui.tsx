"use client";

import { useEffect, useState } from "react";
import { LocalizedTextEditor } from "@/components/admin/builder-kit";
import type { LocalizedListItem, LocalizedText, SectionLayoutItem } from "@/lib/types";

const defaultText = (seed = ""): LocalizedText => ({ en: seed, ar: "", color: "#ffffff" });
const makeLocalizedItem = (seed = "New item"): LocalizedListItem => ({
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

export function MiniSection({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
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

function FocusedEditPanel({
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
    <div className="grid gap-3 rounded-[22px] border border-white/10 bg-[#120f0d] p-4 shadow-[0_16px_60px_rgba(0,0,0,0.22)] xl:sticky xl:top-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.18em] text-brand-gold">Focused editor</p>
          <h5 className="mt-2 text-lg font-semibold text-white">{title}</h5>
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
        <div className="flex min-h-[180px] items-center justify-center rounded-[18px] border border-dashed border-white/10 px-6 text-center text-sm text-white/45">
          Open the focused editor to change one item at a time without crowding the page.
        </div>
      )}
    </div>
  );
}

export function BuilderPane({
  active,
  current,
  children,
}: {
  active: string;
  current: string | string[];
  children: React.ReactNode;
}) {
  const isMatch = Array.isArray(current) ? current.includes(active) : active === current;
  if (!isMatch) return null;
  return <>{children}</>;
}

export function LayoutBlocksEditor({
  title,
  description,
  items,
  catalog,
  onChange,
  blockPreviews,
  blockEditors,
}: {
  title: string;
  description: string;
  items: SectionLayoutItem[];
  catalog: SectionLayoutItem[];
  onChange: (next: SectionLayoutItem[]) => void;
  blockPreviews?: Record<string, string[]>;
  blockEditors?: Record<string, Array<{
    key: string;
    label: string;
    value: LocalizedText;
    as?: "input" | "textarea";
    rows?: number;
    onChange: (next: LocalizedText) => void;
  }>>;
}) {
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [activeEditorByBlock, setActiveEditorByBlock] = useState<Record<string, string>>({});
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
              className="rounded-full border border-white/10 bg-black/20 px-4 py-2 text-xs uppercase tracking-[0.16em] text-white/72 transition hover:border-brand-gold/40 hover:bg-white/6"
            >
              Add {item.label.en || item.id}
            </button>
          ))}
        </div>
      ) : null}
      <div className="grid gap-3">
        {items.map((item, index) => (
          <article
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
            className={`grid gap-4 rounded-[24px] border px-4 py-4 transition ${
              draggingId === item.id ? "border-brand-gold bg-white/10" : "border-white/10 bg-black/20"
            }`}
          >
            <div className="grid gap-2">
              <div className="flex items-center gap-3">
                <span className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-white/10 bg-white/5 text-xs font-semibold text-white/72">
                  {index + 1}
                </span>
                <div>
                  <p className="text-sm font-semibold text-white">{item.label.en || item.id}</p>
                  <p className="text-xs text-white/52">{item.label.ar || "Arabic label optional"}</p>
                </div>
              </div>
              <LocalizedTextEditor
                label="Block label"
                value={item.label}
                onChange={(nextLabel) => onChange(items.map((entry) => (entry.id === item.id ? { ...entry, label: nextLabel } : entry)))}
                as="input"
                englishPlaceholder="Section label"
                arabicPlaceholder="اسم البلوك"
                rows={2}
              />
              {blockEditors?.[item.id]?.length ? (
                <div className="grid gap-3 rounded-[20px] border border-white/8 bg-white/[0.03] p-3">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-[11px] uppercase tracking-[0.16em] text-brand-gold">Core text inside this block</p>
                    <span className="text-xs text-white/45">{blockEditors[item.id].length} fields</span>
                  </div>
                  <div className="grid gap-2 xl:grid-cols-2">
                    {blockEditors[item.id].map((field) => {
                      const preview = field.value.ar?.trim() || field.value.en?.trim() || "No text yet";
                      const isActive = activeEditorByBlock[item.id] === field.key;
                      return (
                        <button
                          key={`${item.id}-${field.key}`}
                          type="button"
                          onClick={() =>
                            setActiveEditorByBlock((current) => ({
                              ...current,
                              [item.id]: current[item.id] === field.key ? "" : field.key,
                            }))
                          }
                          className={`grid gap-2 rounded-[18px] border p-3 text-start transition ${
                            isActive ? "border-brand-gold/55 bg-white/[0.08]" : "border-white/10 bg-black/20 hover:bg-white/[0.04]"
                          }`}
                        >
                          <span className="text-xs font-semibold text-white/78">{field.label}</span>
                          <span className="line-clamp-2 text-sm leading-6 text-white/58">{preview}</span>
                        </button>
                      );
                    })}
                  </div>
                  {(() => {
                    const activeKey = activeEditorByBlock[item.id] || blockEditors[item.id][0]?.key;
                    const activeField = blockEditors[item.id].find((field) => field.key === activeKey) ?? blockEditors[item.id][0];
                    if (!activeField) return null;
                    return (
                      <div className="rounded-[18px] border border-brand-gold/18 bg-black/20 p-3">
                        <LocalizedTextEditor
                          label={activeField.label}
                          value={activeField.value}
                          onChange={activeField.onChange}
                          as={activeField.as ?? "input"}
                          englishPlaceholder={`Edit ${activeField.label.toLowerCase()}`}
                          arabicPlaceholder="عدّل النص"
                          rows={activeField.rows ?? 3}
                        />
                      </div>
                    );
                  })()}
                </div>
              ) : blockPreviews?.[item.id]?.length ? (
                <div className="grid gap-2 rounded-[18px] border border-white/8 bg-white/[0.03] p-3">
                  <p className="text-[11px] uppercase tracking-[0.16em] text-brand-gold">Core text preview</p>
                  {blockPreviews[item.id].slice(0, 3).map((preview, previewIndex) => (
                    <p key={`${item.id}-preview-${previewIndex}`} className="line-clamp-2 text-sm leading-6 text-white/68">
                      {preview}
                    </p>
                  ))}
                </div>
              ) : null}
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <div className="rounded-full border border-dashed border-white/10 px-4 py-3 text-center text-xs uppercase tracking-[0.18em] text-white/45">
                Drag block
              </div>
              <label
                className={`inline-flex items-center justify-center gap-2 rounded-full border px-4 py-3 text-sm transition ${
                  item.enabled ? "border-brand-gold bg-white/10 text-white" : "border-white/10 bg-black/25 text-white/60"
                }`}
              >
                <input
                  type="checkbox"
                  checked={item.enabled}
                  onChange={(event) => onChange(items.map((entry) => (entry.id === item.id ? { ...entry, enabled: event.target.checked } : entry)))}
                />
                {item.enabled ? "Visible" : "Hidden"}
              </label>
              <button
                type="button"
                onClick={() => moveItem(index, index - 1)}
                disabled={index === 0}
                className="rounded-full border border-white/10 px-4 py-3 text-xs text-white/72 transition hover:bg-white/5 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Move up
              </button>
              <button
                type="button"
                onClick={() => moveItem(index, index + 1)}
                disabled={index === items.length - 1}
                className="rounded-full border border-white/10 px-4 py-3 text-xs text-white/72 transition hover:bg-white/5 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Move down
              </button>
              <button
                type="button"
                onClick={() => onChange(items.filter((entry) => entry.id !== item.id))}
                className="rounded-full border border-red-400/30 px-4 py-3 text-xs text-red-200 transition hover:bg-red-500/10"
              >
                Remove
              </button>
            </div>
          </article>
        ))}
      </div>
    </MiniSection>
  );
}

export function LocalizedListCollectionEditor({
  title,
  description,
  items,
  onChange,
  addLabel,
  englishPlaceholder,
  arabicPlaceholder,
}: {
  title: string;
  description: string;
  items: LocalizedListItem[];
  onChange: (next: LocalizedListItem[]) => void;
  addLabel: string;
  englishPlaceholder: string;
  arabicPlaceholder: string;
}) {
  const [selectedId, setSelectedId] = useState(items[0]?.id ?? "");
  const [editorOpen, setEditorOpen] = useState(true);
  const current = items.find((item) => item.id === selectedId) ?? items[0] ?? null;

  useEffect(() => {
    if (!items.length) {
      setSelectedId("");
      return;
    }
    if (!items.some((item) => item.id === selectedId)) {
      setSelectedId(items[0].id);
    }
  }, [items, selectedId]);

  useEffect(() => {
    if (current) setEditorOpen(true);
  }, [current?.id]);

  return (
    <MiniSection title={title} description={description}>
      <div className="flex justify-end">
        <button
          type="button"
          onClick={() => {
            const nextItem = makeLocalizedItem(addLabel);
            onChange([...items, nextItem]);
            setSelectedId(nextItem.id);
          }}
          className="rounded-full border border-white/10 px-4 py-2 text-xs text-white/76 transition hover:bg-white/5"
        >
          Add item
        </button>
      </div>

      {items.length ? (
        <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_360px]">
          <div className="grid gap-3 md:grid-cols-2">
            {items.map((item, index) => {
              const preview = item.text.ar?.trim() || item.text.en?.trim() || "No content yet";
              const isActive = item.id === current?.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setSelectedId(item.id)}
                  className={`grid gap-3 rounded-[20px] border p-4 text-left transition ${
                    isActive ? "border-brand-gold bg-brand-gold/8" : "border-white/10 bg-[#120f0d] hover:border-white/20"
                  }`}
                >
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-sm font-semibold text-white">{title} {index + 1}</span>
                    <span className="rounded-full border border-white/10 bg-black/25 px-2.5 py-1 text-[10px] text-white/60">
                      #{index + 1}
                    </span>
                  </div>
                  <p className="line-clamp-2 min-h-[42px] text-sm leading-6 text-white/58 break-words">{preview}</p>
                  <span className="w-fit rounded-full border border-brand-gold/35 bg-brand-gold/10 px-2.5 py-1 text-[10px] text-[#f6d293]">
                    Edit
                  </span>
                </button>
              );
            })}
          </div>

          <FocusedEditPanel
            title={current ? `${title} ${items.findIndex((entry) => entry.id === current.id) + 1}` : title}
            subtitle="Pick one item from the preview cards, then edit it here in a quieter side panel."
            open={editorOpen}
            onToggle={() => setEditorOpen((value) => !value)}
          >
            {current ? (
              <>
                <LocalizedTextEditor
                  label={`${title} ${items.findIndex((entry) => entry.id === current.id) + 1}`}
                  value={current.text}
                  onChange={(nextText) => onChange(items.map((entry) => (entry.id === current.id ? { ...entry, text: nextText } : entry)))}
                  as="input"
                  englishPlaceholder={englishPlaceholder}
                  arabicPlaceholder={arabicPlaceholder}
                  rows={2}
                />
                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={() => {
                      const nextItems = items.filter((entry) => entry.id !== current.id);
                      onChange(nextItems);
                      setSelectedId(nextItems[0]?.id ?? "");
                    }}
                    className="rounded-full border border-red-400/30 px-4 py-2 text-xs text-red-200 transition hover:bg-red-500/10"
                  >
                    Remove item
                  </button>
                </div>
              </>
            ) : (
              <div className="flex min-h-[220px] items-center justify-center rounded-[18px] border border-dashed border-white/10 px-6 text-center text-sm text-white/45">
                Pick one item to edit it here.
              </div>
            )}
          </FocusedEditPanel>
        </div>
      ) : (
        <div className="rounded-[22px] border border-dashed border-white/10 px-6 py-10 text-center text-sm text-white/45">
          No items yet. Add the first item to start editing.
        </div>
      )}
    </MiniSection>
  );
}
