import Link from "next/link";
import Image from "next/image";
import { LeadForm } from "@/components/lead-form";
import { getProjects, getFinishingPackages, getSmartPackages, getSmartDevices } from "@/lib/repository";
import { formatCurrency } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const [projects, finishing, smartDevices, smartPackages] = await Promise.all([
    getProjects(),
    getFinishingPackages(),
    getSmartDevices(),
    getSmartPackages(),
  ]);

  const featured = projects.filter((p) => p.featured).slice(0, 4);

  return (
    <div>
      {/* ── Hero ────────────────────────────────────────── */}
      <section className="hero-gradient relative isolate flex min-h-[90vh] items-center overflow-hidden">
        <div className="estate-grid-lines" />
        <div className="estate-orb estate-orb-left" />
        <div className="estate-orb estate-orb-right" />
        <div className="estate-tower-beacon" />

        <div className="relative z-10 mx-auto w-[min(1180px,calc(100%-1.5rem))] py-20">
          <div className="max-w-3xl">
            <span className="estate-chip">Veyra Developments</span>
            <h1 className="mt-6 font-serif text-5xl leading-tight text-white md:text-7xl">
              Real estate, finished,
              <br />
              <span className="bg-gradient-to-r from-[#f2c16b] to-[#e2a44d] bg-clip-text text-transparent">
                intelligently.
              </span>
            </h1>
            <p className="mt-5 max-w-2xl text-lg leading-8 text-white/70">
              From project selection and finishing packages to smart home infrastructure —
              Veyra manages the full lifecycle with a single operations platform.
            </p>
            <div className="mt-8 flex flex-wrap gap-4">
              <Link href="/book" className="estate-primary-button text-sm">
                Book a Visit
              </Link>
              <Link href="/projects" className="estate-secondary-button text-sm">
                View Projects
              </Link>
            </div>
          </div>

          <div className="mt-16 grid gap-4 sm:grid-cols-3">
            {[
              { label: "Projects", value: projects.length },
              { label: "Finishing Packages", value: finishing.length },
              { label: "Smart Devices", value: smartDevices.length },
            ].map((stat) => (
              <div key={stat.label} className="estate-signal-card">
                <span className="estate-signal-label">{stat.label}</span>
                <span className="estate-signal-value font-serif text-3xl text-[#f2c16b]">
                  {stat.value}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Featured Projects ───────────────────────────── */}
      {featured.length > 0 && (
        <section className="mx-auto w-[min(1180px,calc(100%-1.5rem))] py-20 md:py-28">
          <div className="mb-10 flex items-end justify-between">
            <div>
              <p className="mb-2 text-xs font-semibold tracking-[0.28em] text-[#f2c16b] uppercase">
                Featured
              </p>
              <h2 className="font-serif text-4xl text-white md:text-5xl">Our Projects</h2>
            </div>
            <Link
              href="/projects"
              className="estate-secondary-button text-xs"
            >
              All Projects
            </Link>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            {featured.map((project, i) => (
              <Link key={project.id} href={`/projects/${project.slug}`}>
                <article
                  className="project-showcase-card h-full"
                  style={{ animationDelay: `${i * 100}ms` }}
                >
                  <div className="project-showcase-media">
                    <Image
                      src={project.heroImage}
                      alt={project.name}
                      width={800}
                      height={500}
                      className="project-showcase-image"
                    />
                    <div className="project-showcase-shade" />
                    <div className="project-showcase-scanline" />
                    <span className="project-showcase-badge">{project.category}</span>
                  </div>
                  <div className="p-5">
                    <p className="text-xs uppercase tracking-[0.22em] text-[#f2c16b]">
                      {project.location}
                    </p>
                    <h3 className="mt-1 font-serif text-2xl text-white">{project.name}</h3>
                    <p className="mt-2 line-clamp-2 text-sm leading-7 text-white/65">
                      {project.description}
                    </p>
                    <div className="mt-4 flex items-center justify-between">
                      <span className="text-sm text-white/70">
                        From {formatCurrency(project.startingPricePerMeter)} / m²
                      </span>
                      <span className="rounded-full border border-white/10 px-3 py-1 text-xs text-white/60">
                        Up to {project.installmentYears}y
                      </span>
                    </div>
                  </div>
                </article>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* ── Services ────────────────────────────────────── */}
      <section className="-mt-1 py-20 md:py-28">
        <div className="mx-auto w-[min(1180px,calc(100%-1.5rem))]">
          <p className="mb-2 text-center text-xs font-semibold tracking-[0.28em] text-[#f2c16b] uppercase">
            Services
          </p>
          <h2 className="text-center font-serif text-4xl text-white md:text-5xl">
            Everything in one place
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-center text-base leading-8 text-white/60">
            From finishing and furnishing to smart home automation — Veyra integrates every layer.
          </p>

          <div className="mt-12 grid gap-6 md:grid-cols-3">
            <Link href="/finishing">
              <article className="estate-service-card estate-service-card-1 h-full">
                <div className="flex h-full flex-col justify-between">
                  <div>
                    <span className="estate-service-index">01</span>
                    <h3 className="font-serif text-3xl text-[#4a3828]">Finishing</h3>
                    <p className="mt-3 text-sm leading-7 text-[#6f5a45]/90">
                      Structured packages with transparent pricing per m². Basic to ultra luxury.
                    </p>
                  </div>
                  <div className="estate-service-footer">
                    <span className="estate-service-stat">{finishing.length} packages</span>
                    <span className="estate-service-link">Learn more →</span>
                  </div>
                </div>
              </article>
            </Link>

            <Link href="/smart-home">
              <article className="estate-service-card estate-service-card-2 h-full">
                <div className="flex h-full flex-col justify-between">
                  <div>
                    <span className="estate-service-index">02</span>
                    <h3 className="font-serif text-3xl text-[#4a3828]">Smart Home</h3>
                    <p className="mt-3 text-sm leading-7 text-[#6f5a45]/90">
                      Devices, packages, and installation flow for a fully connected home.
                    </p>
                  </div>
                  <div className="estate-service-footer">
                    <span className="estate-service-stat">{smartPackages.length} packages</span>
                    <span className="estate-service-link">Learn more →</span>
                  </div>
                </div>
              </article>
            </Link>

            <Link href="/book">
              <article className="estate-service-card estate-service-card-3 h-full">
                <div className="flex h-full flex-col justify-between">
                  <div>
                    <span className="estate-service-index">03</span>
                    <h3 className="font-serif text-3xl text-[#4a3828]">Project Visit</h3>
                    <p className="mt-3 text-sm leading-7 text-[#6f5a45]/90">
                      Schedule a site visit. See units in person and get expert guidance.
                    </p>
                  </div>
                  <div className="estate-service-footer">
                    <span className="estate-service-stat">{featured.length} projects</span>
                    <span className="estate-service-link">Book now →</span>
                  </div>
                </div>
              </article>
            </Link>
          </div>
        </div>
      </section>

      {/* ── Lead Form ───────────────────────────────────── */}
      <section className="border-t border-white/8 bg-[#0d0a09] py-20 md:py-28">
        <div className="mx-auto grid w-[min(1180px,calc(100%-1.5rem))] gap-10 lg:grid-cols-[1fr_1.1fr]">
          <div>
            <p className="mb-2 text-xs font-semibold tracking-[0.28em] text-[#f2c16b] uppercase">
              Get started
            </p>
            <h2 className="font-serif text-4xl text-white md:text-5xl">
              Ready to move forward?
            </h2>
            <p className="mt-4 max-w-lg text-base leading-8 text-white/60">
              Tell us what you need and our team will reach out within 24 hours with a
              tailored proposal.
            </p>
            <div className="estate-ribbon-strip mt-8">
              {["Projects", "Finishing quotes", "Smart home", "Site visit"].map((tag) => (
                <span key={tag} className="estate-ribbon-item">{tag}</span>
              ))}
            </div>
          </div>
          <LeadForm />
        </div>
      </section>
    </div>
  );
}
