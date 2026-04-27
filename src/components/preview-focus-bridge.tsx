"use client";

import { useEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation";

const HIGHLIGHT_CLASS = "preview-focus-target";

export function PreviewFocusBridge() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const focusId = searchParams.get("focus");

  useEffect(() => {
    if (!focusId) return;
    if (pathname.startsWith("/admin") || pathname.startsWith("/auth")) return;

    const selectors = [
      `[data-preview-id="${focusId}"]`,
      `#${focusId}`,
    ];

    const run = () => {
      const target = selectors
        .map((selector) => document.querySelector<HTMLElement>(selector))
        .find(Boolean);

      if (!target) return;

      document.querySelectorAll(`.${HIGHLIGHT_CLASS}`).forEach((node) => node.classList.remove(HIGHLIGHT_CLASS));
      target.classList.add(HIGHLIGHT_CLASS);
      target.scrollIntoView({ behavior: "smooth", block: "center", inline: "nearest" });

      const timer = window.setTimeout(() => {
        target.classList.remove(HIGHLIGHT_CLASS);
      }, 2600);

      return () => window.clearTimeout(timer);
    };

    const timeout = window.setTimeout(run, 450);
    return () => window.clearTimeout(timeout);
  }, [focusId, pathname]);

  if (pathname.startsWith("/admin") || pathname.startsWith("/auth")) return null;

  return (
    <style>{`
      .${HIGHLIGHT_CLASS} {
        outline: 2px solid rgba(242, 193, 107, 0.95);
        outline-offset: 6px;
        box-shadow: 0 0 0 10px rgba(242, 193, 107, 0.12), 0 0 32px rgba(242, 193, 107, 0.18);
        border-radius: 24px;
        transition: outline-color 180ms ease, box-shadow 180ms ease;
      }
    `}</style>
  );
}
