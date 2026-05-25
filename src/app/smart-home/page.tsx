import { LeadForm } from "@/components/lead-form";
import { SectionTitle } from "@/components/section-title";
import { MotionSection, MotionCard } from "@/components/motion-public";
import { getSmartDevices, getSmartPackages } from "@/lib/repository";

export default async function SmartHomePage() {
  const [devices, packages] = await Promise.all([getSmartDevices(), getSmartPackages()]);

  return (
    <div>
      <MotionSection className="smart-hero py-20">
        <div className="mx-auto grid w-[min(1180px,calc(100%-1.5rem))] gap-8 lg:grid-cols-[1fr_0.95fr]">
          <SectionTitle
            eyebrow="Smart Home"
            title="A modular smart living flow with devices, packages, and setup requests."
            description="The Smart Home experience is no longer a one-screen promo. It now has reusable device data, package logic, and a dedicated installation funnel."
          />
          <div data-preview-id="smart-steps" className="grid gap-4 rounded-[32px] border border-white/10 bg-white/5 p-6">
            <p className="text-xs uppercase tracking-[0.24em] text-[#f2c16b]">How it works</p>
            {["Consultation", "Device selection", "Installation", "Mobile setup"].map(
              (item, index) => (
                <div key={item} className="rounded-[22px] bg-black/20 p-4">
                  <strong className="font-serif text-2xl text-white">
                    {index + 1}. {item}
                  </strong>
                </div>
              ),
            )}
          </div>
        </div>
      </MotionSection>

      <MotionSection className="mx-auto w-[min(1180px,calc(100%-1.5rem))] py-16 md:py-20" delay={0.1}>
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
          {devices.map((device, i) => (
            <MotionCard key={device.id} index={i}>
              <article className="rounded-[28px] border border-white/10 bg-white/5 p-6 shadow-2xl shadow-black/20">
                <h2 className="font-serif text-3xl">{device.name}</h2>
                <p className="mt-3 text-white/70">{device.summary}</p>
                <ul className="mt-4 grid gap-2 text-sm text-white/65">
                  {device.benefits.map((benefit) => (
                    <li key={benefit}>- {benefit}</li>
                  ))}
                </ul>
              </article>
            </MotionCard>
          ))}
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_1.1fr]">
          <div className="grid gap-4">
            {packages.map((item, i) => (
              <MotionCard key={item.id} index={i}>
                <div className="rounded-[28px] border border-white/10 bg-white/5 p-6">
                  <h2 className="font-serif text-3xl">{item.name}</h2>
                  <p className="mt-2 text-white/70">{item.summary}</p>
                  <div className="mt-4 flex flex-wrap gap-2">
                    {item.devices.map((device) => (
                      <span key={device} className="rounded-full border border-white/10 px-3 py-1 text-xs">
                        {device}
                      </span>
                    ))}
                  </div>
                </div>
              </MotionCard>
            ))}
          </div>

          <LeadForm defaultService="Smart Home Setup" />
        </div>
      </MotionSection>
    </div>
  );
}
