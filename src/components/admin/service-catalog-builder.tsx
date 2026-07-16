"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { BuilderSection, LocalizedTextEditor } from "@/components/admin/builder-kit";
import { useAdminLocale } from "@/components/admin/admin-locale-provider";
import { AdminStickyActions } from "@/components/admin/admin-design-system";
import type {
  FinishingPackage,
  LocalizedListItem,
  LocalizedText,
  ServiceCatalog,
  SmartDevice,
  SmartPackage,
} from "@/lib/types";

type ServiceCatalogBuilderProps = { initialCatalog: ServiceCatalog };
type ServiceSection = "finishingPackages" | "smartDevices" | "smartPackages";
type ServiceActivityItem = {
  id: string;
  kind: "bulk" | "create" | "delete" | "save";
  message: string;
  at: string;
};
const SERVICE_DRAFT_KEY = "veyra:admin:services:draft:v1";
const t = (en: string, ar?: string) => {
  void ar;
  return en;
};

function loadDraftCatalog(): ServiceCatalog | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(SERVICE_DRAFT_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as ServiceCatalog;
    if (!parsed || typeof parsed !== "object") return null;
    return parsed;
  } catch {
    return null;
  }
}

const textSeed = (value = ""): LocalizedText => ({ en: value, ar: "", color: "#f5eee6" });
const makeLocalizedItem = (seed: string): LocalizedListItem => ({
  id: `item-${crypto.randomUUID()}`,
  text: textSeed(seed),
});
const makeFinishingPackage = (): FinishingPackage => ({
  id: `pkg-${crypto.randomUUID()}`,
  name: "New Package",
  pricePerMeter: 2500,
  summary: "Package summary",
  features: ["Feature"],
  featured: false,
  content: {
    name: textSeed("New Package"),
    summary: textSeed("Package summary"),
    features: [makeLocalizedItem("Feature")],
  },
});
const makeSmartDevice = (): SmartDevice => ({
  id: `device-${crypto.randomUUID()}`,
  name: "New Device",
  summary: "Device summary",
  benefits: ["Benefit"],
  content: {
    name: textSeed("New Device"),
    summary: textSeed("Device summary"),
    benefits: [makeLocalizedItem("Benefit")],
  },
});
const makeSmartPackage = (): SmartPackage => ({
  id: `smart-${crypto.randomUUID()}`,
  name: "New Smart Package",
  summary: "Package summary",
  devices: ["Device"],
  content: {
    name: textSeed("New Smart Package"),
    summary: textSeed("Package summary"),
    devices: [makeLocalizedItem("Device")],
  },
});

type CatalogItem = FinishingPackage | SmartDevice | SmartPackage;
type ContentKey = "features" | "benefits" | "devices";

function Card({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid gap-3 rounded-[24px] border border-white/10 bg-black/20 p-4">
      <p className="text-sm font-semibold text-white/86">{label}</p>
      {children}
    </div>
  );
}

function mutateCatalog<T extends CatalogItem>(
  items: T[],
  index: number,
  updater: (item: T) => T,
) {
  const next = [...items];
  next[index] = updater(next[index]);
  return next;
}

const SERVICE_SECTIONS: Array<{
  id: ServiceSection;
  label: { en: string; ar: string };
  description: { en: string; ar: string };
}> = [
  {
    id: "finishingPackages",
    label: { en: "Finishing packages", ar: "باقات التشطيب" },
    description: {
      en: "Pricing tiers tied to the finishing experience and estimator.",
      ar: "فئات التسعير المرتبطة بتجربة التشطيب وحاسبة التكلفة.",
    },
  },
  {
    id: "smartDevices",
    label: { en: "Smart devices", ar: "الأجهزة الذكية" },
    description: {
      en: "Individual devices and their translated selling points.",
      ar: "الأجهزة الفردية ونقاط بيعها المترجمة.",
    },
  },
  {
    id: "smartPackages",
    label: { en: "Smart packages", ar: "الباقات الذكية" },
    description: {
      en: "Grouped offers for smart-home services.",
      ar: "العروض المجمعة لخدمات المنازل الذكية.",
    },
  },
];

export function ServiceCatalogBuilder({ initialCatalog }: ServiceCatalogBuilderProps) {
  const { locale, t } = useAdminLocale();
  const [catalog, setCatalog] = useState(() => loadDraftCatalog() ?? structuredClone(initialCatalog));
  const [savedSnapshot, setSavedSnapshot] = useState(() => JSON.stringify(initialCatalog));
  const [message, setMessage] = useState("");
  const [isPending, startTransition] = useTransition();
  const [activeSection, setActiveSection] = useState<ServiceSection>("finishingPackages");
  const [selectedItemIds, setSelectedItemIds] = useState<string[]>([]);
  const [activityLog, setActivityLog] = useState<ServiceActivityItem[]>([]);
  const [hasRecoveredDraft, setHasRecoveredDraft] = useState(() => Boolean(loadDraftCatalog()));
  const activityKindLabel = (kind: ServiceActivityItem["kind"]) =>
    kind === "bulk"
      ? t("bulk", "جماعي")
      : kind === "create"
        ? t("create", "إنشاء")
        : kind === "delete"
          ? t("delete", "حذف")
          : t("save", "حفظ");
  const [selectedItemId, setSelectedItemId] = useState(
    initialCatalog.finishingPackages[0]?.id ??
      initialCatalog.smartDevices[0]?.id ??
      initialCatalog.smartPackages[0]?.id ??
      "",
  );

  function logActivity(kind: ServiceActivityItem["kind"], message: string) {
    setActivityLog((current) =>
      [{ id: `act-${crypto.randomUUID()}`, kind, message, at: new Date().toISOString() }, ...current].slice(0, 20),
    );
  }

  useEffect(() => {
    try {
      window.localStorage.setItem(SERVICE_DRAFT_KEY, JSON.stringify(catalog));
    } catch {
      // Ignore storage errors.
    }
  }, [catalog]);

  function saveCatalog() {
    setMessage("");
    startTransition(async () => {
      const response = await fetch("/api/admin/services", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(catalog),
      });
      const data = (await response.json()) as { message: string; catalog?: ServiceCatalog };
      setMessage(data.message);
      if (response.ok && data.catalog) {
        setCatalog(data.catalog);
        setSavedSnapshot(JSON.stringify(data.catalog));
        logActivity(
          "save",
          t(
            `Saved service catalog (${Object.values(data.catalog).flat().length} items)`,
            `تم حفظ فهرس الخدمات (${Object.values(data.catalog).flat().length} عنصرًا)`,
          ),
        );
        try {
          window.localStorage.removeItem(SERVICE_DRAFT_KEY);
          setHasRecoveredDraft(false);
        } catch {
          // Ignore storage errors.
        }
      }
    });
  }

  const sectionItems = catalog[activeSection];
  const selectedIndex = Math.max(sectionItems.findIndex((item) => item.id === selectedItemId), 0);
  const selectedItem = sectionItems[selectedIndex];
  const activeSectionMeta = SERVICE_SECTIONS.find((section) => section.id === activeSection)!;
  const selectedItemsList: LocalizedListItem[] = useMemo(() => {
    if (!selectedItem) return [];
    if (activeSection === "finishingPackages") {
      return (selectedItem.content as FinishingPackage["content"] | undefined)?.features ?? [];
    }
    if (activeSection === "smartDevices") {
      return (selectedItem.content as SmartDevice["content"] | undefined)?.benefits ?? [];
    }
    return (selectedItem.content as SmartPackage["content"] | undefined)?.devices ?? [];
  }, [activeSection, selectedItem]);

  const sectionCount = useMemo(
    () => ({
      finishingPackages: catalog.finishingPackages.length,
      smartDevices: catalog.smartDevices.length,
      smartPackages: catalog.smartPackages.length,
    }),
    [catalog],
  );
  const currentSnapshot = useMemo(() => JSON.stringify(catalog), [catalog]);
  const isDirty = currentSnapshot !== savedSnapshot;
  const selectedMissingCount = useMemo(() => {
    if (!selectedItem) return 0;
    let missing = 0;
    if (!selectedItem.name?.trim()) missing += 1;
    if (!selectedItem.summary?.trim()) missing += 1;
    if (!selectedItemsList.length) missing += 1;
    if (activeSection === "finishingPackages" && !((selectedItem as FinishingPackage).pricePerMeter > 0)) missing += 1;
    return missing;
  }, [activeSection, selectedItem, selectedItemsList]);

  function setSection(section: ServiceSection) {
    setActiveSection(section);
    setSelectedItemId(catalog[section][0]?.id ?? "");
    setSelectedItemIds([]);
  }

  function addItem() {
    if (activeSection === "finishingPackages") {
      const next = makeFinishingPackage();
      setCatalog((current) => ({ ...current, finishingPackages: [...current.finishingPackages, next] }));
      setSelectedItemId(next.id);
      logActivity("create", t(`Added finishing package ${next.name}`, `تمت إضافة باقة تشطيب ${next.name}`));
      return;
    }

    if (activeSection === "smartDevices") {
      const next = makeSmartDevice();
      setCatalog((current) => ({ ...current, smartDevices: [...current.smartDevices, next] }));
      setSelectedItemId(next.id);
      logActivity("create", t(`Added smart device ${next.name}`, `تمت إضافة جهاز ذكي ${next.name}`));
      return;
    }

    const next = makeSmartPackage();
    setCatalog((current) => ({ ...current, smartPackages: [...current.smartPackages, next] }));
    setSelectedItemId(next.id);
    logActivity("create", t(`Added smart package ${next.name}`, `تمت إضافة باقة ذكية ${next.name}`));
  }

  function removeItem(index: number) {
    const collection = catalog[activeSection];
    const removedItem = collection[index];
    const nextCollection = collection.filter((_, itemIndex) => itemIndex !== index);
    const nextSelection = nextCollection[Math.min(index, nextCollection.length - 1)]?.id ?? "";
    setSelectedItemId(nextSelection);
    setSelectedItemIds((current) => current.filter((id) => id !== removedItem?.id));

    setCatalog((current) => ({
      ...current,
      [activeSection]: nextCollection,
    }));
    if (removedItem) {
      logActivity("delete", t(`Deleted ${removedItem.name}`, `تم حذف ${removedItem.name}`));
    }
  }

  function updateActiveSectionItem(updater: (item: CatalogItem) => CatalogItem) {
    setCatalog((current) => ({
      ...current,
      [activeSection]: mutateCatalog(current[activeSection] as CatalogItem[], selectedIndex, updater),
    }));
  }

  function toggleItemSelection(itemId: string) {
    setSelectedItemIds((current) =>
      current.includes(itemId) ? current.filter((id) => id !== itemId) : [...current, itemId],
    );
  }

  function toggleSelectAllInSection() {
    const allIds = sectionItems.map((item) => item.id);
    const shouldSelectAll = allIds.some((id) => !selectedItemIds.includes(id));
    setSelectedItemIds(shouldSelectAll ? allIds : []);
  }

  function bulkDeleteSelected() {
    if (!selectedItemIds.length) return;
    const removeSet = new Set(selectedItemIds);
    setCatalog((current) => {
      const nextItems = current[activeSection].filter((item) => !removeSet.has(item.id));
      return { ...current, [activeSection]: nextItems };
    });
    logActivity("bulk", t(`Deleted ${selectedItemIds.length} items in ${activeSection}`, `تم حذف ${selectedItemIds.length} عنصرًا من القسم المحدد`));
    setSelectedItemIds([]);
    const nextSelectedId = sectionItems.find((item) => !removeSet.has(item.id))?.id ?? "";
    setSelectedItemId(nextSelectedId);
  }

  function clearDraftCache() {
    try {
      window.localStorage.removeItem(SERVICE_DRAFT_KEY);
      setHasRecoveredDraft(false);
      logActivity("bulk", t("Cleared local draft cache", "تم مسح كاش المسودة المحلي"));
    } catch {
      // Ignore storage errors.
    }
  }

  return (
    <div className="grid gap-6">
      <section className="rounded-[32px] border border-white/10 bg-white/5 p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="font-serif text-4xl text-white">{t("Services builder", "منشئ الخدمات")}</h2>
            <p className="mt-2 text-white/68">
              {t(
                "Move through smaller service indexes instead of one long and overloaded page.",
                "تنقّل عبر فهارس أصغر للخدمات بدلًا من صفحة واحدة متكدسة ومعقدة.",
              )}
            </p>
          </div>
          <button
            type="button"
            onClick={saveCatalog}
            disabled={isPending}
            className="rounded-full bg-gradient-to-r from-brand-gold to-brand-gold-dark px-5 py-3 text-sm font-semibold text-[#1f150d]"
          >
            {isPending ? t("Saving...", "جارٍ الحفظ...") : t("Save catalog", "حفظ الفهرس")}
          </button>
        </div>
        {message ? <p className="mt-4 text-sm text-brand-gold">{message}</p> : null}
        {hasRecoveredDraft ? (
          <p className="mt-3 rounded-lg border border-emerald-400/30 bg-emerald-500/10 px-3 py-2 text-xs text-emerald-200">
            {t("Draft recovered from local autosave.", "تم استرجاع مسودة من الحفظ التلقائي المحلي.")}
          </p>
        ) : null}
        <div className="mt-4 rounded-xl border border-amber-400/30 bg-amber-500/5 px-4 py-3 text-sm text-white/80">
          {t("Missing required fields in selected item:", "الحقول المطلوبة الناقصة في العنصر المحدد:")}{" "}
          <span className="font-semibold text-white">{selectedMissingCount}</span>
        </div>
      </section>

      <div className="grid gap-6 xl:grid-cols-[320px_minmax(0,1fr)] xl:items-start">
        <aside className="xl:sticky xl:top-24">
          <section className="rounded-[30px] border border-white/10 bg-white/5 p-5 shadow-[0_22px_50px_rgba(0,0,0,0.18)]">
            <p className="text-xs uppercase tracking-[0.2em] text-white/42">{t("Service navigator", "ملاح الخدمات")}</p>
            <h3 className="mt-3 font-serif text-3xl text-white">{t("Catalog sections", "أقسام الفهرس")}</h3>
            <p className="mt-3 text-sm leading-7 text-white/62">
              {t(
                "Choose the service family first, then edit one item at a time through a simplified form.",
                "اختر عائلة الخدمة أولًا، ثم قم بتعديل عنصر واحد في المرة عبر نموذج مبسط.",
              )}
            </p>

            <div className="mt-5 grid gap-3">
              {SERVICE_SECTIONS.map((section) => {
                const isActive = section.id === activeSection;
                return (
                  <button
                    key={section.id}
                    type="button"
                    onClick={() => setSection(section.id)}
                    className={`rounded-[22px] border px-4 py-4 text-left transition ${
                      isActive
                        ? "border-brand-gold bg-white/10 text-white"
                        : "border-white/10 bg-black/20 text-white/76 hover:bg-white/6"
                    }`}
                  >
                    <p className="text-[11px] uppercase tracking-[0.22em] text-brand-gold">
                      {sectionCount[section.id]} {t("items", "عناصر")}
                    </p>
                    <p className="mt-2 text-sm font-semibold text-white">
                      {locale === "ar" ? section.label.ar : section.label.en}
                    </p>
                    <p className="mt-1 text-xs text-white/52">
                      {locale === "ar" ? section.description.ar : section.description.en}
                    </p>
                  </button>
                );
              })}
            </div>

            <div className="mt-6 rounded-[22px] border border-white/10 bg-black/20 p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-white/42">{t("Items", "العناصر")}</p>
              <div className="mt-3 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={toggleSelectAllInSection}
                  className="rounded-full border border-white/10 px-3 py-2 text-xs text-white/80 hover:bg-white/5"
                >
                  {selectedItemIds.length === sectionItems.length && sectionItems.length
                    ? t("Clear selection", "إلغاء التحديد")
                    : t("Select all", "تحديد الكل")}
                </button>
                <button
                  type="button"
                  onClick={bulkDeleteSelected}
                  disabled={!selectedItemIds.length}
                  className="rounded-full border border-red-400/30 px-3 py-2 text-xs text-red-200 hover:bg-red-500/10 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  {t("Delete selected", "حذف المحدد")}
                </button>
                <button
                  type="button"
                  onClick={clearDraftCache}
                  className="rounded-full border border-white/10 px-3 py-2 text-xs text-white/80 hover:bg-white/5"
                >
                  {t("Clear draft cache", "مسح الكاش المحلي")}
                </button>
              </div>
              <div className="mt-3 grid gap-2">
                {sectionItems.map((item) => {
                  const isActive = item.id === selectedItem?.id;
                  return (
                    <div
                      key={item.id}
                      className={`rounded-[18px] border px-4 py-3 text-left text-sm transition ${
                        isActive
                          ? "border-brand-gold/70 bg-white/8 text-white"
                          : "border-white/10 bg-black/20 text-white/72 hover:bg-white/6"
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={selectedItemIds.includes(item.id)}
                          onChange={() => toggleItemSelection(item.id)}
                          aria-label={t("Select item", "تحديد العنصر")}
                        />
                        <button
                          type="button"
                          onClick={() => setSelectedItemId(item.id)}
                          className="min-w-0 flex-1 text-left text-sm"
                        >
                          {item.content?.name?.en ?? item.name}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
              <button
                type="button"
                onClick={addItem}
                className="mt-4 w-full rounded-full border border-white/10 px-4 py-3 text-sm text-white transition hover:bg-white/5"
              >
                {t("Add item", "إضافة عنصر")}
              </button>
            </div>
          </section>
        </aside>

        <div className="grid min-w-0 gap-6">
          <section className="rounded-[30px] border border-white/10 bg-white/5 p-5 shadow-[0_22px_50px_rgba(0,0,0,0.18)]">
            <p className="text-xs uppercase tracking-[0.2em] text-white/42">{t("Open section", "القسم المفتوح")}</p>
            <h3 className="mt-2 font-serif text-3xl text-white">
              {locale === "ar" ? activeSectionMeta.label.ar : activeSectionMeta.label.en}
            </h3>
            <p className="mt-3 text-sm leading-7 text-white/62">
              {locale === "ar" ? activeSectionMeta.description.ar : activeSectionMeta.description.en}
            </p>
          </section>

          {selectedItem ? (
            <BuilderSection
              eyebrow={t("Service catalog", "فهرس الخدمات")}
              title={selectedItem.content?.name?.en ?? selectedItem.name}
              description={t(
                "The editor below only shows the selected item to keep forms smaller and easier to manage.",
                "المحرر أدناه يعرض فقط العنصر المحدد للحفاظ على النماذج صغيرة وسهلة الإدارة.",
              )}
            >
              <div className="mb-5 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => removeItem(selectedIndex)}
                  className="rounded-full border border-red-400/30 px-4 py-2 text-xs text-red-200 hover:bg-red-500/10"
                >
                  {t("Delete item", "حذف العنصر")}
                </button>
              </div>
              <CatalogCard
                id={selectedItem.id}
                name={selectedItem.content?.name ?? textSeed(selectedItem.name)}
                summary={selectedItem.content?.summary ?? textSeed(selectedItem.summary)}
                items={selectedItemsList}
                itemsLabel={
                  activeSection === "finishingPackages"
                    ? t("Package features", "مميزات الباقة")
                    : activeSection === "smartDevices"
                      ? t("Device benefits", "فوائد الجهاز")
                      : t("Package contents", "محتويات الباقة")
                }
                itemPlaceholderEn={
                  activeSection === "finishingPackages"
                    ? "Feature"
                    : activeSection === "smartDevices"
                      ? "Benefit"
                      : "Device"
                }
                itemPlaceholderAr={
                  activeSection === "finishingPackages"
                    ? "ميزة"
                    : activeSection === "smartDevices"
                      ? "فائدة"
                      : "جهاز"
                }
                numericLabel={activeSection === "finishingPackages" ? t("Price per meter", "سعر المتر") : undefined}
                numericValue={
                  activeSection === "finishingPackages" ? (selectedItem as FinishingPackage).pricePerMeter : undefined
                }
                onNumericChange={
                  activeSection === "finishingPackages"
                    ? (value) =>
                        updateActiveSectionItem((entry) => ({
                          ...(entry as FinishingPackage),
                          pricePerMeter: value,
                        }))
                    : undefined
                }
                extraAction={
                  activeSection === "finishingPackages" ? (
                    <label className="inline-flex items-center gap-2 text-white/78">
                      <input
                        type="checkbox"
                        checked={Boolean((selectedItem as FinishingPackage).featured)}
                        onChange={(event) =>
                          updateActiveSectionItem((entry) => ({
                            ...(entry as FinishingPackage),
                            featured: event.target.checked,
                          }))
                        }
                      />
                      {t("Featured", "مميز")}
                    </label>
                  ) : undefined
                }
                onChange={(patch) =>
                  updateActiveSectionItem((entry) =>
                    applyCatalogPatch(
                      entry as CatalogItem,
                      patch,
                      activeSection === "finishingPackages"
                        ? "features"
                        : activeSection === "smartDevices"
                          ? "benefits"
                          : "devices",
                    ),
                  )
                }
              />
            </BuilderSection>
          ) : (
            <section className="rounded-[30px] border border-white/10 bg-white/5 p-10 text-center">
              <h3 className="font-serif text-3xl text-white">{t("No items in this section", "لا توجد عناصر في هذا القسم")}</h3>
              <p className="mt-3 text-white/62">
                {t(
                  "Add a new item to start editing the details of this service.",
                  "أضف عنصرًا جديدًا للبدء في تعديل تفاصيل هذه الخدمة.",
                )}
              </p>
              <button
                type="button"
                onClick={addItem}
                className="mt-6 rounded-full border border-white/10 px-5 py-3 text-sm text-white transition hover:bg-white/5"
              >
                {t("Add item", "إضافة عنصر")}
              </button>
            </section>
          )}
          <section className="rounded-[30px] border border-white/10 bg-white/5 p-5">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="font-serif text-2xl text-white">{t("Activity log", "سجل النشاط")}</h3>
              <button
                type="button"
                onClick={() => setActivityLog([])}
                className="rounded-full border border-white/10 px-3 py-2 text-xs text-white/72 hover:bg-white/5"
              >
                {t("Clear", "مسح")}
              </button>
            </div>
            {activityLog.length ? (
              <ul className="grid gap-2">
                {activityLog.map((item) => (
                  <li key={item.id} className="rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-xs text-white/72">
                    <span className="text-brand-gold">{activityKindLabel(item.kind)}</span> - {item.message}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-white/55">{t("No activity yet.", "لا يوجد نشاط بعد.")}</p>
            )}
          </section>
        </div>
      </div>
      <AdminStickyActions
        onSave={saveCatalog}
        isSaving={isPending}
        isDirty={isDirty}
        saveLabel={t("Save catalog", "حفظ الفهرس")}
        savedLabel={t("Saved", "تم الحفظ")}
      />
    </div>
  );
}

function applyCatalogPatch<T extends CatalogItem>(
  item: T,
  patch: { name?: LocalizedText; summary?: LocalizedText; items?: LocalizedListItem[] },
  key: ContentKey,
): T {
  const currentItems =
    key === "features"
      ? (item.content as FinishingPackage["content"] | undefined)?.features
      : key === "benefits"
        ? (item.content as SmartDevice["content"] | undefined)?.benefits
        : (item.content as SmartPackage["content"] | undefined)?.devices;

  return {
    ...item,
    name: patch.name?.en ?? item.name,
    summary: patch.summary?.en ?? item.summary,
    ...(key === "features"
      ? {
          features: patch.items?.map((entry) => entry.text.en).filter(Boolean) ?? (item as FinishingPackage).features,
        }
      : {}),
    ...(key === "benefits"
      ? {
          benefits: patch.items?.map((entry) => entry.text.en).filter(Boolean) ?? (item as SmartDevice).benefits,
        }
      : {}),
    ...(key === "devices"
      ? {
          devices: patch.items?.map((entry) => entry.text.en).filter(Boolean) ?? (item as SmartPackage).devices,
        }
      : {}),
    content: {
      ...(item.content ?? {}),
      name: patch.name ?? item.content?.name,
      summary: patch.summary ?? item.content?.summary,
      [key]: patch.items ?? currentItems,
    },
  };
}

function CatalogCard({
  id,
  name,
  summary,
  items,
  itemsLabel,
  itemPlaceholderEn,
  itemPlaceholderAr,
  numericLabel,
  numericValue,
  onNumericChange,
  extraAction,
  onChange,
}: {
  id: string;
  name: LocalizedText;
  summary: LocalizedText;
  items: LocalizedListItem[];
  itemsLabel: string;
  itemPlaceholderEn: string;
  itemPlaceholderAr: string;
  numericLabel?: string;
  numericValue?: number;
  onNumericChange?: (value: number) => void;
  extraAction?: React.ReactNode;
  onChange: (patch: {
    name?: LocalizedText;
    summary?: LocalizedText;
    items?: LocalizedListItem[];
  }) => void;
}) {
  const { t } = useAdminLocale();

  return (
    <div className="grid gap-4 rounded-[26px] border border-white/10 bg-black/20 p-5">
      <div className="grid gap-4 lg:grid-cols-3">
        <Card label={t("Item ID", "معرف العنصر")}>
          <input value={id} readOnly className="rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-white/55 outline-none" />
        </Card>
        {numericLabel ? (
          <Card label={numericLabel}>
            <input
              type="number"
              value={numericValue ?? 0}
              onChange={(event) => onNumericChange?.(Number(event.target.value) || 0)}
              className="rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-white outline-none"
            />
          </Card>
        ) : (
          <div />
        )}
        {extraAction ? <Card label={t("Options", "خيارات")}>{extraAction}</Card> : <div />}
      </div>

      <LocalizedTextEditor
        label={t("Name", "الاسم")}
        value={name}
        onChange={(next) => onChange({ name: next, summary, items })}
        as="input"
        englishPlaceholder="English name"
        arabicPlaceholder="الاسم بالعربية"
        rows={2}
      />
      <LocalizedTextEditor
        label={t("Summary", "الوصف")}
        value={summary}
        onChange={(next) => onChange({ name, summary: next, items })}
        as="textarea"
        englishPlaceholder="English summary"
        arabicPlaceholder="الوصف بالعربية"
        rows={3}
      />

      <div className="rounded-[22px] border border-white/10 bg-[#120f0d] p-4">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-white">{itemsLabel}</p>
            <p className="mt-1 text-xs uppercase tracking-[0.18em] text-white/45">
              {t("List copy + color", "نص القائمة + اللون")}
            </p>
          </div>
          <button
            type="button"
            onClick={() => onChange({ name, summary, items: [...items, makeLocalizedItem(itemPlaceholderEn)] })}
            className="rounded-full border border-white/10 px-3 py-2 text-xs text-white hover:bg-white/5"
          >
            {t("Add item", "إضافة عنصر")}
          </button>
        </div>
        <div className="grid gap-4">
          {items.map((item, index) => (
            <div key={item.id} className="grid gap-3">
              <LocalizedTextEditor
                label={`${t("Item", "عنصر")} ${index + 1}`}
                value={item.text}
                onChange={(next) => {
                  const nextItems = [...items];
                  nextItems[index] = { ...nextItems[index], text: next };
                  onChange({ name, summary, items: nextItems });
                }}
                as="input"
                englishPlaceholder={itemPlaceholderEn}
                arabicPlaceholder={itemPlaceholderAr}
                rows={2}
              />
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() => onChange({ name, summary, items: items.filter((_, itemIndex) => itemIndex !== index) })}
                  className="rounded-full border border-red-400/30 px-4 py-2 text-xs text-red-200 hover:bg-red-500/10"
                >
                  {t("Remove item", "إزالة العنصر")}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
  const activityKindLabel = (kind: ServiceActivityItem["kind"]) =>
    kind === "bulk"
      ? t("bulk", "جماعي")
      : kind === "create"
        ? t("create", "إنشاء")
        : kind === "delete"
          ? t("delete", "حذف")
          : t("save", "حفظ");
void activityKindLabel;
