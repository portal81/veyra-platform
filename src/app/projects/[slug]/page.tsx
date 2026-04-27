import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { LeadForm } from "@/components/lead-form";
import { getProjectBySlug } from "@/lib/repository";
import { formatCurrency } from "@/lib/utils";

export const dynamic = "force-dynamic";

type ProjectDetailPageProps = {
  params: Promise<{ slug: string }>;
};

export default async function ProjectDetailPage({ params }: ProjectDetailPageProps) {
  const { slug } = await params;
  const project = await getProjectBySlug(slug);

  if (!project) {
    notFound();
  }

  return (
    <div>
      <section data-preview-id="project-detail-hero" className="relative isolate overflow-hidden">
        <Image
          src={project.heroImage}
          alt={project.name}
          width={1600}
          height={900}
          className="absolute inset-0 -z-20 h-full w-full object-cover"
        />
        <div className="absolute inset-0 -z-10 bg-gradient-to-b from-black/60 via-black/50 to-[#120f0d]" />
        <div className="mx-auto grid w-[min(1180px,calc(100%-1.5rem))] gap-8 py-20 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="grid content-end gap-5">
            <p className="text-sm uppercase tracking-[0.3em] text-[#f2c16b]">{project.location}</p>
            <h1 className="font-serif text-5xl md:text-7xl">{project.name}</h1>
            <p className="max-w-2xl text-lg leading-8 text-white/72">{project.description}</p>
            <div className="flex flex-wrap gap-3 text-sm text-white/68">
              <span className="rounded-full border border-white/10 px-4 py-2">
                {project.category}
              </span>
              <span className="rounded-full border border-white/10 px-4 py-2">
                {formatCurrency(project.startingPricePerMeter)} / m²
              </span>
              <span className="rounded-full border border-white/10 px-4 py-2">
                Up to {project.installmentYears} years
              </span>
            </div>
          </div>

          <div data-preview-id="project-highlights" className="glass-card rounded-[32px] p-6">
            <h2 className="font-serif text-3xl">Project highlights</h2>
            <ul className="mt-4 grid gap-3 text-white/72">
              {project.highlights.map((highlight) => (
                <li key={highlight}>- {highlight}</li>
              ))}
            </ul>
            <Link
              href="/book"
              className="mt-6 inline-flex rounded-full bg-gradient-to-r from-[#f2c16b] to-[#c68f43] px-5 py-3 font-semibold text-[#1f160d]"
            >
              Book a site visit
            </Link>
          </div>
        </div>
      </section>

      <section className="mx-auto w-[min(1180px,calc(100%-1.5rem))] py-16 md:py-20">
        <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="grid gap-6">
            <div data-preview-id="project-units" className="rounded-[32px] border border-white/10 bg-white/5 p-6">
              <h2 className="font-serif text-4xl">Available units</h2>
              <div className="mt-6 grid gap-4">
                {project.units.map((unit) => (
                  <div
                    key={unit.id}
                    className="grid gap-3 rounded-[24px] border border-white/10 bg-black/15 p-5 md:grid-cols-5 md:items-center"
                  >
                    <div>
                      <p className="text-xs uppercase tracking-[0.22em] text-[#f2c16b]">
                        {unit.type}
                      </p>
                      <strong className="text-lg text-white">{unit.area} m²</strong>
                    </div>
                    <div className="text-sm text-white/65">Floor {unit.floor}</div>
                    <div className="text-sm text-white/65">
                      {unit.bedrooms ? `${unit.bedrooms} bedrooms` : "Office ready"}
                    </div>
                    <div className="text-sm font-semibold text-white">
                      {formatCurrency(unit.price)}
                    </div>
                    <div>
                      <span className="rounded-full border border-white/10 px-3 py-2 text-xs text-white/70">
                        {unit.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div data-preview-id="project-gallery" className="grid gap-4 md:grid-cols-3">
              {project.gallery.map((image) => (
                <Image
                  key={image}
                  src={image}
                  alt={`${project.name} gallery`}
                  width={640}
                  height={480}
                  className="h-52 w-full rounded-[24px] object-cover"
                />
              ))}
            </div>
          </div>

          <div className="grid gap-6">
            <div data-preview-id="project-visit" className="rounded-[32px] border border-white/10 bg-white/5 p-6">
              <h2 className="font-serif text-3xl">Request a visit</h2>
              <p className="mt-3 text-sm leading-7 text-white/70">
                Leads submitted here appear instantly in demo mode and can later be persisted in
                Supabase for the live admin panel.
              </p>
            </div>
            <LeadForm defaultService="Project Visit" />
          </div>
        </div>
      </section>
    </div>
  );
}
