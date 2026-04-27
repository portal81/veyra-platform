import { NextResponse } from "next/server";
import { requireAdminRoute } from "@/lib/admin-route";

export async function GET() {
  const guard = await requireAdminRoute("settings.manage");
  if (guard.response) return guard.response;

  const hasGroq = Boolean(process.env.GROQ_API_KEY?.trim());
  const hasOpenAi = Boolean(process.env.OPENAI_API_KEY?.trim());

  return NextResponse.json({
    hasServerApiKey: hasGroq || hasOpenAi,
    hasGroq,
    hasOpenAi,
  });
}
