"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useAdminLocale } from "@/components/admin/admin-locale-provider";
import type { SiteSettings } from "@/lib/types";

const PUBLIC_SITE_URL = process.env.NEXT_PUBLIC_PUBLIC_SITE_URL ?? "https://veyra-platform.vercel.app";

type PreviewPage = "/" | "/projects" | "/finishing" | "/smart-home" | "/book";
type DeviceMode = "desktop" | "tablet" | "mobile";

export type PreviewFocusTarget = {
  page: PreviewPage;
  title: string;
  subtitle?: string;
  publicUrl?: string;
  targetId?: string;
};

const PREVIEW_PAGES: Array<{ id: PreviewPage; labelEn: string; labelAr: string }> = [
  { id: "/", labelEn: "Home", labelAr: "الرئيسية" },
  { id: "/projects", labelEn: "Projects", labelAr: "المشروعات" },
  { id: "/finishing", labelEn: "Finishing", labelAr: "التشطيب" },
  { id: "/smart-home", labelEn: "Smart Home", labelAr: "المنزل الذكي" },
  { id: "/book", labelEn: "Book", labelAr: "الحجز" },
];

const DEVICES: Array<{
  mode: DeviceMode;
  labelEn: string;
  labelAr: string;
  width: number;
  height: number;
}> = [
  { mode: "desktop", labelEn: "Desktop", labelAr: "سطح المكتب", width: 1440, height: 900 },
  { mode: "tablet", labelEn: "Tablet", labelAr: "تابلت", width: 768, height: 1024 },
  { mode: "mobile", labelEn: "Mobile", labelAr: "الجوال", width: 390, height: 844 },
];

const ZOOM_LEVELS = [50, 67, 75, 90, 100, 110, 125, 150] as const;

type LivePreviewPanelProps = {
  settings: SiteSettings;
  focusTarget?: PreviewFocusTarget | null;
  onClose: () => void;
};

export function LivePreviewPanel({ settings, focusTarget, onClose }: LivePreviewPanelProps) {
  const { locale, t } = useAdminLocale();
  const [activePage, setActivePage] = useState<PreviewPage>("/");
  const [deviceMode, setDeviceMode] = useState<DeviceMode>("desktop");
  const [zoom, setZoom] = useState<number>(75);
  const [fitToFrame, setFitToFrame] = useState(true);
  const [token, setToken] = useState<string | null>(null);
  const [iframeKey, setIframeKey] = useState(0);
  const [loading, setLoading] = useState(true);
  const [stageSize, setStageSize] = useState({ width: 900, height: 700 });
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const stageRef = useRef<HTMLDivElement | null>(null);

  const activeDevice = DEVICES.find((item) => item.mode === deviceMode) ?? DEVICES[0];
  const userScale = zoom / 100;
  const iframeSrc = useMemo(() => {
    if (!token) return null;
    const params = new URLSearchParams({ previewToken: token });
    if (focusTarget?.targetId) params.set("focus", focusTarget.targetId);
    return `${PUBLIC_SITE_URL}${activePage}?${params.toString()}`;
  }, [activePage, focusTarget?.targetId, token]);

  const publicPageUrl = useMemo(() => {
    const targetPath = focusTarget?.publicUrl ?? activePage;
    const params = new URLSearchParams();
    if (focusTarget?.targetId) params.set("focus", focusTarget.targetId);
    const query = params.toString();
    return `${PUBLIC_SITE_URL}${targetPath}${query ? `?${query}` : ""}`;
  }, [activePage, focusTarget?.publicUrl, focusTarget?.targetId]);

  const fitScale = useMemo(() => {
    const widthRatio = stageSize.width / activeDevice.width;
    const heightRatio = stageSize.height / activeDevice.height;
    return Math.min(1, widthRatio, heightRatio);
  }, [activeDevice.height, activeDevice.width, stageSize.height, stageSize.width]);

  const effectiveScale = (fitToFrame ? fitScale : 1) * userScale;
  const viewportWidth = Math.max(1, Math.ceil(activeDevice.width * effectiveScale));
  const viewportHeight = Math.max(1, Math.ceil(activeDevice.height * effectiveScale));
  const stageCanvasWidth = Math.max(viewportWidth + 24, stageSize.width);
  const stageCanvasHeight = Math.max(viewportHeight + 24, stageSize.height);

  useEffect(() => {
    if (!stageRef.current) return;

    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (!entry) return;
      setStageSize({
        width: Math.max(320, entry.contentRect.width - 32),
        height: Math.max(280, entry.contentRect.height - 32),
      });
    });

    observer.observe(stageRef.current);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    async function pushPreviewDraft(draftSettings: SiteSettings) {
      try {
        const res = await fetch("/api/admin/preview", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ settings: draftSettings }),
        });
        const data = (await res.json()) as { token?: string };
        if (data.token) {
          setToken(data.token);
          setIframeKey((value) => value + 1);
          setLoading(true);
        }
      } catch {
        // Keep current token on transient preview API errors.
      }
    }

    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      void pushPreviewDraft(settings);
    }, 600);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [settings]);

  useEffect(() => {
    if (!focusTarget) return;
    setActivePage(focusTarget.page);
    setIframeKey((value) => value + 1);
    setLoading(true);
  }, [focusTarget]);

  useEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;
    const raf = requestAnimationFrame(() => {
      stage.scrollTo({
        left: Math.max(0, (stage.scrollWidth - stage.clientWidth) / 2),
        top: 0,
        behavior: "auto",
      });
    });
    return () => cancelAnimationFrame(raf);
  }, [zoom, deviceMode, activePage, iframeKey, fitToFrame, stageCanvasWidth, stageCanvasHeight]);

  function cycleZoom(direction: 1 | -1) {
    const current = ZOOM_LEVELS.indexOf(zoom as (typeof ZOOM_LEVELS)[number]);
    const nextIndex = Math.max(0, Math.min(ZOOM_LEVELS.length - 1, current + direction));
    const next = ZOOM_LEVELS[nextIndex];
    if (next !== undefined) setZoom(next);
  }

  return (
    <div className="flex h-full min-h-0 flex-col bg-[#0c0a08]">
      <div className="flex shrink-0 flex-wrap items-center gap-2 border-b border-white/8 bg-[#111009]/90 px-3 py-2.5 backdrop-blur-sm">
        <div className="flex items-center gap-0.5 rounded-xl border border-white/10 bg-black/30 p-1">
          {PREVIEW_PAGES.map((page) => (
            <button
              key={page.id}
              type="button"
              onClick={() => {
                setActivePage(page.id);
                setIframeKey((value) => value + 1);
                setLoading(true);
              }}
              className={`rounded-lg px-3 py-1.5 text-xs font-medium transition ${
                activePage === page.id ? "bg-brand-gold/15 text-brand-gold" : "text-white/50 hover:text-white/80"
              }`}
            >
              {locale === "ar" ? page.labelAr : page.labelEn}
            </button>
          ))}
        </div>

        <div className="h-5 w-px bg-white/10" />

        <div className="flex items-center gap-0.5 rounded-xl border border-white/10 bg-black/30 p-1">
          {DEVICES.map((device) => (
            <button
              key={device.mode}
              type="button"
              onClick={() => setDeviceMode(device.mode)}
              className={`rounded-lg px-3 py-1.5 text-xs font-medium transition ${
                deviceMode === device.mode ? "bg-white/12 text-white" : "text-white/50 hover:text-white/80"
              }`}
            >
              {locale === "ar" ? device.labelAr : device.labelEn}
            </button>
          ))}
        </div>

        <div className="h-5 w-px bg-white/10" />

        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => cycleZoom(-1)}
            className="rounded-lg border border-white/10 px-2.5 py-1.5 text-xs text-white/60 hover:text-white"
          >
            -
          </button>
          <span className="min-w-[42px] text-center font-mono text-xs text-white/60">{zoom}%</span>
          <button
            type="button"
            onClick={() => cycleZoom(1)}
            className="rounded-lg border border-white/10 px-2.5 py-1.5 text-xs text-white/60 hover:text-white"
          >
            +
          </button>
        </div>

        <button
          type="button"
          onClick={() => setFitToFrame((current) => !current)}
          className={`rounded-lg border px-2.5 py-1.5 text-xs transition ${
            fitToFrame
              ? "border-brand-gold/45 bg-brand-gold/10 text-brand-gold"
              : "border-white/10 text-white/60 hover:text-white"
          }`}
        >
          {fitToFrame ? t("Fit: On", "احتواء: تشغيل") : t("Fit: Off", "احتواء: إيقاف")}
        </button>

        {focusTarget ? (
          <div className="flex items-center gap-2 rounded-xl border border-brand-gold/20 bg-brand-gold/8 px-3 py-1.5 text-xs text-white/80">
            <span className="text-brand-gold">{t("Editing", "أنت تعدّل")}</span>
            <span className="font-medium text-white">{focusTarget.title}</span>
            {focusTarget.subtitle ? <span className="text-white/45">- {focusTarget.subtitle}</span> : null}
          </div>
        ) : null}

        <a
          href={publicPageUrl}
          target="_blank"
          rel="noreferrer"
          className="rounded-lg border border-white/10 px-2.5 py-1.5 text-xs text-white/60 hover:text-white"
        >
          {t("Open on website", "افتح على الموقع")}
        </a>

        <button
          type="button"
          onClick={onClose}
          className="ms-auto rounded-lg border border-white/10 px-3 py-1.5 text-xs text-white/50 transition hover:border-red-500/30 hover:text-red-300"
        >
          {t("Close", "إغلاق")}
        </button>
      </div>

      <div className="flex shrink-0 items-center gap-4 border-b border-white/6 bg-[#0c0a08] px-4 py-1.5">
        <div className="flex items-center gap-2">
          {token ? (
            <>
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
              <span className="text-[10px] text-emerald-400/80">{t("Live", "مباشر")}</span>
            </>
          ) : (
            <>
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-amber-400" />
              <span className="text-[10px] text-amber-400/80">{t("Connecting...", "جارٍ الاتصال...")}</span>
            </>
          )}
        </div>
        <span className="text-[10px] text-white/30">
          {activeDevice.width}x{activeDevice.height} - {t("Preview", "معاينة")} {viewportWidth}x{viewportHeight}
        </span>
      </div>

      <div
        ref={stageRef}
        className="flex min-h-0 flex-1 items-start justify-center overflow-auto p-4"
        style={{ background: "radial-gradient(ellipse at center, #181410 0%, #0c0a08 70%)" }}
      >
        {iframeSrc ? (
          <div className="relative" style={{ width: stageCanvasWidth, height: stageCanvasHeight }}>
            <div
              className="absolute left-1/2 top-3 origin-top"
              style={{
                width: activeDevice.width,
                height: activeDevice.height,
                transform: `translateX(-50%) scale(${effectiveScale})`,
              }}
            >
              <div className="relative overflow-hidden rounded-xl border border-white/10 shadow-[0_35px_80px_rgba(0,0,0,0.55)]">
                {loading ? (
                  <div className="absolute inset-0 z-10 flex items-center justify-center bg-[#faf7f2]">
                    <div className="h-7 w-7 animate-spin rounded-full border-2 border-[#d4a44f]/40 border-t-[#d4a44f]" />
                  </div>
                ) : null}
                <iframe
                  key={iframeKey}
                  src={iframeSrc}
                  title="Site preview"
                  style={{
                    width: activeDevice.width,
                    height: activeDevice.height,
                    border: "none",
                    display: "block",
                  }}
                  onLoad={() => setLoading(false)}
                />
              </div>
            </div>
          </div>
        ) : (
          <div className="flex h-64 flex-col items-center justify-center gap-3 text-white/30">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-brand-gold/30 border-t-brand-gold" />
            <span className="text-sm">{t("Preparing preview...", "جارٍ تجهيز المعاينة...")}</span>
          </div>
        )}
      </div>
    </div>
  );
}
