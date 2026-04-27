"use client";

import { BuilderSection, LocalizedTextEditor } from "@/components/admin/builder-kit";
import { Field, MiniSection } from "./shared-builder-ui";
import { formatNumberList, parseNumberList } from "@/lib/utils";
import type { SiteSettings, LocalizedText, InstallmentUnitType, InstallmentPlan, FinishingTier, CalculatorAddOn } from "@/lib/types";

type Props = {
  settings: SiteSettings;
  mutateSettings: (recipe: (draft: SiteSettings) => void) => void;
  ui: (en: string, ar?: string) => string;
  t: (en: string, ar: string) => string;
  defaultText: (seed?: string) => LocalizedText;
  arEditPlaceholder: (label: string) => string;
};

export function CalculatorsModule({ settings, mutateSettings, ui, t, defaultText, arEditPlaceholder }: Props) {
  function updateCalculatorText(calculator: "installment"|"finishing", field: string, value: LocalizedText) {
    mutateSettings((draft) => {
      (draft.content.calculators[calculator] as Record<string, LocalizedText>)[field] = value;
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

  const installmentFields = [
    ["title", "Installment title", "input", 2],
    ["description", "Description copy", "textarea", 3],
    ["disclaimer", "Pricing disclaimer", "input", 2],
  ] as const;

  const finishingCalculatorFields = [
    ["title", "Finishing title", "input", 2],
    ["description", "Description copy", "textarea", 3],
    ["disclaimer", "Pricing disclaimer", "input", 2],
  ] as const;

  return (
    <div className="grid gap-6">
      <BuilderSection
        eyebrow={t("Calculators", "الحاسبات")}
        title={t("Pricing logic, years, tiers, and all calculator text.", "منطق التسعير والسنوات والمستويات وكل نصوص الحاسبات.")}
        description={t("The website calculators now read directly from these settings. Change values or labels here and the public site updates accordingly.", "حاسبات الموقع تقرأ مباشرة من هذه الإعدادات. أي تعديل هنا ينعكس على الموقع العام.")}
      >
        <div className="grid gap-6">
          {/* ADVANCED INSTALLMENT DASHBOARD PREP */}
          <MiniSection title={ui("Installment calculator")} description={t("Control unit pricing, installment years, area options, and public labels.", "تحكم في تسعير الوحدات وسنوات التقسيط وخيارات المساحة ونصوص الحاسبة.")}>
            <div className="grid gap-6">
              <div className="grid gap-4">
                <Field label={ui("Area options (comma separated)")}>
                  <input value={formatNumberList(settings.installmentCalculator.areaOptions)} onChange={(event) => mutateSettings((draft) => { draft.installmentCalculator.areaOptions = parseNumberList(event.target.value); })} className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-white outline-none" placeholder="120, 160, 220" />
                </Field>
                <Field label={ui("Down payment percentages")}>
                  <input value={formatNumberList(settings.installmentCalculator.downPaymentOptions)} onChange={(event) => mutateSettings((draft) => { draft.installmentCalculator.downPaymentOptions = parseNumberList(event.target.value); })} className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-white outline-none" placeholder="10, 15, 20" />
                </Field>
                <div className="grid gap-4 md:grid-cols-2">
                  <Field label={ui("Default area")}>
                    <input type="number" value={settings.installmentCalculator.defaultArea} onChange={(event) => mutateSettings((draft) => { draft.installmentCalculator.defaultArea = Number(event.target.value) || 0; })} className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-white outline-none" />
                  </Field>
                  <Field label={ui("Default down payment %")}>
                    <input type="number" value={settings.installmentCalculator.defaultDownPayment} onChange={(event) => mutateSettings((draft) => { draft.installmentCalculator.defaultDownPayment = Number(event.target.value) || 0; })} className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-white outline-none" />
                  </Field>
                </div>
              </div>
              <div className="grid gap-4">
                {installmentFields.map(([field, label, as, rows]) => (
                  <LocalizedTextEditor key={field} label={ui(label)} value={(settings.content.calculators.installment as any)[field] ?? defaultText()} onChange={(next) => updateCalculatorText("installment", field, next)} as={as as any} englishPlaceholder={`Edit ${label.toLowerCase()}`} arabicPlaceholder={arEditPlaceholder(label)} rows={rows as number} />
                ))}
              </div>
            </div>
            
            <p className="mt-6 text-xs uppercase tracking-[0.2em] text-[#f2c16b]">{t("Unit Types Grid", "شبكة أنواع الوحدات")}</p>
            <div className="mt-2 grid gap-4 2xl:grid-cols-2">
              {settings.installmentCalculator.unitTypes.map((unit, index) => (
                <div key={unit.id} className="grid gap-4 rounded-[26px] border border-white/10 bg-[#120f0d] p-5 hover:border-[#f2c16b] transition duration-300">
                  <div className="grid gap-4 md:grid-cols-[0.8fr_1fr]">
                    <Field label={ui("Unit id")}>
                      <input value={unit.id} onChange={(event) => updateInstallmentUnit(index, { id: event.target.value })} className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-white outline-none focus:border-[#f2c16b]" />
                    </Field>
                    <Field label={ui("Price per meter")}>
                      <input type="number" value={unit.pricePerMeter} onChange={(event) => updateInstallmentUnit(index, { pricePerMeter: Number(event.target.value) || 0 })} className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-white outline-none focus:border-[#f2c16b]" />
                    </Field>
                  </div>
                  <LocalizedTextEditor label={ui("Unit type label")} value={unit.label ?? defaultText()} onChange={(next) => updateInstallmentUnit(index, { label: next })} as="input" englishPlaceholder="Residential" arabicPlaceholder="سكني" rows={2} />
                </div>
              ))}
            </div>

            <p className="mt-6 text-xs uppercase tracking-[0.2em] text-[#f2c16b]">{t("Installment Plans Matrix", "مصفوفة خطط التقسيط")}</p>
            <div className="mt-2 grid gap-4">
              {settings.installmentCalculator.plans.map((plan, index) => (
                <div key={plan.id} className="grid gap-4 rounded-[26px] border border-white/10 bg-[#120f0d] p-5 hover:border-[#f2c16b] transition duration-300">
                  <div className="grid gap-4 md:grid-cols-3">
                    <Field label={ui("Plan id")}>
                      <input value={plan.id} onChange={(event) => updateInstallmentPlan(index, { id: event.target.value })} className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-white outline-none focus:border-[#f2c16b]" />
                    </Field>
                    <Field label={ui("Years")}>
                      <input type="number" value={plan.years} onChange={(event) => updateInstallmentPlan(index, { years: Number(event.target.value) || 0 })} className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-white outline-none focus:border-[#f2c16b]" />
                    </Field>
                    <Field label={ui("Interest multiplier")}>
                      <input type="number" step="0.01" value={plan.interestMultiplier} onChange={(event) => updateInstallmentPlan(index, { interestMultiplier: Number(event.target.value) || 0 })} className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-white outline-none focus:border-[#f2c16b]" />
                    </Field>
                  </div>
                  <LocalizedTextEditor label={ui("Plan label")} value={plan.label ?? defaultText()} onChange={(next) => updateInstallmentPlan(index, { label: next })} as="input" englishPlaceholder="6 years" arabicPlaceholder="٦ سنوات" rows={2} />
                </div>
              ))}
            </div>
          </MiniSection>

          {/* ADVANCED FINISHING DASHBOARD PREP */}
          <MiniSection title={ui("Finishing calculator")} description={t("Control finishing tiers, optional add-ons, default values, and all public labels.", "تحكم في باقات التشطيب والإضافات والقيم الافتراضية وجميع نصوص الحاسبة.")}>
            <div className="grid gap-6">
              <div className="grid gap-4">
                <Field label={ui("Area options")}>
                  <input value={formatNumberList(settings.finishingCalculator.areaOptions)} onChange={(event) => mutateSettings((draft) => { draft.finishingCalculator.areaOptions = parseNumberList(event.target.value); })} className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-white outline-none" placeholder="120, 160, 220" />
                </Field>
                <div className="grid gap-4 md:grid-cols-2">
                  <Field label={ui("Default area")}>
                    <input type="number" value={settings.finishingCalculator.defaultArea} onChange={(event) => mutateSettings((draft) => { draft.finishingCalculator.defaultArea = Number(event.target.value) || 0; })} className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-white outline-none" />
                  </Field>
                  <Field label="Default tier id">
                    <input value={settings.finishingCalculator.defaultTierId} onChange={(event) => mutateSettings((draft) => { draft.finishingCalculator.defaultTierId = event.target.value; })} className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-white outline-none" />
                  </Field>
                </div>
                <Field label="Default add-on ids (comma separated)">
                  <input value={settings.finishingCalculator.defaultAddOnIds.join(", ")} onChange={(event) => mutateSettings((draft) => { draft.finishingCalculator.defaultAddOnIds = event.target.value.split(",").map((item) => item.trim()).filter(Boolean); })} className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-white outline-none" placeholder="lighting, carpentry" />
                </Field>
              </div>
              <div className="grid gap-4">
                {finishingCalculatorFields.map(([field, label, as, rows]) => (
                  <LocalizedTextEditor key={field} label={ui(label)} value={(settings.content.calculators.finishing as any)[field] ?? defaultText()} onChange={(next) => updateCalculatorText("finishing", field, next)} as={as as any} englishPlaceholder={`Edit ${label.toLowerCase()}`} arabicPlaceholder={arEditPlaceholder(label)} rows={rows as number} />
                ))}
              </div>
            </div>

            <p className="mt-6 text-xs uppercase tracking-[0.2em] text-[#f2c16b]">{t("Finishing Tiers Setup", "إعداد باقات التشطيب")}</p>
            <div className="mt-2 grid gap-4 2xl:grid-cols-2">
              {settings.finishingCalculator.tiers.map((tier, index) => (
                <div key={tier.id} className="grid gap-4 rounded-[26px] border border-white/10 bg-[#120f0d] p-5 hover:border-[#f2c16b] transition duration-300">
                  <div className="grid gap-4 md:grid-cols-[0.8fr_1fr]">
                    <Field label="Tier id">
                      <input value={tier.id} onChange={(event) => updateFinishingTier(index, { id: event.target.value })} className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-white outline-none focus:border-[#f2c16b]" />
                    </Field>
                    <Field label="Price per meter">
                      <input type="number" value={tier.pricePerMeter} onChange={(event) => updateFinishingTier(index, { pricePerMeter: Number(event.target.value) || 0 })} className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-white outline-none focus:border-[#f2c16b]" />
                    </Field>
                  </div>
                  <LocalizedTextEditor label="Tier label" value={tier.label ?? defaultText()} onChange={(next) => updateFinishingTier(index, { label: next })} as="input" englishPlaceholder="Super Lux" arabicPlaceholder="سوبر لوكس" rows={2} />
                </div>
              ))}
            </div>

            <p className="mt-6 text-xs uppercase tracking-[0.2em] text-[#f2c16b]">{t("Configurable Add-ons", "الإضافات الاختيارية")}</p>
            <div className="mt-2 grid gap-4">
              {settings.finishingCalculator.addOns.map((addOn, index) => (
                <div key={addOn.id} className="grid gap-4 rounded-[26px] border border-white/10 bg-[#120f0d] p-5 hover:border-[#f2c16b] transition duration-300">
                  <div className="grid gap-4 md:grid-cols-[0.9fr_1fr]">
                    <Field label="Add-on id">
                      <input value={addOn.id} onChange={(event) => updateFinishingAddOn(index, { id: event.target.value })} className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-white outline-none focus:border-[#f2c16b]" />
                    </Field>
                    <Field label="Flat surcharge (Price)">
                      <input type="number" value={addOn.price} onChange={(event) => updateFinishingAddOn(index, { price: Number(event.target.value) || 0 })} className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-white outline-none focus:border-[#f2c16b]" />
                    </Field>
                  </div>
                  <LocalizedTextEditor label="Add-on label" value={addOn.label ?? defaultText()} onChange={(next) => updateFinishingAddOn(index, { label: next })} as="input" englishPlaceholder="Lighting package" arabicPlaceholder="باقة إضاءة" rows={2} />
                </div>
              ))}
            </div>
          </MiniSection>
        </div>
      </BuilderSection>
    </div>
  );
}
