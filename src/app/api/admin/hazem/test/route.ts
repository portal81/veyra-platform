import { NextResponse } from "next/server";
import { requireAdminRoute } from "@/lib/admin-route";
import { getFinishingPackages, getProjects, getSiteSettings, getSmartPackages } from "@/lib/repository";
import type { HazemAiSettings } from "@/lib/types";

type TestPayload = {
  mode: "website" | "admin";
  message: string;
  history?: Array<{ role: "user" | "assistant"; content: string }>;
  hazemAi: HazemAiSettings;
};

const CONTACT_REQUEST_RE = /(رقم|تواصل|اتصال|كلم|موبايل|فون|واتساب|واتس|whatsapp|call|phone|contact)/i;
const GREETING_RE = /^(السلام|سلام|اهلا|أهلا|ازيك|عامل اي|هاي|هلا|hi|hello|hey)/i;

function normalizeForSearch(input: string) {
  return input
    .toLowerCase()
    .replace(/[أإآ]/g, "ا")
    .replace(/ة/g, "ه")
    .replace(/ى/g, "ي");
}

function extractCompanyPhone(hazemAi: HazemAiSettings): string | null {
  const raw = hazemAi.analysis.autoInsights.join(" ");
  const match = raw.match(/(?:\+?\d[\d\s\-()]{7,}\d)/);
  if (match?.[0]) return match[0].replace(/\s+/g, " ").trim();
  return null;
}

function offlineAdvisorReply(
  mode: "website" | "admin",
  message: string,
  history: Array<{ role: "user" | "assistant"; content: string }> = [],
) {
  const normalized = normalizeForSearch(message.trim());
  const context = history
    .slice(-6)
    .map((item) => item.content)
    .concat(message)
    .join(" ")
    .toLowerCase();
  const isGreeting = GREETING_RE.test(normalized);

  if (mode === "website") {
    if (isGreeting) {
      return "أهلًا بيك يا فندم، أنا حازم من Veyra. قولي بتدور على منطقة أو ميزانية معينة وأنا أرشحلك أنسب اختيار فورًا.";
    }
    if (CONTACT_REQUEST_RE.test(normalized)) {
      return "أكيد يا فندم، لو رقم التواصل متضاف في الإعدادات هيرد بيه مباشرة. ولو لسه مش متضاف، ابعت رقمك ووقت مناسب وهنرتبلك متابعة فورية.";
    }
    return "تمام يا فندم، أقدر أساعدك تختار مشروع مناسب حسب المنطقة والميزانية ونظام الدفع. ابعتلي المطلوب بالتحديد وأنا أطلعلك ترشيح واضح وخطوة تالية مباشرة.";
  }

  if (isGreeting) {
    return [
      "أهلًا بيك، أنا حازم مستشارك في لوحة الإدارة.",
      "أنا هنا عشان أساعدك في تحسين المبيعات، تطوير تجربة الموقع، وضبط CRM والتشغيل.",
      "ابدأ معايا بهدف واحد دلوقتي: مبيعات، CRM، SEO، أو UX وأنا أطلعلك خطة تنفيذ عملية فورًا.",
    ].join("\n");
  }

  if (/(crm|lead|pipeline|مبيعات|عملاء|conversion|lost|source|مندوب|متابعة)/i.test(context)) {
    return [
      "خطة تشغيل CRM فورية:",
      "P1: إلزام Source و Lost Reason و Next Action لكل lead.",
      "P2: SLA للمتابعة الأولى خلال 15 دقيقة مع تنبيه تلقائي عند التأخير.",
      "P3: Dashboard يومي للمندوب يوضح New → Qualified → Visit → Won.",
      "KPI: رفع Qualified → Visit بنسبة 10% خلال 14 يوم.",
    ].join("\n");
  }

  if (/(seo|محتوى|مدونه|blog|ranking|keywords|schema|sitemap|robots)/i.test(context)) {
    return [
      "خطة SEO عملية:",
      "P1: ضبط Meta و Canonical و Slug لكل الصفحات الأساسية.",
      "P2: نشر مقالات intent + area وربط داخلي بالمشروعات والخدمات.",
      "P3: تفعيل Schema مثل FAQ و Breadcrumb و Organization.",
      "KPI: نمو Organic sessions و CTR خلال 30 يوم.",
    ].join("\n");
  }

  if (/(ui|ux|واجهه|تجربه|سرعه|performance|conversion|cta)/i.test(context)) {
    return [
      "خطة تحسين UX وتحويل:",
      "P1: Hero أوضح + CTA رئيسي واحد + social proof فوق أول شاشة.",
      "P2: تحسين الأداء عبر الصور والسكريبتات وتقليل التزاحم.",
      "P3: توحيد Design System للأزرار والكروت والمسافات.",
      "KPI: زيادة CTR على الـ CTA الرئيسي 15%.",
    ].join("\n");
  }

  return [
    "تمام، خلينا نمشي بمنهج واضح:",
    "1) إيه الهدف الأساسي دلوقتي؟",
    "2) محتاج النتيجة خلال 7 أيام ولا 30 يوم؟",
    "3) مين الفريق المتاح للتنفيذ؟",
    "وبناءً عليه أطلعلك خطة P1/P2/P3 + KPI + مخاطر + أول خطوة تنفيذ.",
  ].join("\n");
}

function resolveSystemPrompt(mode: "website" | "admin", hazemAi: HazemAiSettings) {
  return mode === "website" ? hazemAi.systemPrompts.website : hazemAi.systemPrompts.admin;
}

function analysisEnvelope(hazemAi: HazemAiSettings) {
  const analysis = hazemAi.analysis;
  return [
    analysis.summaryPrompt,
    analysis.classificationPrompt,
    analysis.qualityPrompt,
    analysis.recommendationsPrompt,
  ]
    .filter(Boolean)
    .join("\n\n");
}

function buildAdminKnowledgeSnapshot(
  projects: Awaited<ReturnType<typeof getProjects>>,
  finishing: Awaited<ReturnType<typeof getFinishingPackages>>,
  smart: Awaited<ReturnType<typeof getSmartPackages>>,
) {
  const topProjects =
    projects.length > 0
      ? projects
          .slice(0, 8)
          .map(
            (project) =>
              `${project.name} | ${project.location} | ${project.startingPricePerMeter} EGP/m2 | up to ${project.installmentYears}y`,
          )
          .join("\n")
      : "No projects available.";

  const finishingText =
    finishing.length > 0
      ? finishing.map((item) => `${item.name}: ${item.pricePerMeter} EGP/m2`).join(" | ")
      : "No finishing packages available.";

  const smartText =
    smart.length > 0 ? smart.map((item) => item.name).join(" | ") : "No smart-home packages available.";

  return [
    "LIVE DATA SNAPSHOT (Veyra):",
    "Projects:",
    topProjects,
    `Finishing packages: ${finishingText}`,
    `Smart-home packages: ${smartText}`,
  ].join("\n");
}

async function runGroq(
  model: string,
  apiKey: string,
  messages: Array<{ role: "system" | "user" | "assistant"; content: string }>,
) {
  const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      temperature: 0.35,
      max_tokens: 900,
      messages,
    }),
  });

  const data = (await response.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
    error?: { message?: string };
  };

  if (!response.ok) {
    throw new Error(data.error?.message ?? "Groq request failed.");
  }

  return data.choices?.[0]?.message?.content?.trim() ?? "";
}

async function runOpenAi(
  model: string,
  apiKey: string,
  messages: Array<{ role: "system" | "user" | "assistant"; content: string }>,
) {
  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      temperature: 0.35,
      max_tokens: 900,
      messages,
    }),
  });

  const data = (await response.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
    error?: { message?: string };
  };

  if (!response.ok) {
    throw new Error(data.error?.message ?? "OpenAI request failed.");
  }

  return data.choices?.[0]?.message?.content?.trim() ?? "";
}

function dedupeLines(text: string) {
  const seen = new Set<string>();
  const lines = text
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .filter((line) => {
      const key = normalizeForSearch(line);
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  return lines.join("\n");
}

export async function POST(request: Request) {
  const guard = await requireAdminRoute("settings.manage");
  if (guard.response) return guard.response;

  try {
    const payload = (await request.json()) as TestPayload;
    const mode = payload.mode ?? "admin";
    const message = payload.message?.trim();
    const history = payload.history ?? [];
    const hazemAi = payload.hazemAi;

    if (!message) {
      return NextResponse.json({ message: "Message is required." }, { status: 400 });
    }

    if (!hazemAi?.enabled) {
      return NextResponse.json({ message: "Hazem is currently disabled in settings." }, { status: 400 });
    }

    const provider = hazemAi.provider ?? "groq";
    const [projects, finishing, smart, siteSettings] = await Promise.all([
      getProjects(),
      getFinishingPackages(),
      getSmartPackages(),
      getSiteSettings(),
    ]);

    const resolvedApiKey =
      hazemAi.apiKey?.trim() ||
      (provider === "openai" ? process.env.OPENAI_API_KEY?.trim() : process.env.GROQ_API_KEY?.trim()) ||
      process.env.GROQ_API_KEY?.trim() ||
      "";

    if (!resolvedApiKey) {
      return NextResponse.json({
        reply: offlineAdvisorReply(mode, message, history),
        warning: "API key missing; offline advisor mode is active.",
      });
    }

    const corePrompt = resolveSystemPrompt(mode, hazemAi);
    const companyPhone = extractCompanyPhone(hazemAi);
    const analysisPrompt = analysisEnvelope(hazemAi);
    const knowledgeSnapshot = buildAdminKnowledgeSnapshot(projects, finishing, smart);
    const companyContext = [
      `Company name: ${siteSettings.companyName}`,
      `Primary locale: ${siteSettings.primaryLocale}`,
      `Supported locales: ${siteSettings.supportedLocales.join(", ")}`,
    ].join("\n");

    const systemPrompt = [
      corePrompt,
      "Think in English if needed, but output must be Egyptian Arabic in Arabic script unless the user explicitly asks another language.",
      mode === "website"
        ? "PERSONA MODE = WEBSITE SALES MANAGER. Priority: conversion and one clear next action."
        : "PERSONA MODE = ADMIN STRATEGIC ADVISOR. Priority: diagnosis, priorities, KPI, and next execution step.",
      mode === "website"
        ? "Keep responses concise (3-8 lines), practical, and conversion-focused."
        : "Give practical answers (8-16 lines) with P1/P2/P3 priorities, KPI, and execution risk note.",
      companyPhone
        ? `If user asks for contact number/call/WhatsApp, provide this number immediately: ${companyPhone}`
        : "If no number is configured, clearly ask for callback details.",
      "Do not repeat identical sentence patterns across turns. Keep the wording fresh and practical.",
      mode === "admin"
        ? "For admin mode, respond with: 1) quick diagnosis 2) action plan 3) KPI 4) risk + mitigation 5) first action now."
        : "For website mode, respond with one practical recommendation + one clear CTA.",
      companyContext,
      knowledgeSnapshot,
      analysisPrompt,
    ]
      .filter(Boolean)
      .join("\n\n");

    if (CONTACT_REQUEST_RE.test(message)) {
      return NextResponse.json({
        reply: companyPhone
          ? `أكيد يا فندم، رقم التواصل المباشر هو: ${companyPhone}`
          : "رقم التواصل لسه مش متضاف في إعدادات حازم. ضيفه في Auto insights أو بيانات الشركة.",
      });
    }

    const model = hazemAi.model?.trim() || (provider === "openai" ? "gpt-4o-mini" : "llama-3.3-70b-versatile");
    const messages = [
      { role: "system" as const, content: systemPrompt },
      ...history.slice(-14).map((entry) => ({ role: entry.role, content: entry.content })),
      { role: "user" as const, content: message },
    ];

    const reply =
      provider === "groq"
        ? await runGroq(model, resolvedApiKey, messages)
        : provider === "openai"
          ? await runOpenAi(model, resolvedApiKey, messages)
          : "";

    if (provider === "custom") {
      return NextResponse.json({ message: "Custom provider test is not implemented yet." }, { status: 400 });
    }

    const clean = dedupeLines(reply);
    return NextResponse.json({ reply: clean || offlineAdvisorReply(mode, message, history) });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Hazem test failed.";
    return NextResponse.json({ message: msg }, { status: 400 });
  }
}
