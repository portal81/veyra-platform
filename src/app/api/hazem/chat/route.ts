import { NextResponse } from "next/server";
import { getFinishingPackages, getProjects, getSiteSettings, getSmartPackages } from "@/lib/repository";
import type { HazemAiSettings } from "@/lib/types";

type ChatPayload = {
  message: string;
  history?: Array<{ role: "user" | "assistant"; content: string }>;
};

const CONTACT_REQUEST_RE = /(رقم|تواصل|اتصال|كلم|موبايل|فون|واتساب|واتس|whatsapp|call|phone|contact)/i;
const GREETING_RE = /^(السلام|سلام|اهلا|أهلا|ازيك|عامل اي|هاي|هلا|hi|hello|hey)/i;

function normalizeForSearch(input: string) {
  return input.toLowerCase().replace(/[أإآ]/g, "ا").replace(/ة/g, "ه").replace(/ى/g, "ي");
}

function extractCompanyPhone(hazemAi: HazemAiSettings): string | null {
  const raw = hazemAi.analysis.autoInsights.join(" ");
  const match = raw.match(/(?:\+?\d[\d\s\-()]{7,}\d)/);
  if (match?.[0]) return match[0].replace(/\s+/g, " ").trim();
  return null;
}

function offlineAdvisorReply(message: string, history: Array<{ role: "user" | "assistant"; content: string }> = []) {
  const normalized = normalizeForSearch(message.trim());
  const context = history.slice(-6).map((item) => item.content).concat(message).join(" ").toLowerCase();
  const isGreeting = GREETING_RE.test(normalized);

  if (isGreeting) {
    return "أهلًا بيك يا فندم في Veyra. أنا حازم، أقدر أساعدك تختار المشروع المناسب حسب منطقتك وميزانيتك. عايز تعرف إيه بالضبط؟";
  }
  if (CONTACT_REQUEST_RE.test(normalized)) {
    return "أكيد يا فندم، هديك رقم التواصل فورًا. ابعت رقمك ووقت المناسب وأنا أرتبلك متابعة فورية.";
  }
  return "تمام يا فندم. أقدر أساعدك في:\n1) اختيار مشروع مناسب حسب المنطقة والميزانية\n2) تفاصيل التشطيب والباقات\n3) أنظمة المنزل الذكي\n4) حجز زيارة ميدانية\nحدد اللي عايزه وأنا أرشحلك الأنسب.";
}

function dedupeLines(text: string) {
  const seen = new Set<string>();
  return text.split("\n").map((l) => l.trim()).filter(Boolean).filter((line) => {
    const key = normalizeForSearch(line);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  }).join("\n");
}

export async function POST(request: Request) {
  try {
    const payload = (await request.json()) as ChatPayload;
    const message = payload.message?.trim();
    const history = payload.history ?? [];

    if (!message) {
      return NextResponse.json({ message: "Message is required." }, { status: 400 });
    }

    const [projects, finishing, smart, siteSettings] = await Promise.all([
      getProjects(),
      getFinishingPackages(),
      getSmartPackages(),
      getSiteSettings(),
    ]);

    const hazemAi = siteSettings.hazemAi;

    if (!hazemAi?.enabled) {
      return NextResponse.json({ reply: offlineAdvisorReply(message, history) });
    }

    const provider = hazemAi.provider ?? "groq";
    const resolvedApiKey = hazemAi.apiKey?.trim() || process.env.GROQ_API_KEY?.trim() || "";

    if (!resolvedApiKey) {
      return NextResponse.json({ reply: offlineAdvisorReply(message, history), warning: "API key missing; offline mode." });
    }

    const companyPhone = extractCompanyPhone(hazemAi);
    const topProjects = projects.length > 0
      ? projects.slice(0, 8).map((p) => `${p.name} | ${p.location} | ${p.startingPricePerMeter} EGP/m2`).join("\n")
      : "No projects available.";
    const finishingText = finishing.length > 0
      ? finishing.map((f) => `${f.name}: ${f.pricePerMeter} EGP/m2`).join(" | ")
      : "No finishing packages.";
    const smartText = smart.length > 0
      ? smart.map((s) => s.name).join(" | ")
      : "No smart packages.";

    const systemPrompt = [
      hazemAi.systemPrompts.website,
      "Think in English if needed, output in Egyptian Arabic in Arabic script.",
      "PERSONA: Veyra website sales concierge. Priority: conversion and clear next action.",
      "Keep responses concise (3-8 lines), practical, and conversion-focused.",
      companyPhone ? `Contact number to share when asked: ${companyPhone}` : "No contact number configured.",
      "LIVE DATA:",
      "Projects:",
      topProjects,
      `Finishing: ${finishingText}`,
      `Smart: ${smartText}`,
    ].filter(Boolean).join("\n\n");

    if (CONTACT_REQUEST_RE.test(message) && companyPhone) {
      return NextResponse.json({ reply: `أكيد يا فندم، رقم التواصل: ${companyPhone}` });
    }

    const model = hazemAi.model?.trim() || "llama-3.3-70b-versatile";
    const groqMessages = [
      { role: "system" as const, content: systemPrompt },
      ...history.slice(-14).map((entry) => ({ role: entry.role as "user" | "assistant", content: entry.content })),
      { role: "user" as const, content: message },
    ];

    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${resolvedApiKey}` },
      body: JSON.stringify({ model, temperature: 0.35, max_tokens: 900, messages: groqMessages }),
    });

    const data = (await response.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
      error?: { message?: string };
    };

    if (!response.ok) {
      throw new Error(data.error?.message ?? "Groq request failed.");
    }

    const reply = data.choices?.[0]?.message?.content?.trim() || offlineAdvisorReply(message, history);
    return NextResponse.json({ reply: dedupeLines(reply) });
  } catch {
    return NextResponse.json({ reply: "عذرًا، حصل عطل تقني. حاول تاني بعد شوية أو كلمنا على الرقم الرسمي." });
  }
}
