import Link from "next/link";
import { SectionTitle } from "@/components/section-title";
import { getProjects } from "@/lib/repository";
import { formatCurrency } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function ProjectsPage() {
  const projects = await getProjects();
  const flagship = projects[0];
  const topCategories = [...new Set(projects.map((p) => p.category))].slice(0, 4);

  return (
    <div>
      <section className="public-section py-10 md:py-16">
        <div className="grid gap-8 lg:grid-cols-[1fr_1.2fr]">
          <div className="grid content-start gap-7">
            <SectionTitle
              eyebrow="Projects"
              title="Browse our portfolio of residential and commercial developments."
              description="Each project comes with transparent pricing, unit inventory, and direct booking."
            />

            <div className="rounded-[1.5rem] border border-[rgba(212,164,79,0.2)] bg-white/90 p-5 shadow-lg">
              <div className="grid gap-3 md:grid-cols-3">
                <div className="rounded-xl bg-[rgba(36,27,19,0.04)] px-4 py-3">
                  <span className="text-xs text-[rgba(36,27,19,0.5)]">Area</span>
                  <strong className="block text-sm text-[#241b13]">{flagship?.location ?? "Zagazig"}</strong>
                </div>
                <div className="rounded-xl bg-[rgba(36,27,19,0.04)] px-4 py-3">
                  <span className="text-xs text-[rgba(36,27,19,0.5)]">Property type</span>
                  <strong className="block text-sm text-[#241b13]">{topCategories[0] ?? "Residential"}</strong>
                </div>
                <Link href="/book" className="estate-primary-button flex items-center justify-center">
                  Book a Visit
                </Link>
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                {[...new Set(projects.map((p) => p.location))].slice(0, 6).map((loc) => (
                  <span key={loc} className="rounded-full border border-[rgba(212,164,79,0.2)] bg-white px-3 py-1.5 text-xs text-[rgba(36,27,19,0.6)]">
                    {loc}
                  </span>
                ))}
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              {[
                { label: "Curated inventory", value: projects.length.toString(), note: "Active projects" },
                { label: "Locations", value: new Set(projects.map((p) => p.location)).size.toString(), note: "Areas covered" },
                { label: "Max installments", value: `${Math.max(...projects.map((p) => p.installmentYears))}`, note: "Years" },
              ].map((stat) => (
                <article key={stat.label} className="rounded-2xl border border-[rgba(36,27,19,0.08)] bg-white/60 p-4">
                  <p className="text-[11px] uppercase tracking-[0.26em]" style={{ color: "rgba(36,27,19,0.42)" }}>{stat.label}</p>
                  <strong className="mt-2 block font-serif text-4xl" style={{ color: "#241b13" }}>{stat.value}</strong>
                  <p className="mt-1 text-sm" style={{ color: "rgba(36,27,19,0.55)" }}>{stat.note}</p>
                </article>
              ))}
            </div>
          </div>

          {flagship && (
            <div className="project-showcase-card h-fit">
              <div className="project-showcase-media">
                <img src={flagship.heroImage} alt={flagship.name} className="project-showcase-image" />
                <div className="project-showcase-shade" />
                <div className="project-showcase-scanline" />
                <span className="project-showcase-badge">{flagship.location}</span>
              </div>
              <div className="p-6">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-[11px] uppercase tracking-[0.28em]" style={{ color: "#dba14a" }}>{flagship.category}</p>
                    <h2 className="mt-2 font-serif text-4xl md:text-5xl" style={{ color: "#241b13" }}>{flagship.name}</h2>
                  </div>
                </div>
                <p className="mt-4 max-w-2xl text-base leading-8" style={{ color: "rgba(36,27,19,0.68)" }}>{flagship.description}</p>
                <div className="mt-6 grid gap-3 text-sm md:grid-cols-3">
                  <div>
                    <span className="text-[rgba(36,27,19,0.5)]">From</span>
                    <strong className="ml-1 text-[#241b13]">{formatCurrency(flagship.startingPricePerMeter)} / m²</strong>
                  </div>
                  <div>
                    <span className="text-[rgba(36,27,19,0.5)]">Installments up to</span>
                    <strong className="ml-1 text-[#241b13]">{flagship.installmentYears} years</strong>
                  </div>
                  <div>
                    <span className="text-[rgba(36,27,19,0.5)]">Units listed</span>
                    <strong className="ml-1 text-[#241b13]">{flagship.units.length}</strong>
                  </div>
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                  {flagship.highlights.slice(0, 4).map((h, i) => (
                    <span key={`${h}-${i}`} className="estate-highlight-pill">{h}</span>
                  ))}
                </div>
                <div className="mt-6 flex flex-wrap gap-3">
                  <Link href={`/projects/${flagship.slug}`} className="estate-primary-button">View project</Link>
                  <Link href="/book" className="estate-secondary-button">Book a Visit</Link>
                </div>
              </div>
            </div>
          )}
        </div>
      </section>

      <section className="public-section py-16">
        <div className="mb-8 flex items-end justify-between">
          <div>
            <p className="text-[11px] uppercase tracking-[0.26em]" style={{ color: "#dba14a" }}>All projects</p>
            <h2 className="mt-2 font-serif text-4xl md:text-5xl" style={{ color: "#241b13" }}>Compare & choose</h2>
          </div>
          <div className="hidden gap-2 md:flex">
            {topCategories.map((cat) => (
              <span key={cat} className="rounded-full border border-[rgba(212,164,79,0.2)] bg-white/70 px-4 py-2 text-xs font-medium text-[rgba(36,27,19,0.7)]">
                {cat}
              </span>
            ))}
          </div>
        </div>

        <div className="grid gap-8">
          {projects.map((project) => (
            <article key={project.id} className="rounded-[28px] border border-[rgba(36,27,19,0.08)] bg-white/70 shadow-lg shadow-black/5">
              <div className="grid gap-6 lg:grid-cols-[1fr_1.3fr]">
                <div className="relative min-h-56 overflow-hidden rounded-[28px]">
                  <img src={project.heroImage} alt={project.name} className="absolute inset-0 h-full w-full object-cover" />
                  <div className="absolute bottom-3 left-3 rounded-full bg-black/50 px-3 py-1.5 text-xs text-white/80">
                    {project.location}
                  </div>
                </div>
                <div className="grid gap-5 p-6 md:p-7">
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                      <p className="text-[11px] uppercase tracking-[0.28em]" style={{ color: "#dba14a" }}>{project.category}</p>
                      <h2 className="mt-1 font-serif text-4xl" style={{ color: "#241b13" }}>{project.name}</h2>
                    </div>
                    <span className="rounded-full border border-[rgba(36,27,19,0.1)] px-3 py-1.5 text-xs text-[rgba(36,27,19,0.6)]">
                      {project.units.length} units
                    </span>
                  </div>
                  <p style={{ color: "rgba(36,27,19,0.68)" }}>{project.description}</p>
                  <div className="grid gap-3 text-sm md:grid-cols-4">
                    <div>
                      <span className="text-[rgba(36,27,19,0.45)]">From</span>
                      <strong className="ml-1 text-[#241b13]">{formatCurrency(project.startingPricePerMeter)} / m²</strong>
                    </div>
                    <div>
                      <span className="text-[rgba(36,27,19,0.45)]">Up to</span>
                      <strong className="ml-1 text-[#241b13]">{project.installmentYears} years</strong>
                    </div>
                    <div>
                      <span className="text-[rgba(36,27,19,0.45)]">Launch</span>
                      <strong className="ml-1 text-[#241b13]">{project.featured ? "Featured" : "Core"}</strong>
                    </div>
                    <div>
                      <span className="text-[rgba(36,27,19,0.45)]">Type</span>
                      <strong className="ml-1 text-[#241b13]">{project.category}</strong>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {project.units.slice(0, 3).map((unit) => (
                      <div key={unit.id} className="estate-home-showcase-unit">
                        <span>{unit.type}</span>
                        <strong>{unit.area} m²</strong>
                      </div>
                    ))}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {project.highlights.slice(0, 4).map((h, i) => (
                      <span key={`${h}-${i}`} className="estate-highlight-pill">{h}</span>
                    ))}
                  </div>
                  <div className="estate-pulse-line" />
                  <div className="flex flex-wrap gap-3">
                    <Link href={`/projects/${project.slug}`} className="estate-primary-button">View project</Link>
                    <Link href="/book" className="estate-secondary-button">Book a Visit</Link>
                  </div>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="public-section pb-16">
        <div className="rounded-[32px] border border-[rgba(212,164,79,0.12)] bg-gradient-to-br from-[#fdf8f0] to-white p-8 md:p-12 shadow-xl">
          <p className="text-[11px] uppercase tracking-[0.26em]" style={{ color: "#dba14a" }}>Book a visit</p>
          <h2 className="mt-3 font-serif text-4xl md:text-5xl" style={{ color: "#241b13" }}>See it in person</h2>
          <div className="mt-6 grid gap-3 max-w-lg">
            {[
              "Walk through the unit and inspect finishing quality.",
              "Discuss pricing and installment options face to face.",
              "Get expert guidance on the best unit for your needs.",
            ].map((reason, i) => (
              <div key={i} className="estate-project-fit-row">
                <span className="estate-project-fit-index">0{i + 1}</span>
                <p>{reason}</p>
              </div>
            ))}
          </div>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/book" className="estate-primary-button">Book a Visit</Link>
            {flagship && <Link href={`/projects/${flagship.slug}`} className="estate-secondary-button">View flagship project</Link>}
          </div>
        </div>
      </section>
    </div>
  );
}
