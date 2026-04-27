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

export async function POST(request: Request) {
  try {
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
