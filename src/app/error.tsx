"use client";

import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[Veyra] Uncaught error:", error);
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#0c0a09] p-6">
      <div className="w-full max-w-md rounded-[24px] border border-white/10 bg-[#1a1714] p-8 text-center shadow-[0_16px_60px_rgba(0,0,0,0.4)]">
        <div className="mx-auto mb-6 flex h-14 w-14 items-center justify-center rounded-full bg-red-500/10 text-red-400">
          <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
        </div>
        <h2 className="font-serif text-2xl text-white">Something went wrong</h2>
        <p className="mt-3 text-sm text-white/60">
          An unexpected error occurred. You can try again or return to the dashboard.
        </p>
        {error.digest && (
          <p className="mt-2 text-xs text-white/30">Error ID: {error.digest}</p>
        )}
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <button
            type="button"
            onClick={reset}
            className="rounded-full border border-[#f2c16b]/35 bg-[#f2c16b]/10 px-6 py-2.5 text-sm font-semibold text-[#f8d28b] transition hover:bg-[#f2c16b]/15"
          >
            Try again
          </button>
          <a
            href="/admin"
            className="rounded-full border border-white/10 bg-black/25 px-6 py-2.5 text-sm font-semibold text-white/72 transition hover:bg-white/[0.05]"
          >
            Back to dashboard
          </a>
        </div>
      </div>
    </div>
  );
}
