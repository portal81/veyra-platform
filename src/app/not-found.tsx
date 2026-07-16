import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#0c0a09] p-6">
      <div className="w-full max-w-md rounded-[24px] border border-white/10 bg-[#1a1714] p-8 text-center shadow-[0_16px_60px_rgba(0,0,0,0.4)]">
        <p className="text-6xl font-bold text-[#f2c16b]">404</p>
        <h2 className="mt-4 font-serif text-2xl text-white">Page not found</h2>
        <p className="mt-3 text-sm text-white/60">
          The page you are looking for does not exist or has been moved.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Link
            href="/admin"
            className="rounded-full border border-[#f2c16b]/35 bg-[#f2c16b]/10 px-6 py-2.5 text-sm font-semibold text-[#f8d28b] transition hover:bg-[#f2c16b]/15"
          >
            Back to dashboard
          </Link>
          <Link
            href="/"
            className="rounded-full border border-white/10 bg-black/25 px-6 py-2.5 text-sm font-semibold text-white/72 transition hover:bg-white/[0.05]"
          >
            Visit homepage
          </Link>
        </div>
      </div>
    </div>
  );
}
