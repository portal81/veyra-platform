"use client";

import { useMemo, useState } from "react";
import { formatCurrency } from "@/lib/utils";

const packageRates = {
  Basic: 2200,
  "Super Lux": 3600,
  "Ultra Super Lux": 5200,
} as const;

export function FinishingEstimator() {
  const [area, setArea] = useState(120);
  const [tier, setTier] = useState<keyof typeof packageRates>("Super Lux");

  const estimatedCost = useMemo(() => area * packageRates[tier], [area, tier]);

  return (
    <div className="grid gap-6 rounded-[28px] border border-white/10 bg-[#231b17]/80 p-6 shadow-2xl shadow-black/20 lg:grid-cols-[1fr_0.8fr]">
      <div className="grid gap-4">
        <label className="grid gap-2 text-sm text-white/75">
          Apartment Area
          <input
            className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-white outline-none"
            type="number"
            min={50}
            value={area}
            onChange={(event) => setArea(Number(event.target.value))}
          />
        </label>

        <label className="grid gap-2 text-sm text-white/75">
          Finishing Tier
          <select
            className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-white outline-none"
            value={tier}
            onChange={(event) => setTier(event.target.value as keyof typeof packageRates)}
          >
            {Object.keys(packageRates).map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="grid content-center gap-3 rounded-[24px] bg-black/20 p-5">
        <p className="text-sm uppercase tracking-[0.24em] text-[#f2c16b]">Estimated Cost</p>
        <strong className="font-serif text-4xl text-white">{formatCurrency(estimatedCost)}</strong>
        <p className="text-sm leading-7 text-white/65">
          Final pricing is confirmed after site inspection, but this estimate gives the client a
          real starting point.
        </p>
      </div>
    </div>
  );
}
