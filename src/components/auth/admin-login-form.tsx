"use client";

import { useSearchParams } from "next/navigation";
import { useMemo, useState, useTransition } from "react";
import { useAdminLocale } from "@/components/admin/admin-locale-provider";

export function AdminLoginForm({ devMode = false }: { devMode?: boolean }) {
  const { t } = useAdminLocale();
  const searchParams = useSearchParams();
  const next = searchParams.get("next");
  const invite = searchParams.get("invite");
  const invitedEmail = searchParams.get("email") || "";
  const devParam = searchParams.get("dev");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [isPending, startTransition] = useTransition();
  const [devResult, setDevResult] = useState<"idle" | "checking" | "available" | "unavailable">("idle");

  const effectiveEmail = useMemo(() => email || invitedEmail, [email, invitedEmail]);

  // Check dev mode availability on mount
  useMemo(() => {
    if (devMode) {
      setDevResult("available");
    } else if (devParam === "1" || devParam === "true") {
      setDevResult("checking");
      fetch("/api/auth/dev-login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier: "check" }),
      })
        .then((res) => setDevResult(res.ok ? "available" : "unavailable"))
        .catch(() => setDevResult("unavailable"));
    }
  }, [devParam]);

  function submit() {
    startTransition(async () => {
      setMessage("");
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: effectiveEmail, password }),
      });

      const json = (await response.json()) as { message?: string; redirectTo?: string };
      if (!response.ok) {
        setMessage(json.message ?? t("Could not sign in.", "تعذر تسجيل الدخول."));
        return;
      }

      window.location.href = next || json.redirectTo || "/admin";
    });
  }

  function devLogin(name: string) {
    startTransition(async () => {
      setMessage("");
      const response = await fetch("/api/auth/dev-login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier: name }),
      });

      const json = (await response.json()) as { message?: string; redirectTo?: string };
      if (!response.ok) {
        setMessage(json.message ?? "Dev login failed.");
        return;
      }

      window.location.href = next || json.redirectTo || "/admin";
    });
  }

  return (
    <section className="rounded-[36px] border border-white/10 bg-[radial-gradient(circle_at_top_right,rgba(242,193,107,0.14),transparent_24%),linear-gradient(180deg,rgba(255,255,255,0.05),rgba(255,255,255,0.02))] p-6 shadow-[0_30px_80px_rgba(0,0,0,0.24)] md:p-8">
      <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[#f2c16b]">
        {t("Admin sign-in", "دخول الإدارة")}
      </p>
      <h1 className="mt-3 font-serif text-4xl leading-tight text-white md:text-5xl">
        {t("Access the Veyra control hub", "ادخل إلى مركز تحكم فيرا")}
      </h1>
      <p className="mt-4 max-w-2xl text-base leading-8 text-white/68">
        {t(
          "Sign in with your admin email and password. Owner and invited team members enter through the same secure admin flow.",
          "سجل الدخول ببريد الإدارة وكلمة المرور. المالك وأعضاء الفريق المدعوون يدخلون من خلال نفس المسار الآمن.",
        )}
      </p>
      {invite ? (
        <div className="mt-5 rounded-[22px] border border-[#f2c16b]/25 bg-[#f2c16b]/10 px-4 py-3 text-sm leading-7 text-white/80">
          {t(
            "This sign-in came from an invitation. Continue with the invited team email to enter the correct workspace.",
            "هذا الدخول جاء من دعوة. أكمل باستخدام بريد الفريق المدعو للدخول إلى مساحة العمل الصحيحة.",
          )}
        </div>
      ) : null}

      <div className="mt-8 grid gap-4">
        <label className="grid gap-2 text-xs uppercase tracking-[0.18em] text-white/40">
          {t("Email", "البريد الإلكتروني")}
          <input
            value={effectiveEmail}
            onChange={(event) => setEmail(event.target.value)}
            type="email"
            className="rounded-2xl border border-white/10 bg-[#151211] px-4 py-3 text-sm normal-case tracking-normal text-white outline-none"
            placeholder={t("name@veyra.com", "name@veyra.com")}
          />
        </label>

        <label className="grid gap-2 text-xs uppercase tracking-[0.18em] text-white/40">
          {t("Password", "كلمة المرور")}
          <input
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            type="password"
            className="rounded-2xl border border-white/10 bg-[#151211] px-4 py-3 text-sm normal-case tracking-normal text-white outline-none"
            placeholder={t("Enter your password", "أدخل كلمة المرور")}
          />
        </label>

        <button
          type="button"
          onClick={submit}
          disabled={!effectiveEmail || !password}
          className="rounded-full bg-gradient-to-r from-[#f2c16b] to-[#c68f43] px-5 py-3 font-semibold text-[#1d140d] disabled:cursor-not-allowed disabled:opacity-40"
        >
          {isPending ? t("Signing in...", "جارٍ تسجيل الدخول...") : t("Sign in", "تسجيل الدخول")}
        </button>

        {message ? <p className="text-sm text-[#f2c16b]">{message}</p> : null}
      </div>

      {/* ── Dev Mode Quick Access ── */}
      {devResult === "available" ? (
        <div className="mt-6 rounded-[22px] border border-dashed border-white/10 bg-black/20 p-4">
          <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-neutral-500">
            {t("Dev Access", "دخول المطور")}
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => devLogin("Spez")}
              disabled={isPending}
              className="rounded-full border border-[#f2c16b]/30 bg-[#f2c16b]/8 px-4 py-2 text-sm font-semibold text-[#f2c16b] transition hover:bg-[#f2c16b]/15 disabled:opacity-40"
            >
              {t("Enter as Spez", "دخول كـ Spez")}
            </button>
            <button
              type="button"
              onClick={() => devLogin("Mariam")}
              disabled={isPending}
              className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-white/70 transition hover:bg-white/10 disabled:opacity-40"
            >
              {t("Enter as Mariam", "دخول كـ Mariam")}
            </button>
            <button
              type="button"
              onClick={() => devLogin("Karim")}
              disabled={isPending}
              className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-white/70 transition hover:bg-white/10 disabled:opacity-40"
            >
              {t("Enter as Karim", "دخول كـ Karim")}
            </button>
            <button
              type="button"
              onClick={() => devLogin("Omar")}
              disabled={isPending}
              className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-white/70 transition hover:bg-white/10 disabled:opacity-40"
            >
              {t("Enter as Omar", "دخول كـ Omar")}
            </button>
          </div>
        </div>
      ) : null}
    </section>
  );
}
