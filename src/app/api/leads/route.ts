import { NextResponse } from "next/server";
import { z } from "zod";
import { createLead } from "@/lib/repository";

const leadSchema = z.object({
  fullName: z.string().min(2),
  phone: z.string().min(8),
  email: z.union([z.string().email(), z.literal("")]).optional(),
  service: z.enum(["Project Visit", "Finishing Quote", "Smart Home Setup"]),
  message: z.string().optional(),
});

const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX = 5;
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);
  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return true;
  }
  if (entry.count >= RATE_LIMIT_MAX) return false;
  entry.count += 1;
  return true;
}

export async function POST(request: Request) {
  try {
    const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
    if (!checkRateLimit(ip)) {
      return NextResponse.json(
        { message: "Too many requests. Please try again later." },
        { status: 429 },
      );
    }

    const json = await request.json();
    const parsed = leadSchema.parse(json);

    const result = await createLead({
      ...parsed,
      email: parsed.email || undefined,
      message: parsed.message || undefined,
    });

    return NextResponse.json({
      message:
        result.mode === "supabase"
          ? "Lead saved successfully."
          : "Lead saved in demo mode. Connect Supabase to persist it in production.",
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Something went wrong.";
    return NextResponse.json({ message }, { status: 400 });
  }
}
