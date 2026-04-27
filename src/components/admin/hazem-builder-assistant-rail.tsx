"use client";

import { useEffect, useMemo, useState } from "react";
import type { BuilderContext, HazemPromptRequest } from "@/components/admin/settings-builder";
import type { SiteSettings } from "@/lib/types";

type HazemBuilderAssistantRailProps = {
  context: BuilderContext | null;
  settings: SiteSettings;
  locale: string;
  requestedPrompt?: HazemPromptRequest | null;
};

type ChatMode = "admin" | "website";
type ChatMessage = {
  role: "user" | "assistant";
  content: string;
};

function t(locale: string, en: string, ar: string) {
  return locale === "ar" ? ar : en;
}

function workspaceLabel(locale: string, workspace: BuilderContext["workspace"]) {
  if (workspace === "foundation") return t(locale, "Website basics", "أساسيات الموقع");
  if (workspace === "operations") return t(locale, "Sales logic", "منطق المبيعات");
  return t(locale, "Pages content", "محتوى الصفحات");
}

function starterPrompts(locale: string, context: BuilderContext | null, mode: ChatMode) {
  const section = context?.sectionLabel ?? t(locale, "current section", "القسم الحالي");

  if (mode === "website") {
    return [
      t(locale, `Write a sharper sales CTA for ${section}.`, `اكتب CTA مبيعات أقوى لقسم ${section}.`),
      t(locale, `Suggest a shorter conversion-focused headline for ${section}.`, `اقترح عنوانًا أقصر وأكثر تحويلًا لقسم ${section}.`),
      t(locale, `What information is missing in ${section} before publishing?`, `إيه المعلومات الناقصة في قسم ${section} قبل النشر؟`),
    ];
  }

  return [
    t(locale, `Review ${section} and give me P1/P2/P3 improvements.`, `راجع قسم ${section} واديني تحسينات P1/P2/P3.`),
    t(locale, `What is the biggest UX risk in ${section}?`, `إيه أكبر مخاطرة UX في قسم ${section}؟`),
    t(locale, `How can this section convert better without adding clutter?`, `إزاي القسم ده يحول أفضل من غير ما نزود زحمة؟`),
  ];
}

function buildContextEnvelope(locale: string, context: BuilderContext | null) {
  if (!context) {
    return t(
      locale,
      "Builder context: no section selected yet. Respond generally and guide the admin to choose a page section first.",
      "سياق البيلدر: لا يوجد قسم مختار الآن. رد بشكل عام ووجّه الأدمن لاختيار قسم من الصفحة أولًا.",
    );
  }

  return [
    t(locale, "Builder context:", "سياق البيلدر:"),
    `${t(locale, "Workspace", "مساحة العمل")}: ${workspaceLabel(locale, context.workspace)}`,
    `${t(locale, "Section", "القسم")}: ${context.sectionLabel}`,
    `${t(locale, "Description", "الوصف")}: ${context.sectionDescription}`,
    t(
      locale,
      "Answer based on this exact builder context and keep recommendations practical for the current task.",
      "ابنِ ردك على هذا السياق الحالي داخل البيلدر وخلي التوصيات عملية للمهمة الحالية.",
    ),
  ].join("\n");
}

function scopeLabel(locale: string, scope?: "shared" | "local") {
  if (scope === "shared") return t(locale, "Shared across pages", "مشترك بين الصفحات");
  if (scope === "local") return t(locale, "Specific to this page", "خاص بهذه الصفحة");
  return t(locale, "General builder context", "سياق عام داخل البيلدر");
}

export function HazemBuilderAssistantRail({
  context,
  settings,
  locale,
  requestedPrompt,
}: HazemBuilderAssistantRailProps) {
  const [mode, setMode] = useState<ChatMode>("admin");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState<ChatMessage[]>([]);
  const [requestMeta, setRequestMeta] = useState<HazemPromptRequest | null>(null);
  const hasApiKey = Boolean(settings.hazemAi.apiKey?.trim());

  useEffect(() => {
    setHistory([
      {
        role: "assistant",
        content:
          mode === "admin"
            ? t(
                locale,
                "I am Hazem beside the builder. I can review this section, suggest UX/content improvements, and tell you what to fix next.",
                "أنا حازم جنب البيلدر. أقدر أراجع القسم الحالي، وأقترح تحسينات UX ومحتوى، وأقولك تصلح إيه بعد كده.",
              )
            : t(
                locale,
                "I am Hazem in sales-copy mode. I can rewrite this section for conversion, stronger CTAs, and clearer visitor messaging.",
                "أنا حازم في وضع كتابة المبيعات. أقدر أعيد صياغة القسم الحالي للتحويل وCTAs أقوى ورسائل أوضح للزائر.",
              ),
      },
    ]);
  }, [locale, mode]);

  const prompts = useMemo(() => starterPrompts(locale, context, mode), [context, locale, mode]);

  async function sendMessage(nextMessage?: string, forcedMode?: ChatMode) {
    const content = (nextMessage ?? message).trim();
    if (!content || loading) return;
    const activeMode = forcedMode ?? mode;

    const requestMetaEnvelope = requestMeta
      ? [
          t(locale, "Prompt context:", "سياق الطلب:"),
          requestMeta.pageTitle ? `${t(locale, "Page", "الصفحة")}: ${requestMeta.pageTitle}` : null,
          requestMeta.sourceLabel ? `${t(locale, "Focus", "نقطة التركيز")}: ${requestMeta.sourceLabel}` : null,
          requestMeta.targetId ? `${t(locale, "Preview target", "هدف المعاينة")}: ${requestMeta.targetId}` : null,
          `${t(locale, "Scope", "النطاق")}: ${scopeLabel(locale, requestMeta.scope)}`,
        ]
          .filter(Boolean)
          .join("\n")
      : "";
    const contextualMessage = [buildContextEnvelope(locale, context), requestMetaEnvelope, content].filter(Boolean).join("\n\n");
    const nextHistory = [...history, { role: "user" as const, content }];
    setHistory(nextHistory);
    setMessage("");
    setLoading(true);

    try {
      const response = await fetch("/api/admin/hazem/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode: activeMode,
          message: contextualMessage,
          history: nextHistory.slice(-10),
          hazemAi: settings.hazemAi,
        }),
      });
      const data = (await response.json()) as { reply?: string; message?: string; warning?: string };
      const reply =
        data.reply ??
        data.message ??
        t(locale, "Hazem could not respond right now.", "حازم لم يتمكن من الرد الآن.");
      setHistory((current) => [...current, { role: "assistant", content: reply }]);
    } catch {
      setHistory((current) => [
        ...current,
        {
          role: "assistant",
          content: t(
            locale,
            "A technical issue happened while contacting Hazem.",
            "حصلت مشكلة تقنية أثناء التواصل مع حازم.",
          ),
        },
      ]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!requestedPrompt) return;
    setMode(requestedPrompt.mode);
    setRequestMeta(requestedPrompt);
    void sendMessage(requestedPrompt.prompt, requestedPrompt.mode);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [requestedPrompt?.id]);

  return (
    <aside className="sticky top-24 grid gap-4 rounded-[28px] border border-white/10 bg-[#0c0a09] p-4 shadow-[0_24px_48px_rgba(0,0,0,0.25)]">
      <div className="rounded-[22px] border border-white/10 bg-white/[0.04] p-4">
        <p className="text-[11px] uppercase tracking-[0.24em] text-[#f2c16b]">
          {t(locale, "Hazem assistant", "مساعد حازم")}
        </p>
        <h3 className="mt-3 font-serif text-2xl text-white">
          {t(locale, "Context-aware while you build", "يفهم السياق أثناء التعديل")}
        </h3>
        <p className="mt-3 text-sm leading-7 text-white/62">
          {context
            ? t(
                locale,
                `Now focused on ${context.sectionLabel}. Hazem will answer based on this exact section.`,
                `أنت الآن داخل ${context.sectionLabel}. حازم سيرد بناءً على هذا القسم نفسه.`,
              )
            : t(
                locale,
                "Choose a section in the builder and Hazem will follow you there automatically.",
                "اختَر قسمًا داخل البيلدر وحازم سيتحرك معك إليه تلقائيًا.",
              )}
        </p>
      </div>

      <div className="grid gap-3 rounded-[22px] border border-white/10 bg-black/20 p-4">
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setMode("admin")}
            className={`rounded-full px-3 py-2 text-xs transition ${
              mode === "admin" ? "bg-[#f2c16b] text-[#1b140c]" : "border border-white/12 bg-black/30 text-white/72"
            }`}
          >
            {t(locale, "Admin advisor", "مستشار الأدمن")}
          </button>
          <button
            type="button"
            onClick={() => setMode("website")}
            className={`rounded-full px-3 py-2 text-xs transition ${
              mode === "website" ? "bg-[#f2c16b] text-[#1b140c]" : "border border-white/12 bg-black/30 text-white/72"
            }`}
          >
            {t(locale, "Sales copy", "كتابة المبيعات")}
          </button>
        </div>

        <div className="grid gap-2 rounded-2xl border border-white/10 bg-black/25 p-3 text-sm text-white/75">
          <div>
            <span className="text-white/45">{t(locale, "Workspace", "مساحة العمل")}:</span>{" "}
            {context ? workspaceLabel(locale, context.workspace) : t(locale, "Not selected yet", "لم يتم الاختيار بعد")}
          </div>
          <div>
            <span className="text-white/45">{t(locale, "Section", "القسم")}:</span>{" "}
            {context?.sectionLabel ?? t(locale, "No section", "لا يوجد قسم")}
          </div>
          <div>
            <span className="text-white/45">{t(locale, "API status", "حالة الربط")}:</span>{" "}
            {hasApiKey
              ? t(locale, "Connected from settings", "متصل من الإعدادات")
              : t(locale, "Using server/runtime fallback if available", "يعتمد على مفتاح السيرفر إذا كان متاحًا")}
          </div>
          {requestMeta ? (
            <>
              <div>
                <span className="text-white/45">{t(locale, "Page", "الصفحة")}:</span>{" "}
                {requestMeta.pageTitle ?? t(locale, "Current page", "الصفحة الحالية")}
              </div>
              <div>
                <span className="text-white/45">{t(locale, "Preview target", "هدف المعاينة")}:</span>{" "}
                {requestMeta.targetId ?? t(locale, "No direct target", "لا يوجد هدف مباشر")}
              </div>
              <div>
                <span className="text-white/45">{t(locale, "Scope", "النطاق")}:</span>{" "}
                {scopeLabel(locale, requestMeta.scope)}
              </div>
            </>
          ) : null}
        </div>
      </div>

      <div className="grid gap-3 rounded-[22px] border border-white/10 bg-black/20 p-4">
        <p className="text-[11px] uppercase tracking-[0.18em] text-[#f2c16b]">
          {t(locale, "Suggested prompts", "اقتراحات جاهزة")}
        </p>
        <div className="flex flex-wrap gap-2">
          {prompts.map((prompt) => (
            <button
              key={prompt}
              type="button"
              onClick={() => void sendMessage(prompt)}
              className="rounded-full border border-white/12 bg-black/30 px-3 py-2 text-xs text-white/75 transition hover:bg-white/10"
            >
              {prompt}
            </button>
          ))}
        </div>
      </div>

      <div className="grid gap-3 rounded-[22px] border border-white/10 bg-black/20 p-4">
        <div className="max-h-[320px] overflow-y-auto rounded-2xl border border-white/10 bg-black/25 p-3">
          <div className="grid gap-2">
            {history.map((item, index) => (
              <div
                key={`${item.role}-${index}`}
                className={`max-w-[94%] rounded-2xl border px-4 py-3 text-sm leading-7 ${
                  item.role === "assistant"
                    ? "justify-self-start border-white/10 bg-black/35 text-white/90"
                    : "justify-self-end border-[#f2c16b]/30 bg-[#f2c16b]/10 text-[#f6ddb1]"
                }`}
              >
                {item.content}
              </div>
            ))}
          </div>
        </div>

        <textarea
          value={message}
          onChange={(event) => setMessage(event.target.value)}
          rows={4}
          className="rounded-2xl border border-white/10 bg-black/25 px-4 py-3 text-sm text-white outline-none placeholder:text-white/30"
          placeholder={t(
            locale,
            "Ask Hazem about this section, its CTA, content gaps, or UX problems...",
            "اسأل حازم عن هذا القسم، أو الـ CTA، أو النواقص، أو مشاكل الـ UX...",
          )}
        />
        <button
          type="button"
          onClick={() => void sendMessage()}
          disabled={loading || !message.trim()}
          className="rounded-2xl bg-gradient-to-r from-[#f2c16b] to-[#c68f43] px-4 py-3 text-sm font-semibold text-[#20160f] transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? t(locale, "Hazem is thinking...", "حازم بيفكر الآن...") : t(locale, "Send to Hazem", "أرسل إلى حازم")}
        </button>
      </div>
    </aside>
  );
}
