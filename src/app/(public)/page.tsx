import Link from "next/link";
import { FinishingEstimator } from "@/components/finishing-estimator";
import { InstallmentCalculator } from "@/components/installment-calculator";
import { LeadForm } from "@/components/lead-form";
import { SectionTitle } from "@/components/section-title";
import { getProjects, getFinishingPackages, getSmartDevices } from "@/lib/repository";
import { formatCurrency } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const [projects, finishingPackages, smartDevices] = await Promise.all([
    getProjects(),
    getFinishingPackages(),
    getSmartDevices(),
  ]);

  const featuredProjects = projects.filter((p) => p.featured).slice(0, 2);
  const signatureProject = featuredProjects[0] ?? projects[0];
  const topLocations = [...new Set(projects.map((p) => p.location))].slice(0, 4);
  const topCategories = [...new Set(projects.map((p) => p.category))].slice(0, 4);

  return (
    <div className="min-h-screen">
      {/* ── Hero Search ──────────────────────────────── */}
      <section className="public-hero-search">
        {signatureProject?.heroImage && (
          <img
            src={signatureProject.heroImage}
            alt="Search Portal Backdrop"
            className="public-hero-search-backdrop"
          />
        )}
        <div className="public-hero-search-overlay" />
        <div className="public-hero-search-content">
          <h1 className="text-4xl font-bold md:text-6xl">Find Your Dream Property</h1>
          <p className="mx-auto mt-4 max-w-2xl text-xl">
            Discover the finest residential and commercial projects in Egypt with the best payment plans.
          </p>
          <div className="public-search-box mt-10">
            <input
              type="text"
              placeholder={`Search for a project or area (e.g., New Cairo, Zayed)...`}
              className="public-search-input"
            />
            <Link href="/projects" className="estate-primary-button whitespace-nowrap !rounded-xl !px-10 !py-4 !text-lg">
              Search Now
            </Link>
          </div>
          <div className="public-popular-tags">
            <span className="text-sm font-medium">Popular areas:</span>
            {topLocations.map((loc) => (
              <Link key={loc} href={`/projects?location=${loc}`} className="public-popular-tag">
                {loc}
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── Service Architecture ─────────────────────── */}
      <section className="public-section public-section-wide">
        <div className="estate-scene-shell">
          <SectionTitle
            eyebrow="Service Architecture"
            title="Three business lines with clearer movement and stronger visual distinction."
            description="Each service behaves like its own premium product while the brand language stays unified."
          />
          <div className="estate-scene-rule" />
        </div>

        <div className="mt-10 grid gap-6 md:grid-cols-3">
          {[
            { href: "/projects", index: 1, title: "Projects", copy: "Scalable project listings, unit inventories, installment flows, and visit booking.", stat: "Residential + Mixed-use", link: "Open section" },
            { href: "/finishing", index: 2, title: "Finishing", copy: "Package-driven finishing journeys with estimation logic and direct conversion points.", stat: "Three pricing tiers", link: "Open section" },
            { href: "/smart-home", index: 3, title: "Smart Home", copy: "Device modules, setup journeys, and premium add-ons that extend the real-estate sale.", stat: "Consultation to install", link: "Open section" },
          ].map((item) => (
            <Link key={item.href} href={item.href} className={`estate-service-card estate-service-card-${item.index} estate-service-card-editorial`}>
              <span className="estate-service-index">0{item.index}</span>
              <h3 className="font-serif text-3xl" style={{ color: "#241b13" }}>{item.title}</h3>
              <p className="mt-3 text-base leading-8" style={{ color: "rgba(36,27,19,0.68)" }}>{item.copy}</p>
              <div className="estate-service-footer">
                <span className="estate-service-stat" style={{ color: "rgba(36,27,19,0.48)" }}>{item.stat}</span>
                <span className="estate-service-link" style={{ color: "#dba14a" }}>{item.link} →</span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* ── Featured Projects ────────────────────────── */}
      {featuredProjects.length > 0 && (
        <section className="public-section public-section-wide">
          <div className="estate-portfolio-shell">
            <SectionTitle
              eyebrow="Featured Projects"
              title="Project cards now move like property showcases, not flat listing tiles."
              description="Images, overlays, and metrics are staged to feel like premium real-estate placement."
            />
          </div>

          <div className="mt-10 grid gap-6 lg:grid-cols-[1.08fr_0.92fr]">
            {featuredProjects.map((project, index) => (
              <article key={project.id} className={`project-showcase-card estate-home-showcase-card project-showcase-card-${index + 1}`}>
                <div className="project-showcase-media">
                  <img src={project.heroImage} alt={project.name} className="project-showcase-image" />
                  <div className="project-showcase-shade" />
                  <div className="project-showcase-scanline" />
                  <span className="project-showcase-badge">{project.location}</span>
                </div>
                <div className="grid gap-4 p-6">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="text-sm uppercase tracking-[0.22em]" style={{ color: "#dba14a" }}>{project.category}</p>
                      <h3 className="font-serif text-4xl" style={{ color: "#241b13" }}>{project.name}</h3>
                    </div>
                    <span className="estate-outline-pill">{project.units.length} unit types</span>
                  </div>
                  <p className="text-base leading-8" style={{ color: "rgba(36,27,19,0.68)" }}>{project.description}</p>
                  <div className="grid gap-3 text-sm md:grid-cols-3" style={{ color: "rgba(36,27,19,0.68)" }}>
                    <div>{formatCurrency(project.startingPricePerMeter)} / m²</div>
                    <div>Installments up to {project.installmentYears} years</div>
                    <div>Mixed-use investment flow</div>
                  </div>
                  <div className="estate-home-showcase-rail">
                    {project.units.slice(0, 3).map((unit) => (
                      <div key={unit.id} className="estate-home-showcase-unit">
                        <span>{unit.type}</span>
                        <strong>{unit.area} m²</strong>
                      </div>
                    ))}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {project.highlights.map((h, i) => (
                      <span key={`${h}-${i}`} className="estate-highlight-pill">{h}</span>
                    ))}
                  </div>
                  <div className="estate-pulse-line" />
                  <Link href={`/projects/${project.slug}`} className="estate-primary-button w-fit">
                    View project details
                  </Link>
                </div>
              </article>
            ))}
          </div>
        </section>
      )}

      {/* ── Calculators ──────────────────────────────── */}
      <section className="public-section public-section-wide grid gap-6 lg:grid-cols-2">
        <div className="grid gap-6">
          <SectionTitle
            eyebrow="Installments"
            title="Investment tools with controllable pricing logic."
            description="Unit type, meter price, installment years, and down payment all come from admin-controlled settings."
          />
          <div className="estate-tool-shell estate-tool-shell-atlas">
            <InstallmentCalculator />
          </div>
        </div>
        <div className="grid gap-6">
          <SectionTitle
            eyebrow="Finishing"
            title="Package-driven finishing estimates."
            description="Area, tier, and optional upgrades are editable from the admin builder."
          />
          <div className="estate-tool-shell estate-tool-shell-atlas">
            <FinishingEstimator />
          </div>
        </div>
      </section>

      {/* ── Service Modules ──────────────────────────── */}
      <section className="public-section public-section-wide">
        <SectionTitle
          eyebrow="Service Modules"
          title="Complementary services are staged like premium upsells after the core property journey."
          description="Finishing and smart-home modules carry the same visual polish while keeping their own product logic."
        />
        <div className="mt-10 grid gap-6 lg:grid-cols-2">
          <div className="grid gap-4">
            {finishingPackages.map((item) => (
              <div key={item.id} className="estate-module-card estate-module-card-warm estate-module-card-dossier">
                <div className="flex items-center justify-between gap-4">
                  <h3 className="font-serif text-3xl" style={{ color: "#241b13" }}>{item.name}</h3>
                  <span className="text-sm font-semibold" style={{ color: "#dba14a" }}>{formatCurrency(item.pricePerMeter)} / m²</span>
                </div>
                <p className="mt-3" style={{ color: "rgba(36,27,19,0.68)" }}>{item.summary}</p>
                <div className="mt-4 flex flex-wrap gap-2">
                  {item.features.map((feature, fi) => (
                    <span key={`${feature}-${fi}`} className="estate-highlight-pill">{feature}</span>
                  ))}
                </div>
              </div>
            ))}
          </div>
          <div className="grid gap-4">
            {smartDevices.map((item) => (
              <div key={item.id} className="estate-module-card estate-module-card-cool estate-module-card-dossier">
                <h3 className="font-serif text-3xl" style={{ color: "#241b13" }}>{item.name}</h3>
                <p className="mt-3" style={{ color: "rgba(36,27,19,0.68)" }}>{item.summary}</p>
                <ul className="mt-4 grid gap-2 text-sm" style={{ color: "rgba(36,27,19,0.62)" }}>
                  {item.benefits.map((benefit, bi) => (
                    <li key={`${benefit}-${bi}`}>- {benefit}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Lead Capture ─────────────────────────────── */}
      <section className="book-hero relative overflow-hidden py-20">
        <div className="estate-grid-lines opacity-40" />
        <div className="mx-auto grid w-[min(1240px,calc(100%-1.5rem))] gap-8 lg:grid-cols-[0.82fr_1.18fr]">
          <div>
            <SectionTitle
              eyebrow="Lead Capture"
              title="A final conversion block tuned for luxury property journeys."
              description="The form stays practical, but the closing section now feels like the last scene of a premium property funnel."
            />
            <div className="estate-home-booking-list">
              <p className="text-[11px] uppercase tracking-[0.26em]" style={{ color: "#dba14a" }}>Before you submit</p>
              <div className="mt-4 grid gap-3">
                {[
                  "Pick the right path first: projects, finishing, or smart home.",
                  "The clearer the request, the faster the recommendation.",
                  "Submit without commitment, then refine details with the team.",
                ].map((text, i) => (
                  <div key={i} className="estate-project-fit-row">
                    <span className="estate-project-fit-index">0{i + 1}</span>
                    <p>{text}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <div className="estate-lead-shell estate-lead-shell-atlas">
            <LeadForm defaultService="Project Visit" />
          </div>
        </div>
      </section>

      {/* ── Browse by Category ─────────────────────────── */}
      <section className="py-20 md:py-24 border-t border-[rgba(212,164,79,0.1)]" style={{ backgroundColor: "rgba(212,164,79,0.03)" }}>
        <div className="public-section">
          <div className="mb-12 text-center">
            <h2 className="font-serif text-3xl font-bold md:text-5xl" style={{ color: "#241b13" }}>
              Browse by Category
            </h2>
            <p style={{ color: "rgba(36,27,19,0.6)" }}>
              Browse a wide range of properties tailored to all your needs
            </p>
          </div>
          <div className="public-browse-grid">
            {topCategories.map((cat, idx) => (
              <Link key={cat} href={`/projects?category=${cat}`} className="public-browse-card">
                <div className="public-browse-icon">
                  <span className="text-3xl font-bold">0{idx + 1}</span>
                </div>
                <strong className="public-browse-label">{cat}</strong>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
