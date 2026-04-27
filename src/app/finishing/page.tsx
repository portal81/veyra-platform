import Image from "next/image";
import { FinishingEstimator } from "@/components/finishing-estimator";
import { LeadForm } from "@/components/lead-form";
import { SectionTitle } from "@/components/section-title";
import { getFinishingPackages } from "@/lib/repository";
import { formatCurrency } from "@/lib/utils";

export default async function FinishingPage() {
  const packages = await getFinishingPackages();

  return (
    <div>
      <section data-preview-id="page-hero" className="finishing-hero py-20">
        <div className="mx-auto grid w-[min(1180px,calc(100%-1.5rem))] gap-8 lg:grid-cols-[1fr_0.95fr]">
          <SectionTitle
            eyebrow="Finishing"
            title="Structured pricing and packages instead of generic luxury visuals."
            description="This section is now driven by package data, estimation logic, and a direct quote flow that can later be managed from the admin."
          />
          <FinishingEstimator />
        </div>
      </section>

      <section className="mx-auto w-[min(1180px,calc(100%-1.5rem))] py-16 md:py-20">
        <div data-preview-id="finishing-proof" className="grid gap-6 md:grid-cols-3">
          {packages.map((item) => (
            <article
              key={item.id}
              className="rounded-[30px] border border-white/10 bg-white/5 p-6 shadow-2xl shadow-black/20"
            >
              <p className="text-xs uppercase tracking-[0.24em] text-[#f2c16b]">
                {item.featured ? "Recommended" : "Package"}
              </p>
              <h2 className="mt-2 font-serif text-4xl">{item.name}</h2>
              <p className="mt-3 text-white/70">{item.summary}</p>
              <strong className="mt-5 block font-serif text-3xl text-white">
                {formatCurrency(item.pricePerMeter)} / mÂ²
              </strong>
              <ul className="mt-4 grid gap-2 text-sm text-white/65">
                {item.features.map((feature) => (
                  <li key={feature}>- {feature}</li>
                ))}
              </ul>
            </article>
          ))}
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_1.1fr]">
          <Image
            src="/scenes/before-after.svg"
            alt="Before and after finishing concept"
            width={1400}
            height={900}
            className="h-full min-h-80 w-full rounded-[32px] object-cover"
          />
          <LeadForm defaultService="Finishing Quote" />
        </div>
      </section>
    </div>
  );
}

