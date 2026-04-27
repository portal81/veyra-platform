"use client";

import { useState, useTransition } from "react";

type LeadFormProps = {
  defaultService?: "Project Visit" | "Finishing Quote" | "Smart Home Setup";
};

export function LeadForm({ defaultService = "Project Visit" }: LeadFormProps) {
  const [message, setMessage] = useState("");
  const [success, setSuccess] = useState(false);
  const [isPending, startTransition] = useTransition();

  if (success) {
    return (
      <div
        data-preview-id="lead-form"
        className="flex flex-col items-center justify-center gap-5 rounded-[28px] border border-emerald-400/20 bg-[#171210]/90 p-10 text-center shadow-2xl shadow-black/20"
      >
        {/* Animated checkmark */}
        <div className="flex h-16 w-16 items-center justify-center rounded-full border-2 border-emerald-400/40 bg-emerald-500/10">
          <svg className="h-8 w-8 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" className="[stroke-dasharray:30] [stroke-dashoffset:0] animate-[drawCheck_0.4s_ease-out_0.2s_both]" />
          </svg>
        </div>

        <div>
          <h3 className="text-xl font-semibold text-white">Request Received!</h3>
          <p className="mt-2 text-sm leading-7 text-white/60">
            Thank you for your interest. Our team will reach out to you within 24 hours.
          </p>
        </div>

        <button
          type="button"
          onClick={() => { setSuccess(false); setMessage(""); }}
          className="mt-2 rounded-full border border-white/15 px-5 py-2.5 text-sm font-medium text-white/70 transition hover:border-[#f2c16b]/40 hover:text-white"
        >
          Send Another Request
        </button>
      </div>
    );
  }

  return (
    <form data-preview-id="lead-form"
      className="grid gap-4 rounded-[28px] border border-white/10 bg-[#171210]/90 p-6 shadow-2xl shadow-black/20 md:grid-cols-2"
      onSubmit={(event) => {
        event.preventDefault();
        const form = event.currentTarget;
        const formData = new FormData(form);

        startTransition(async () => {
          const response = await fetch("/api/leads", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(Object.fromEntries(formData.entries())),
          });

          const data = (await response.json()) as { message: string };
          if (response.ok) {
            form.reset();
            setSuccess(true);
          } else {
            setMessage(data.message);
          }
        });
      }}
    >
      <label className="grid gap-2 text-sm text-white/75">
        Full Name
        <input
          className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-white outline-none transition focus:border-[#f2c16b]/40"
          name="fullName"
          placeholder="Your name"
          required
        />
      </label>

      <label className="grid gap-2 text-sm text-white/75">
        Phone Number
        <input
          className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-white outline-none transition focus:border-[#f2c16b]/40"
          name="phone"
          placeholder="+20 10X XXX XXXX"
          required
        />
      </label>

      <label className="grid gap-2 text-sm text-white/75">
        Email Address
        <input
          className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-white outline-none transition focus:border-[#f2c16b]/40"
          name="email"
          placeholder="name@example.com"
          type="email"
        />
      </label>

      <label className="grid gap-2 text-sm text-white/75">
        Requested Service
        <select
          className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-white outline-none transition focus:border-[#f2c16b]/40"
          name="service"
          defaultValue={defaultService}
        >
          <option value="Project Visit">Project Visit</option>
          <option value="Finishing Quote">Finishing Quote</option>
          <option value="Smart Home Setup">Smart Home Setup</option>
        </select>
      </label>

      <label className="grid gap-2 text-sm text-white/75 md:col-span-2">
        Project Brief
        <textarea
          className="min-h-32 rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-white outline-none transition focus:border-[#f2c16b]/40"
          name="message"
          placeholder="Tell us what you need"
        />
      </label>

      <button
        className="rounded-full bg-gradient-to-r from-[#f2c16b] to-[#c68f43] px-5 py-3 font-semibold text-[#1e150d] transition hover:opacity-95 disabled:opacity-60 md:col-span-2"
        type="submit"
        disabled={isPending}
      >
        {isPending ? "Sending..." : "Send Request"}
      </button>

      {message && (
        <p className="text-sm text-red-400 md:col-span-2">{message}</p>
      )}
    </form>
  );
}

