"use client";

import { useMemo, useState, useTransition } from "react";
import type { SeoPageConfig } from "@/lib/types";

type SeoSettingsBuilderProps = {
  initialPages: SeoPageConfig[];
};

export function SeoSettingsBuilder({ initialPages }: SeoSettingsBuilderProps) {
  const [pages, setPages] = useState(initialPages);
  const [activeId, setActiveId] = useState(initialPages[0]?.id ?? "");
  const [isPending, startTransition] = useTransition();
  const [feedback, setFeedback] = useState("");

  const activePage = useMemo(
    () => pages.find((page) => page.id === activeId) ?? pages[0] ?? null,
    [activeId, pages],
  );

  function patchActive(next: SeoPageConfig) {
    setPages((current) => current.map((page) => (page.id === next.id ? next : page)));
  }

  function savePage() {
    if (!activePage) return;
    startTransition(async () => {
      setFeedback("");
      const response = await fetch("/api/admin/seo", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(activePage),
      });
      const json = (await response.json()) as { page?: SeoPageConfig; message?: string };
      if (!response.ok || !json.page) {
        setFeedback(json.message ?? "Could not save SEO settings.");
        return;
      }
      patchActive(json.page);
      setFeedback("SEO settings saved.");
    });
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[320px_minmax(0,1fr)]">
      <section className="rounded-2xl border border-neutral-800 bg-neutral-900/50 p-4">
        <h3 className="mb-4 text-sm font-semibold text-white">SEO Pages</h3>
        <div className="grid gap-2">
          {pages.map((page) => (
            <button
              key={page.id}
              type="button"
              onClick={() => setActiveId(page.id)}
              className={`rounded-xl border px-3 py-3 text-left ${
                activePage?.id === page.id
                  ? "border-brand-gold/40 bg-brand-gold/10"
                  : "border-white/10 bg-black/20 hover:bg-white/5"
              }`}
            >
              <p className="text-sm font-medium text-white">{page.label}</p>
              <p className="mt-1 text-xs text-white/60">/{page.seo.slug || ""}</p>
            </button>
          ))}
        </div>
      </section>

      <section className="rounded-2xl border border-neutral-800 bg-[#0c0a09] p-5">
        {activePage ? (
          <div className="grid gap-4">
            <label className="grid gap-2 text-xs uppercase tracking-wider text-neutral-400">
              Meta title
              <input
                value={activePage.seo.metaTitle}
                onChange={(event) =>
                  patchActive({
                    ...activePage,
                    seo: { ...activePage.seo, metaTitle: event.target.value },
                  })
                }
                className="rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-white outline-none"
              />
            </label>

            <label className="grid gap-2 text-xs uppercase tracking-wider text-neutral-400">
              Meta description
              <textarea
                value={activePage.seo.metaDescription}
                onChange={(event) =>
                  patchActive({
                    ...activePage,
                    seo: { ...activePage.seo, metaDescription: event.target.value },
                  })
                }
                rows={3}
                className="rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-white outline-none"
              />
            </label>

            <div className="grid gap-4 md:grid-cols-2">
              <label className="grid gap-2 text-xs uppercase tracking-wider text-neutral-400">
                Slug
                <input
                  value={activePage.seo.slug}
                  onChange={(event) =>
                    patchActive({
                      ...activePage,
                      seo: { ...activePage.seo, slug: event.target.value },
                    })
                  }
                  className="rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-white outline-none"
                />
              </label>
              <label className="grid gap-2 text-xs uppercase tracking-wider text-neutral-400">
                Canonical URL
                <input
                  value={activePage.seo.canonicalUrl ?? ""}
                  onChange={(event) =>
                    patchActive({
                      ...activePage,
                      seo: { ...activePage.seo, canonicalUrl: event.target.value },
                    })
                  }
                  className="rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-white outline-none"
                />
              </label>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <label className="grid gap-2 text-xs uppercase tracking-wider text-neutral-400">
                OG title
                <input
                  value={activePage.seo.ogTitle ?? ""}
                  onChange={(event) =>
                    patchActive({
                      ...activePage,
                      seo: { ...activePage.seo, ogTitle: event.target.value },
                    })
                  }
                  className="rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-white outline-none"
                />
              </label>
              <label className="grid gap-2 text-xs uppercase tracking-wider text-neutral-400">
                OG image URL
                <input
                  value={activePage.seo.ogImage ?? ""}
                  onChange={(event) =>
                    patchActive({
                      ...activePage,
                      seo: { ...activePage.seo, ogImage: event.target.value },
                    })
                  }
                  className="rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-white outline-none"
                />
              </label>
            </div>

            <label className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-sm text-white/85">
              <input
                type="checkbox"
                checked={Boolean(activePage.seo.noIndex)}
                onChange={(event) =>
                  patchActive({
                    ...activePage,
                    seo: { ...activePage.seo, noIndex: event.target.checked },
                  })
                }
              />
              NoIndex this page
            </label>

            {feedback ? (
              <p className="rounded-xl border border-brand-gold/30 bg-brand-gold/10 px-3 py-2 text-sm text-brand-gold">
                {feedback}
              </p>
            ) : null}

            <div className="flex justify-end">
              <button
                type="button"
                onClick={savePage}
                disabled={isPending}
                className="rounded-full border border-white/15 bg-white/5 px-4 py-2 text-sm text-white hover:bg-white/10 disabled:opacity-50"
              >
                {isPending ? "Saving..." : "Save SEO"}
              </button>
            </div>
          </div>
        ) : (
          <p className="text-sm text-white/60">No SEO page selected.</p>
        )}
      </section>
    </div>
  );
}
