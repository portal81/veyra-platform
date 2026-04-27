"use client";

import { useEffect, useState } from "react";
import { BuilderSection } from "@/components/admin/builder-kit";
import { Field, MiniSection } from "./shared-builder-ui";
import type { SiteSettings } from "@/lib/types";

const RECOMMENDED_WEBSITE_PROMPT = `Role: Hazem - Veyra public sales assistant.
Mission: Convert visitors into qualified leads and booked visits.
Language: Egyptian Arabic by default, unless visitor asks for English.
Data policy: Use only Veyra runtime data (projects, prices, locations, installments, services). Never invent facts.
Behavior:
- Keep replies warm, practical, and direct.
- Ask one qualification question at a time.
- Suggest max 3 options.
- Include one clear CTA every reply (Book Visit / WhatsApp / Call).
- If user asks contact number, provide it immediately when available.
Format:
- 3 to 8 lines max.
- End with one precise next step question.`;

const RECOMMENDED_ADMIN_PROMPT = `Role: Hazem Admin - strategic advisor for Veyra owner/admin.
Focus: real-estate operations, CRM performance, marketing growth, SEO, website UX, technical execution.
Language: Egyptian Arabic by default.
Data policy: Use only Veyra internal context and saved settings.
Answer structure (always):
1) Quick diagnosis
2) P1/P2/P3 action plan
3) KPI + expected impact
4) Key risk + mitigation
5) First action to execute now
Style:
- Expert and practical, not generic.
- Give enough depth for execution.
- Avoid repeating same sentence patterns across turns.`;

const RECOMMENDED_ANALYSIS_PROMPT = `Analyze each conversation for:
- intent
- qualification completeness
- conversion readiness
- blocker reason
Return concise operational summary for management.`;

const RECOMMENDED_CLASSIFICATION_PROMPT = `Classify conversation by:
- intent (buy / finishing / smart-home / support / unknown)
- pipeline stage (new/contacted/qualified/visit/won/lost)
- lead quality (high/medium/low)
- next best action`;

const RECOMMENDED_QUALITY_PROMPT = `Score response quality from 1-10 on:
- factual accuracy
- Egyptian Arabic naturalness
- conversion clarity
- objection handling
- structure and usefulness
Return score + short reason.`;

const RECOMMENDED_RECOMMENDATIONS_PROMPT = `Generate weekly recommendations for:
- sales script optimization
- objection handling
- website content gaps
- CRM follow-up discipline
- funnel bottlenecks
Each recommendation must include priority, owner, KPI, and expected impact.`;

const ADMIN_STARTERS = [
  "حلل أداء الـ CRM الحالي واديني خطة P1/P2/P3.",
  "قولّي أول 3 تحسينات ترفع التحويل في الموقع العام.",
  "راجع الـ SEO الحالي واقترح أسرع فرص نمو.",
  "إيه أخطر bottlenecks في رحلة العميل من lead إلى visit؟",
];

const WEBSITE_STARTERS = [
  "بدور على شقة في الزقازيق.",
  "عاوز أعرف أنظمة التقسيط المتاحة.",
  "محتاج تشطيب لشقة 180 متر.",
  "عاوز رقم التواصل مع الشركة.",
];

type Props = {
  settings: SiteSettings;
  mutateSettings: (recipe: (draft: SiteSettings) => void) => void;
  ui: (en: string, ar?: string) => string;
  t: (en: string, ar: string) => string;
  onSaveSettings: () => void | Promise<void>;
  isSavingSettings?: boolean;
};

export function HazemAIModule({
  settings,
  mutateSettings,
  ui,
  t,
  onSaveSettings,
  isSavingSettings = false,
}: Props) {
  const [hazemChatMessage, setHazemChatMessage] = useState("");
  const [hazemChatMode, setHazemChatMode] = useState<"admin" | "website">("admin");
  const [hazemChatHistory, setHazemChatHistory] = useState<Array<{ role: "user" | "assistant"; content: string }>>([
    {
      role: "assistant",
      content: t(
        "I am Hazem, your admin advisor. Ask me about CRM, sales, SEO, UX, or technical execution.",
        "أنا حازم مستشارك في الأدمن. اسألني عن CRM والمبيعات وSEO وتجربة المستخدم والتنفيذ التقني.",
      ),
    },
  ]);
  const [hazemTestLoading, setHazemTestLoading] = useState(false);
  const [saveAndTestLoading, setSaveAndTestLoading] = useState(false);
  const [hasServerApiKey, setHasServerApiKey] = useState(false);

  const hasSavedApiKey = Boolean(settings.hazemAi.apiKey?.trim());
  const hasApiKey = hasSavedApiKey || hasServerApiKey;
  const hasWebsitePrompt = Boolean(settings.hazemAi.systemPrompts.website?.trim());
  const hasAdminPrompt = Boolean(settings.hazemAi.systemPrompts.admin?.trim());
  const hasContactNumber = settings.hazemAi.analysis.autoInsights.some((line) =>
    /(?:\+?\d[\d\s\-()]{7,}\d)/.test(line),
  );

  const runtimeStatus = !settings.hazemAi.enabled
    ? t("Disabled", "متوقف")
    : hasApiKey && hasWebsitePrompt && hasAdminPrompt
      ? t("Configured", "جاهز")
      : t("Missing required setup", "ناقص إعدادات أساسية");

  const readinessItems = [
    { ok: settings.hazemAi.enabled, label: t("Assistant is enabled", "حازم متفعل") },
    { ok: hasApiKey, label: t("Provider API key is available", "مفتاح المزوّد متاح") },
    { ok: hasWebsitePrompt, label: t("Website persona prompt is ready", "برومبت شخصية الموقع جاهز") },
    { ok: hasAdminPrompt, label: t("Admin persona prompt is ready", "برومبت شخصية الأدمن جاهز") },
    { ok: hasContactNumber, label: t("Contact number is available for public replies", "رقم التواصل متاح للردود العامة") },
    { ok: settings.hazemAi.analysis.enabled, label: t("Analysis engine is enabled", "محرك التحليل متفعل") },
  ];

  const recommendedActions = readinessItems.filter((item) => !item.ok).map((item) => item.label);
  const starterScenarios = hazemChatMode === "admin" ? ADMIN_STARTERS : WEBSITE_STARTERS;

  useEffect(() => {
    let active = true;
    const loadStatus = async () => {
      try {
        const res = await fetch("/api/admin/hazem/status", { cache: "no-store" });
        const data = (await res.json()) as { hasServerApiKey?: boolean };
        if (!active) return;
        setHasServerApiKey(Boolean(data.hasServerApiKey));
      } catch {
        if (!active) return;
        setHasServerApiKey(false);
      }
    };
    void loadStatus();
    return () => {
      active = false;
    };
  }, []);

  async function runHazemTest() {
    if (!hazemChatMessage.trim()) return;
    const nextUserMessage = hazemChatMessage.trim();
    const nextHistory = [...hazemChatHistory, { role: "user" as const, content: nextUserMessage }];
    setHazemChatHistory(nextHistory);
    setHazemChatMessage("");
    setHazemTestLoading(true);
    try {
      const response = await fetch("/api/admin/hazem/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode: hazemChatMode,
          message: nextUserMessage,
          history: nextHistory.slice(-14),
          hazemAi: settings.hazemAi,
        }),
      });
      const data = (await response.json()) as { reply?: string; message?: string };
      if (!response.ok) {
        setHazemChatHistory((current) => [
          ...current,
          { role: "assistant", content: data.message ?? "Failed to run Hazem chat." },
        ]);
        return;
      }
      setHazemChatHistory((current) => [...current, { role: "assistant", content: data.reply ?? "" }]);
    } catch {
      setHazemChatHistory((current) => [
        ...current,
        { role: "assistant", content: t("Technical issue while talking to Hazem.", "حصلت مشكلة تقنية أثناء المحادثة مع حازم.") },
      ]);
    } finally {
      setHazemTestLoading(false);
    }
  }

  async function runSaveAndTest() {
    if (!hazemChatMessage.trim()) return;
    setSaveAndTestLoading(true);
    try {
      await onSaveSettings();
      await new Promise((resolve) => setTimeout(resolve, 800));
      await runHazemTest();
    } finally {
      setSaveAndTestLoading(false);
    }
  }

  return (
    <div className="grid gap-6">
      <BuilderSection
        eyebrow={t("Hazem AI control hub", "لوحة تحكم حازم AI")}
        title={t("Manage provider, prompts, analysis, and live advisor chat.", "إدارة المزود والبرومبت والتحليل ومحادثة المستشار المباشرة.")}
        description={t(
          "This module controls Hazem for public website sales and admin strategic consultation.",
          "الوحدة دي بتتحكم في حازم للمبيعات في الموقع العام وللاستشارات في لوحة الأدمن.",
        )}
      >
        <div className="grid gap-6">
          <MiniSection
            title={t("Hazem health", "حالة حازم")}
            description={t("Quick readiness checks before production usage.", "فحوصات جاهزية سريعة قبل الاستخدام الفعلي.")}
          >
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
              <Metric label={ui("Runtime status")} value={runtimeStatus} />
              <Metric
                label={ui("API key")}
                value={
                  hasSavedApiKey
                    ? t("Configured (saved in settings)", "موجود ومحفوظ في الإعدادات")
                    : hasServerApiKey
                      ? t("Configured (server environment)", "موجود من بيئة السيرفر")
                      : t("Missing", "ناقص")
                }
                tone={hasApiKey ? "ok" : "warn"}
              />
              <Metric
                label={ui("Prompts")}
                value={
                  hasWebsitePrompt && hasAdminPrompt
                    ? t("Website + Admin ready", "برومبت الموقع والأدمن جاهزين")
                    : t("Prompts incomplete", "البرومبتات ناقصة")
                }
                tone={hasWebsitePrompt && hasAdminPrompt ? "ok" : "warn"}
              />
              <Metric
                label={ui("Contact number in insights")}
                value={hasContactNumber ? t("Detected", "موجود") : t("Not detected", "غير موجود")}
                tone={hasContactNumber ? "ok" : "warn"}
              />
            </div>

            <div className="mt-4 grid gap-4 lg:grid-cols-[1.2fr,0.8fr]">
              <div className="rounded-[24px] border border-white/10 bg-black/20 p-4">
                <p className="text-xs uppercase tracking-[0.18em] text-[#f2c16b]">{t("Readiness checklist", "قائمة الجاهزية")}</p>
                <div className="mt-3 grid gap-2">
                  {readinessItems.map((item) => (
                    <div
                      key={item.label}
                      className="flex items-center justify-between gap-3 rounded-2xl border border-white/10 bg-black/25 px-4 py-3 text-sm text-white/85"
                    >
                      <span>{item.label}</span>
                      <span
                        className={`rounded-full px-3 py-1 text-[11px] uppercase tracking-[0.16em] ${
                          item.ok ? "bg-emerald-500/15 text-emerald-300" : "bg-amber-500/15 text-amber-300"
                        }`}
                      >
                        {item.ok ? t("Ready", "جاهز") : t("Needs action", "يحتاج إجراء")}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-[24px] border border-white/10 bg-black/20 p-4">
                <p className="text-xs uppercase tracking-[0.18em] text-[#f2c16b]">{t("Recommended next actions", "الإجراءات المقترحة الآن")}</p>
                <div className="mt-3 grid gap-2 text-sm text-white/78">
                  {recommendedActions.length ? (
                    recommendedActions.map((action) => (
                      <div key={action} className="rounded-2xl border border-white/10 bg-black/25 px-4 py-3">
                        {action}
                      </div>
                    ))
                  ) : (
                    <div className="rounded-2xl border border-emerald-400/20 bg-emerald-500/10 px-4 py-3 text-emerald-200">
                      {t("Hazem is production-ready. Focus now on response quality and playbooks.", "حازم جاهز للإنتاج. ركز الآن على جودة الردود وسيناريوهات الاستخدام.")}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </MiniSection>

          <MiniSection
            title={t("Core runtime", "الإعدادات الأساسية")}
            description={t("Provider, model, naming, API, and dialect controls.", "المزود والموديل والأسماء ومفتاح الـ API والتحكم في اللهجة.")}
          >
            <div className="grid gap-4 md:grid-cols-2">
              <ToggleField
                label={ui("Assistant enabled")}
                checked={settings.hazemAi.enabled}
                onChange={(value) =>
                  mutateSettings((draft) => {
                    draft.hazemAi.enabled = value;
                  })
                }
                onText={ui("Enabled")}
                offText={ui("Disabled")}
              />
              <ToggleField
                label={ui("Force Egyptian dialect")}
                checked={settings.hazemAi.forceEgyptianDialect}
                onChange={(value) =>
                  mutateSettings((draft) => {
                    draft.hazemAi.forceEgyptianDialect = value;
                  })
                }
                onText={ui("On")}
                offText={ui("Off")}
              />
              <Field label={ui("Provider")}>
                <select
                  value={settings.hazemAi.provider}
                  onChange={(event) =>
                    mutateSettings((draft) => {
                      draft.hazemAi.provider = event.target.value as SiteSettings["hazemAi"]["provider"];
                    })
                  }
                  className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-white outline-none"
                >
                  <option value="groq">Groq</option>
                  <option value="openai">OpenAI</option>
                  <option value="custom">Custom</option>
                </select>
              </Field>
              <Field label={ui("Model")}>
                <input
                  value={settings.hazemAi.model}
                  onChange={(event) =>
                    mutateSettings((draft) => {
                      draft.hazemAi.model = event.target.value;
                    })
                  }
                  className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-white outline-none"
                  placeholder="llama-3.3-70b-versatile"
                />
              </Field>
              <Field label={ui("Public assistant name")}>
                <input
                  value={settings.hazemAi.websiteAssistantName}
                  onChange={(event) =>
                    mutateSettings((draft) => {
                      draft.hazemAi.websiteAssistantName = event.target.value;
                    })
                  }
                  className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-white outline-none"
                />
              </Field>
              <Field label={ui("Admin assistant name")}>
                <input
                  value={settings.hazemAi.adminAssistantName}
                  onChange={(event) =>
                    mutateSettings((draft) => {
                      draft.hazemAi.adminAssistantName = event.target.value;
                    })
                  }
                  className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-white outline-none"
                />
              </Field>
            </div>
            <Field label={ui("API key")}>
              <input
                type="password"
                value={settings.hazemAi.apiKey}
                onChange={(event) =>
                  mutateSettings((draft) => {
                    draft.hazemAi.apiKey = event.target.value;
                  })
                }
                className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-white outline-none"
                placeholder="Paste provider API key"
              />
            </Field>
          </MiniSection>

          <MiniSection
            title={t("System prompts", "البرومبتات الأساسية")}
            description={t("Separate persona prompts for website and admin roles.", "برومبتات منفصلة لشخصية الموقع العام وشخصية الأدمن.")}
          >
            <div className="mb-3 flex justify-end">
              <button
                type="button"
                onClick={() =>
                  mutateSettings((draft) => {
                    draft.hazemAi.systemPrompts.website = RECOMMENDED_WEBSITE_PROMPT;
                    draft.hazemAi.systemPrompts.admin = RECOMMENDED_ADMIN_PROMPT;
                    draft.hazemAi.analysis.summaryPrompt = RECOMMENDED_ANALYSIS_PROMPT;
                    draft.hazemAi.analysis.classificationPrompt = RECOMMENDED_CLASSIFICATION_PROMPT;
                    draft.hazemAi.analysis.qualityPrompt = RECOMMENDED_QUALITY_PROMPT;
                    draft.hazemAi.analysis.recommendationsPrompt = RECOMMENDED_RECOMMENDATIONS_PROMPT;
                  })
                }
                className="rounded-full border border-[#f2c16b]/35 bg-[#f2c16b]/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.14em] text-[#f2c16b] transition hover:bg-[#f2c16b]/20"
              >
                {t("Load recommended prompts", "تحميل البرومبتات المقترحة")}
              </button>
            </div>
            <Field label={ui("Website system prompt")}>
              <textarea
                value={settings.hazemAi.systemPrompts.website}
                onChange={(event) =>
                  mutateSettings((draft) => {
                    draft.hazemAi.systemPrompts.website = event.target.value;
                  })
                }
                rows={9}
                className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-white outline-none"
              />
            </Field>
            <Field label={ui("Admin system prompt")}>
              <textarea
                value={settings.hazemAi.systemPrompts.admin}
                onChange={(event) =>
                  mutateSettings((draft) => {
                    draft.hazemAi.systemPrompts.admin = event.target.value;
                  })
                }
                rows={9}
                className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-white outline-none"
              />
            </Field>
          </MiniSection>

          <MiniSection
            title={t("Analysis engine", "محرك التحليل")}
            description={t("Control summaries, classification, quality scoring, and recommendations.", "التحكم في التلخيص والتصنيف وتقييم الجودة والتوصيات.")}
          >
            <div className="grid gap-4 md:grid-cols-2">
              <ToggleField
                label={ui("Analysis enabled")}
                checked={settings.hazemAi.analysis.enabled}
                onChange={(value) =>
                  mutateSettings((draft) => {
                    draft.hazemAi.analysis.enabled = value;
                  })
                }
                onText={ui("Enabled")}
                offText={ui("Disabled")}
              />
            </div>
            <Field label={ui("Analysis prompt")}>
              <textarea
                value={settings.hazemAi.analysis.summaryPrompt}
                onChange={(event) =>
                  mutateSettings((draft) => {
                    draft.hazemAi.analysis.summaryPrompt = event.target.value;
                  })
                }
                rows={5}
                className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-white outline-none"
              />
            </Field>
            <Field label={ui("Classification prompt")}>
              <textarea
                value={settings.hazemAi.analysis.classificationPrompt}
                onChange={(event) =>
                  mutateSettings((draft) => {
                    draft.hazemAi.analysis.classificationPrompt = event.target.value;
                  })
                }
                rows={5}
                className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-white outline-none"
              />
            </Field>
            <Field label={ui("Quality scoring prompt")}>
              <textarea
                value={settings.hazemAi.analysis.qualityPrompt}
                onChange={(event) =>
                  mutateSettings((draft) => {
                    draft.hazemAi.analysis.qualityPrompt = event.target.value;
                  })
                }
                rows={5}
                className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-white outline-none"
              />
            </Field>
            <Field label={ui("Recommendations prompt")}>
              <textarea
                value={settings.hazemAi.analysis.recommendationsPrompt}
                onChange={(event) =>
                  mutateSettings((draft) => {
                    draft.hazemAi.analysis.recommendationsPrompt = event.target.value;
                  })
                }
                rows={5}
                className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-white outline-none"
              />
            </Field>
            <Field label={ui("Auto insights (one per line)")}>
              <textarea
                value={settings.hazemAi.analysis.autoInsights.join("\n")}
                onChange={(event) =>
                  mutateSettings((draft) => {
                    draft.hazemAi.analysis.autoInsights = event.target.value
                      .split("\n")
                      .map((line) => line.trim())
                      .filter(Boolean);
                  })
                }
                rows={6}
                className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-white outline-none"
              />
            </Field>
            <Field label={ui("Manager notes")}>
              <textarea
                value={settings.hazemAi.analysis.managerNotes}
                onChange={(event) =>
                  mutateSettings((draft) => {
                    draft.hazemAi.analysis.managerNotes = event.target.value;
                  })
                }
                rows={4}
                className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-white outline-none"
                placeholder="Weekly notes and decisions..."
              />
            </Field>
          </MiniSection>

          <MiniSection
            title={t("Talk to Hazem now", "تحدث مع حازم الآن")}
            description={t(
              "Run real chat against your current runtime settings before publishing.",
              "اختبر الدردشة الحقيقية بناءً على الإعدادات الحالية قبل النشر.",
            )}
          >
            <div className="mb-3 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-white/10 bg-black/25 px-4 py-3 text-xs">
              <div className="flex items-center gap-2">
                <span className="text-white/55">{ui("Mode")}:</span>
                <button
                  type="button"
                  onClick={() => setHazemChatMode("admin")}
                  className={`rounded-full px-3 py-1.5 transition ${
                    hazemChatMode === "admin"
                      ? "bg-[#f2c16b] text-[#1a130b]"
                      : "border border-white/15 bg-black/35 text-white/70"
                  }`}
                >
                  {ui("Admin advisor")}
                </button>
                <button
                  type="button"
                  onClick={() => setHazemChatMode("website")}
                  className={`rounded-full px-3 py-1.5 transition ${
                    hazemChatMode === "website"
                      ? "bg-[#f2c16b] text-[#1a130b]"
                      : "border border-white/15 bg-black/35 text-white/70"
                  }`}
                >
                  {ui("Website sales")}
                </button>
              </div>
              <div className="flex items-center gap-2 text-white/65">
                <span className={`h-2 w-2 rounded-full ${hasApiKey ? "bg-emerald-400" : "bg-amber-400"}`} />
                {hasSavedApiKey
                  ? ui("API key connected (settings)")
                  : hasServerApiKey
                    ? ui("API key connected (server)")
                    : ui("API key missing")}
              </div>
            </div>

            <div className="max-h-[360px] overflow-y-auto rounded-2xl border border-white/10 bg-black/20 p-3">
              <div className="grid gap-2">
                {hazemChatHistory.map((item, index) => (
                  <div
                    key={`hazem-chat-${index}`}
                    className={`max-w-[92%] rounded-2xl border px-4 py-3 text-sm leading-7 ${
                      item.role === "assistant"
                        ? "justify-self-start border-white/15 bg-black/35 text-white/92"
                        : "justify-self-end border-[#f2c16b]/35 bg-[#f2c16b]/10 text-[#f6ddb1]"
                    }`}
                  >
                    {item.content}
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-3 flex justify-end">
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => void runHazemTest()}
                  disabled={hazemTestLoading || saveAndTestLoading || isSavingSettings || !hazemChatMessage.trim()}
                  className="rounded-full border border-white/15 bg-black/30 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {hazemTestLoading ? t("Sending...", "جارٍ الإرسال...") : t("Send", "إرسال")}
                </button>
                <button
                  type="button"
                  onClick={() => void runSaveAndTest()}
                  disabled={hazemTestLoading || saveAndTestLoading || isSavingSettings || !hazemChatMessage.trim()}
                  className="rounded-full bg-gradient-to-r from-[#f2c16b] to-[#c68f43] px-5 py-3 text-sm font-semibold text-[#1f150d] transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {saveAndTestLoading || isSavingSettings
                    ? t("Saving + sending...", "جارٍ الحفظ ثم الإرسال...")
                    : t("Save + Send", "حفظ ثم إرسال")}
                </button>
              </div>
            </div>

            <div className="mt-4 rounded-2xl border border-white/10 bg-black/20 p-4">
              <p className="text-xs uppercase tracking-[0.18em] text-[#f2c16b]">{t("Starter scenarios", "سيناريوهات جاهزة")}</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {starterScenarios.map((scenario) => (
                  <button
                    key={scenario}
                    type="button"
                    onClick={() => setHazemChatMessage(scenario)}
                    className="rounded-full border border-white/12 bg-black/30 px-4 py-2 text-sm text-white/80 transition hover:bg-white/10"
                  >
                    {scenario}
                  </button>
                ))}
              </div>
            </div>

            <Field label={ui("Message")}>
              <textarea
                value={hazemChatMessage}
                onChange={(event) => setHazemChatMessage(event.target.value)}
                rows={4}
                className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-white outline-none"
                placeholder={
                  hazemChatMode === "admin"
                    ? t(
                        "Ask for strategy, CRM optimization, SEO plan, UX improvements, or technical roadmap...",
                        "اسأل عن الاستراتيجية أو تحسين CRM أو خطة SEO أو تجربة المستخدم أو خارطة التنفيذ التقني...",
                      )
                    : t(
                        "Ask as a website visitor: prices, areas, installments, booking...",
                        "اسأل كزائر موقع: أسعار، مناطق، تقسيط، حجز، أو ترشيح مشروع...",
                      )
                }
              />
            </Field>
          </MiniSection>
        </div>
      </BuilderSection>
    </div>
  );
}

function Metric({
  label,
  value,
  tone = "normal",
}: {
  label: string;
  value: string;
  tone?: "normal" | "ok" | "warn";
}) {
  const toneClass =
    tone === "ok" ? "text-emerald-300" : tone === "warn" ? "text-amber-300" : "text-white/88";
  return (
    <div className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white/85">
      <p className="text-xs uppercase tracking-[0.16em] text-white/50">{label}</p>
      <p className={`mt-2 font-semibold ${toneClass}`}>{value}</p>
    </div>
  );
}

function ToggleField({
  label,
  checked,
  onChange,
  onText,
  offText,
}: {
  label: string;
  checked: boolean;
  onChange: (value: boolean) => void;
  onText: string;
  offText: string;
}) {
  return (
    <Field label={label}>
      <label className="inline-flex items-center gap-3 rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-white/88">
        <input type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked)} />
        <span>{checked ? onText : offText}</span>
      </label>
    </Field>
  );
}
