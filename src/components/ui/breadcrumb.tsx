import React from "react";
import Link from "next/link";

type BreadcrumbItem = {
  label: string;
  href?: string;
};

type BreadcrumbProps = {
  items: BreadcrumbItem[];
  className?: string;
};

export function Breadcrumb({ items, className = "" }: BreadcrumbProps) {
  return (
    <nav aria-label="Breadcrumb" className={`flex flex-wrap items-center gap-2 text-sm ${className}`}>
      <Link
        href="/"
        className="text-[rgba(36,27,19,0.45)] transition-colors hover:text-[#dba14a]"
      >
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
        </svg>
      </Link>
      {items.map((item, index) => (
        <React.Fragment key={index}>
          <span className="text-[rgba(36,27,19,0.25)]">/</span>
          {item.href ? (
            <Link
              href={item.href}
              className="text-[rgba(36,27,19,0.45)] transition-colors hover:text-[#dba14a]"
            >
              {item.label}
            </Link>
          ) : (
            <span className="font-medium text-[#241b13]">{item.label}</span>
          )}
        </React.Fragment>
      ))}
    </nav>
  );
}
