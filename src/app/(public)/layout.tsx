import { PageTransition } from "@/components/page-transition";
import { PublicHeader } from "@/components/public-header";
import { PublicFooter } from "@/components/public-footer";
import { AiConcierge } from "@/components/ai-concierge";

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="site-public-shell flex min-h-full flex-col">
      <PublicHeader />
      <main className="flex-1">
        <PageTransition>{children}</PageTransition>
      </main>
      <PublicFooter />
      <AiConcierge />
    </div>
  );
}
