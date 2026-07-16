"use client";

import { useState } from "react";
import { HazemBuilderAssistantRail } from "@/components/admin/hazem-builder-assistant-rail";
import { LivePreviewPanel } from "@/components/admin/live-preview-panel";
import { SettingsBuilder } from "@/components/admin/settings-builder";
import type { BuilderContext, HazemPromptRequest } from "@/components/admin/settings-builder";
import type { PreviewFocusTarget } from "@/components/admin/live-preview-panel";
import type { SiteSettings } from "@/lib/types";

type SettingsPageClientProps = {
  initialSettings: SiteSettings;
  locale: string;
};

export function SettingsPageClient({ initialSettings, locale }: SettingsPageClientProps) {
  const [showPreview, setShowPreview] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [hazemOpen, setHazemOpen] = useState(true);
  const [liveSettings, setLiveSettings] = useState<SiteSettings>(initialSettings);
  const [previewFocus, setPreviewFocus] = useState<PreviewFocusTarget | null>(null);
  const [builderContext, setBuilderContext] = useState<BuilderContext | null>(null);
  const [hazemPromptRequest, setHazemPromptRequest] = useState<HazemPromptRequest | null>(null);
  const isAr = locale === "ar";

  const handleHazemRequest = (request: HazemPromptRequest) => {
    setHazemOpen(true);
    setHazemPromptRequest(request);
  };

  if (showPreview) {
    return (
      <div className="fixed inset-0 z-50 flex bg-[#0c0a08]">
        <div
          className={`flex flex-col overflow-hidden border-e border-white/8 bg-[#0e0b09] transition-all duration-300 ${
            collapsed
              ? "w-0 min-w-0"
              : "w-[46%] min-w-[520px] max-w-[760px] max-lg:min-w-[420px] max-md:w-full max-md:min-w-0 max-md:max-w-none"
          }`}
        >
          <div className="flex shrink-0 items-center gap-3 border-b border-white/8 bg-[#111009] px-4 py-3">
            <div className="flex items-center gap-2">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-50" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
              </span>
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-widest text-brand-gold">
                  {isAr ? "وضع التحرير المباشر" : "Live Edit Mode"}
                </p>
                <p className="text-[10px] text-white/36">
                  {isAr ? "التغييرات تظهر فورًا - لم تُحفظ بعد" : "Changes preview instantly - not saved yet"}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setShowPreview(false)}
              className="ms-auto rounded-lg border border-white/10 px-3 py-1.5 text-[11px] text-white/44 transition hover:border-red-500/30 hover:text-red-300"
            >
              {isAr ? "خروج" : "Exit"}
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-4">
            <SettingsBuilder
              initialSettings={initialSettings}
              onSettingsChange={setLiveSettings}
              onContextChange={setBuilderContext}
              onAskHazem={handleHazemRequest}
            />
          </div>
        </div>

        <button
          type="button"
          onClick={() => setCollapsed((value) => !value)}
          className="relative z-10 flex w-5 shrink-0 items-center justify-center border-e border-white/8 bg-[#111009] text-white/30 transition hover:bg-white/5 hover:text-white/60"
          title={collapsed ? (isAr ? "إظهار المحرر" : "Show editor") : (isAr ? "إخفاء المحرر" : "Hide editor")}
        >
          <span className="text-[10px]">{collapsed ? ">" : "<"}</span>
        </button>

        <div className="min-w-0 flex-1 overflow-hidden">
          <LivePreviewPanel settings={liveSettings} focusTarget={previewFocus} onClose={() => setShowPreview(false)} />
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-5 flex items-center justify-end">
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => setHazemOpen((value) => !value)}
            className="inline-flex items-center gap-2 rounded-[16px] border border-white/10 bg-white/[0.03] px-4 py-3 text-sm font-medium text-white/76 transition hover:border-white/20 hover:bg-white/[0.06]"
          >
            <span className="h-2 w-2 rounded-full bg-brand-gold" />
            <span>{hazemOpen ? (isAr ? "إخفاء حازم" : "Hide Hazem") : (isAr ? "افتح حازم" : "Open Hazem")}</span>
          </button>

          <button
            type="button"
            onClick={() => setShowPreview(true)}
            className="group inline-flex items-center gap-3 rounded-[16px] border border-brand-gold/25 bg-gradient-to-r from-brand-gold/8 to-brand-gold-dark/5 px-5 py-3 text-sm font-medium text-brand-gold shadow-[0_0_32px_rgba(242,193,107,0.06)] transition hover:border-brand-gold/50 hover:shadow-[0_0_48px_rgba(242,193,107,0.12)]"
          >
            <span className="relative flex h-2.5 w-2.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-brand-gold opacity-50" />
              <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-brand-gold" />
            </span>
            <span>{isAr ? "المعاينة الحية" : "Live Preview"}</span>
            <span className="rounded-full border border-brand-gold/20 bg-brand-gold/8 px-2 py-0.5 text-[10px] uppercase tracking-widest">
              {isAr ? "جديد" : "New"}
            </span>
          </button>
        </div>
      </div>

      <div className={`grid gap-6 xl:items-start ${hazemOpen ? "xl:grid-cols-[minmax(0,1fr)_360px]" : "xl:grid-cols-[minmax(0,1fr)_56px]"}`}>
        <div className="overflow-hidden rounded-2xl border border-neutral-800/60 bg-[#0c0a09] backdrop-blur-3xl">
          <SettingsBuilder
            initialSettings={initialSettings}
            onSettingsChange={setLiveSettings}
            onContextChange={setBuilderContext}
            onAskHazem={handleHazemRequest}
            onPreviewFocus={(focus) => {
              setPreviewFocus(focus);
              setShowPreview(true);
            }}
          />
        </div>

        {hazemOpen ? (
          <HazemBuilderAssistantRail context={builderContext} settings={liveSettings} locale={locale} requestedPrompt={hazemPromptRequest} />
        ) : (
          <button
            type="button"
            onClick={() => setHazemOpen(true)}
            className="sticky top-24 flex min-h-[260px] items-center justify-center rounded-2xl border border-white/10 bg-[#0c0a09] px-3 text-xs font-semibold tracking-[0.18em] text-brand-gold [writing-mode:vertical-rl]"
          >
            {isAr ? "افتح حازم" : "Open Hazem"}
          </button>
        )}
      </div>
    </div>
  );
}
