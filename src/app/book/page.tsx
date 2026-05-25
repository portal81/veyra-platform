import { LeadForm } from "@/components/lead-form";
import { SectionTitle } from "@/components/section-title";
import { MotionSection } from "@/components/motion-public";

export default function BookPage() {
  return (
    <MotionSection className="book-hero py-20">
      <div className="mx-auto grid w-[min(1180px,calc(100%-1.5rem))] gap-8 lg:grid-cols-[0.8fr_1.1fr]">
        <SectionTitle
          eyebrow="Book"
          title="One booking surface for projects, finishing, and smart home."
          description="This page is the shared conversion endpoint. In production it can sit on the public site while an admin subdomain manages incoming requests."
        />
        <LeadForm />
      </div>
    </MotionSection>
  );
}
