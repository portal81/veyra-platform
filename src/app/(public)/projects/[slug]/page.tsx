import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { LeadForm } from "@/components/lead-form";
import { getProjectBySlug } from "@/lib/repository";
import { formatCurrency } from "@/lib/utils";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ slug: string }>;
};

export default async function ProjectDetailPage({ params }: Props) {
  const { slug } = await params;
  const project = await getProjectBySlug(slug);

  if (!project) notFound();

  return (
    <div>
      <section className="relative isolate overflow-hidden">
        <Image
          src={project.heroImage}
          alt={project.name}
          width={1600}
          height={900}
          className="absolute inset-0 -z-20 h-full w-full object-cover"
        />
        <div className="absolute inset-0 -z-10 bg-gradient-to-b from-black/60 via-black/50 to-[#f7f1e7]" />
        <div className="mx-auto grid w-[min(1180px,calc(100%-1.5rem))] gap-8 py-20 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="grid content-end gap-5">
            <p className="text-sm uppercase tracking-[0.3em]" style={{ color: "#dba14a" }}>{project.location}</p>
            <h1 className="font-serif text-5xl md:text-7xl text-white">{project.name}</h1>
            <p className="max-w-2xl text-lg leading-8 text-white/72">{project.description}</p>
            <div className="flex flex-wrap gap-3 text-sm text-white/68">
              <span className="rounded-full border border-white/10 px-4 py-2">{project.category}</span>
              <span className="rounded-full border border-white/10 px-4 py-2">{formatCurrency(project.startingPricePerMeter)} / m²</span>
              <span className="rounded-full border border-white/10 px-4 py-2">Up to {project.installmentYears} years</span>
            </div>
          </div>
          <div className="rounded-[32px] border border-white/10 bg-white/5 p-6 backdrop-blur-md">
            <h2 className="font-serif text-3xl text-white">Project highlights</h2>
            <ul className="mt-4 grid gap-3 text-white/72">
              {project.highlights.map((h) => (<li key={h}>- {h}</li>))}
            </ul>
            <Link href="/book" className="mt-6 inline-flex rounded-full bg-gradient-to-r from-[#e0ac58] to-[#bb7d31] px-5 py-3 font-semibold text-[#1f150d]">
              Book a site visit
            </Link>
          </div>
        </div>
      </section>

      <section className="public-section py-16">
        <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="grid gap-6">
            <div className="rounded-[32px] border border-[rgba(36,27,19,0.08)] bg-white/70 p-6">
              <h2 className="font-serif text-4xl" style={{ color: "#241b13" }}>Available units</h2>
              <div className="mt-6 grid gap-4">
                {project.units.map((unit) => (
                  <div key={unit.id} className="grid gap-3 rounded-[24px] border border-[rgba(36,27,19,0.08)] bg-white p-5 md:grid-cols-5 md:items-center">
                    <div>
                      <p className="text-xs uppercase tracking-[0.22em]" style={{ color: "#dba14a" }}>{unit.type}</p>
                      <strong className="text-lg" style={{ color: "#241b13" }}>{unit.area} m²</strong>
                    </div>
                    <div className="text-sm" style={{ color: "rgba(36,27,19,0.65)" }}>Floor {unit.floor}</div>
                    <div className="text-sm" style={{ color: "rgba(36,27,19,0.65)" }}>{unit.bedrooms ? `${unit.bedrooms} bedrooms` : "Office ready"}</div>
                    <div className="text-sm font-semibold" style={{ color: "#241b13" }}>{formatCurrency(unit.price)}</div>
                    <div>
                      <span className="rounded-full border border-[rgba(36,27,19,0.1)] px-3 py-1.5 text-xs" style={{ color: "rgba(36,27,19,0.7)" }}>{unit.status}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              {project.gallery.map((image) => (
                <Image key={image} src={image} alt={`${project.name} gallery`} width={640} height={480} className="h-52 w-full rounded-[24px] object-cover" />
              ))}
            </div>
          </div>

          <div className="grid gap-6">
            <div className="rounded-[32px] border border-[rgba(36,27,19,0.08)] bg-white/70 p-6">
              <h2 className="font-serif text-3xl" style={{ color: "#241b13" }}>Request a visit</h2>
              <p className="mt-3 text-sm leading-7" style={{ color: "rgba(36,27,19,0.7)" }}>
                Schedule a site visit to see the unit in person and discuss pricing directly with our team.
              </p>
            </div>
            <div className="estate-lead-shell estate-lead-shell-atlas">
              <LeadForm defaultService="Project Visit" />
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
