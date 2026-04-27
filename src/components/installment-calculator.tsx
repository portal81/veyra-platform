"use client";

import { useMemo, useState } from "react";
import { formatCurrency } from "@/lib/utils";

const rateMap = {
  Residential: 20000,
  Administrative: 40000,
  Penthouse: 35000,
} as const;

export function InstallmentCalculator() {
  const [unitType, setUnitType] = useState<keyof typeof rateMap>("Residential");
  const [area, setArea] = useState(120);
  const [years, setYears] = useState(6);
  const [downPayment, setDownPayment] = useState(600000);

  const result = useMemo(() => {
    const cashPrice = rateMap[unitType] * area;
    const installmentPrice = cashPrice * 1.12;
    const monthlyPayment = Math.max(0, (installmentPrice - downPayment) / (years * 12));

    return { cashPrice, installmentPrice, monthlyPayment };
  }, [area, downPayment, unitType, years]);

  return (
    <div className="grid gap-6 rounded-[28px] border border-white/10 bg-white/5 p-6 shadow-2xl shadow-black/20 lg:grid-cols-[1.1fr_0.8fr]">
      <div className="grid gap-4">
        <label className="grid gap-2 text-sm text-white/75">
          Unit Type
          <select
            className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-white outline-none"
            value={unitType}
            onChange={(event) => setUnitType(event.target.value as keyof typeof rateMap)}
          >
            {Object.keys(rateMap).map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </label>

        <label className="grid gap-2 text-sm text-white/75">
          Area (m²)
          <input
            className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-white outline-none"
            type="number"
            min={40}
            value={area}
            onChange={(event) => setArea(Number(event.target.value))}
          />
        </label>

        <label className="grid gap-2 text-sm text-white/75">
          Installment Years
          <select
            className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-white outline-none"
            value={years}
            onChange={(event) => setYears(Number(event.target.value))}
          >
            <option value={3}>3 years</option>
            <option value={5}>5 years</option>
            <option value={6}>6 years</option>
            <option value={7}>7 years</option>
          </select>
        </label>

        <label className="grid gap-2 text-sm text-white/75">
          Down Payment
          <input
            className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-white outline-none"
            type="number"
            min={0}
            value={downPayment}
            onChange={(event) => setDownPayment(Number(event.target.value))}
          />
        </label>
      </div>

      <div className="grid content-start gap-4 rounded-[24px] bg-black/25 p-5">
        <div>
          <p className="text-sm text-white/55">Cash Price</p>
          <strong className="font-serif text-3xl text-[#f2c16b]">
            {formatCurrency(result.cashPrice)}
          </strong>
        </div>
        <div>
          <p className="text-sm text-white/55">Installment Price</p>
          <strong className="font-serif text-3xl text-[#f2c16b]">
            {formatCurrency(result.installmentPrice)}
          </strong>
        </div>
        <div>
          <p className="text-sm text-white/55">Monthly Payment</p>
          <strong className="font-serif text-3xl text-[#f2c16b]">
            {formatCurrency(result.monthlyPayment)}
          </strong>
        </div>
      </div>
    </div>
  );
}
