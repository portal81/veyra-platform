import Link from "next/link";
import { BrandLogo } from "@/components/brand-logo";

export function PublicFooter() {
  return (
    <footer className="public-footer">
      <div className="public-footer-inner">
        <div className="public-footer-shell">
          <div className="grid gap-4">
            <BrandLogo size="md" />
            <p className="public-footer-tagline">
              Luxury real estate, finishing, and smart home experiences by Veyra.
            </p>
            <div className="public-footer-rule" />
            <p className="public-footer-copyright">
              All rights reserved to Veyra Developments.
            </p>
          </div>

          <div className="public-footer-links">
            <div className="public-footer-col">
              <span className="public-footer-col-label">Explore</span>
              <Link href="/projects" className="public-footer-link">Projects</Link>
              <Link href="/finishing" className="public-footer-link">Finishing</Link>
              <Link href="/smart-home" className="public-footer-link">Smart Home</Link>
            </div>

            <div className="public-footer-col">
              <span className="public-footer-col-label">Flows</span>
              <Link href="/" className="public-footer-link">Home</Link>
              <Link href="/book" className="public-footer-link">Book a Visit</Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
