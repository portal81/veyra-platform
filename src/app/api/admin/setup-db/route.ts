import { NextResponse } from "next/server";

const SQL = `
create table if not exists public.projects (
  "id" text primary key,
  "slug" text unique not null,
  "name" text not null,
  "location" text not null,
  "category" text not null,
  "description" text not null,
  "heroImage" text not null,
  "gallery" jsonb not null default '[]'::jsonb,
  "startingPricePerMeter" integer not null,
  "installmentYears" integer not null,
  "featured" boolean not null default false,
  "highlights" jsonb not null default '[]'::jsonb,
  "content" jsonb not null default '{}'::jsonb
);
alter table public.projects add column if not exists "content" jsonb not null default '{}'::jsonb;
create table if not exists public.units (
  "id" text primary key,
  "project_id" text not null references public.projects("id") on delete cascade,
  "type" text not null,
  "image" text,
  "area" integer not null,
  "floor" integer not null,
  "bedrooms" integer,
  "price" integer not null,
  "status" text not null
);
alter table public.units add column if not exists "image" text;
create table if not exists public.leads (
  "id" text primary key,
  "fullName" text not null,
  "phone" text not null,
  "email" text,
  "service" text not null,
  "message" text,
  "createdAt" timestamptz not null default now(),
  "status" text not null default 'new',
  "stage" text not null default 'new',
  "priority" text not null default 'medium',
  "assignedTo" text,
  "source" text,
  "budget" integer
);
alter table public.leads add column if not exists "stage" text not null default 'new';
alter table public.leads add column if not exists "priority" text not null default 'medium';
alter table public.leads add column if not exists "assignedTo" text;
alter table public.leads add column if not exists "source" text;
alter table public.leads add column if not exists "budget" integer;
create table if not exists public.lead_activities (
  "id" text primary key,
  "leadId" text not null references public.leads("id") on delete cascade,
  "kind" text not null,
  "body" text not null,
  "createdAt" timestamptz not null default now(),
  "createdBy" text not null
);
create table if not exists public.user_invitations (
  "id" text primary key,
  "email" text not null,
  "role" text not null,
  "permissions" jsonb not null default '[]'::jsonb,
  "accessMode" text not null default 'role',
  "status" text not null default 'pending',
  "invitedBy" text not null,
  "createdAt" timestamptz not null default now(),
  "lastSentAt" timestamptz not null default now()
);
alter table public.user_invitations add column if not exists "permissions" jsonb not null default '[]'::jsonb;
alter table public.user_invitations add column if not exists "accessMode" text not null default 'role';
create table if not exists public.site_settings (
  "id" text primary key,
  "companyName" text not null,
  "primaryLocale" text not null default 'en',
  "supportedLocales" jsonb not null default '["en","ar"]'::jsonb,
  "paletteId" text not null,
  "palettes" jsonb not null default '[]'::jsonb,
  "branding" jsonb not null default '{}'::jsonb,
  "content" jsonb not null default '{}'::jsonb,
  "installmentCalculator" jsonb not null default '{}'::jsonb,
  "finishingCalculator" jsonb not null default '{}'::jsonb
);
alter table public.site_settings add column if not exists "content" jsonb not null default '{}'::jsonb;
alter table public.site_settings add column if not exists "branding" jsonb not null default '{}'::jsonb;
create table if not exists public.finishing_packages (
  "id" text primary key,
  "name" text not null,
  "pricePerMeter" integer not null,
  "summary" text not null,
  "features" jsonb not null default '[]'::jsonb,
  "featured" boolean not null default false,
  "content" jsonb not null default '{}'::jsonb
);
create table if not exists public.smart_devices (
  "id" text primary key,
  "name" text not null,
  "summary" text not null,
  "benefits" jsonb not null default '[]'::jsonb,
  "content" jsonb not null default '{}'::jsonb
);
create table if not exists public.smart_packages (
  "id" text primary key,
  "name" text not null,
  "summary" text not null,
  "devices" jsonb not null default '[]'::jsonb,
  "content" jsonb not null default '{}'::jsonb
);
create table if not exists public.ai_chat_logs (
  "id" uuid primary key default gen_random_uuid(),
  "session_id" text not null,
  "role" text not null,
  "content" text not null,
  "metadata" jsonb default '{}'::jsonb,
  "createdAt" timestamptz not null default now()
);
alter table public.ai_chat_logs add column if not exists "metadata" jsonb default '{}'::jsonb;
create table if not exists public.entity_threads (
  "id" text primary key,
  "entityType" text not null,
  "entityId" text not null,
  "title" text not null,
  "createdBy" text not null,
  "createdAt" timestamptz not null default now(),
  "resolved" boolean not null default false
);
create table if not exists public.entity_comments (
  "id" text primary key,
  "threadId" text not null references public.entity_threads("id") on delete cascade,
  "body" text not null,
  "createdBy" text not null,
  "createdAt" timestamptz not null default now(),
  "mentions" jsonb not null default '[]'::jsonb
);
create table if not exists public.handoffs (
  "id" text primary key,
  "entityType" text not null,
  "entityId" text not null,
  "fromUserId" text not null,
  "toUserId" text not null,
  "note" text not null default '',
  "status" text not null default 'pending',
  "createdAt" timestamptz not null default now(),
  "resolvedAt" timestamptz
);
`.trim();

export async function GET() {
  const { Client } = await import("pg");

  const dbUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const dbPass = process.env.SUPABASE_DB_PASSWORD;
  const ref = dbUrl?.replace("https://", "").replace(".supabase.co", "");

  if (!ref || !dbPass) {
    return NextResponse.json(
      { error: "SUPABASE_DB_PASSWORD not set as env var on Vercel" },
      { status: 400 },
    );
  }

  const client = new Client({
    host: `db.${ref}.supabase.co`,
    port: 5432,
    database: "postgres",
    user: "postgres",
    password: dbPass,
    ssl: { rejectUnauthorized: false },
  });

  try {
    await client.connect();
    await client.query(SQL);
    await client.end();
    return NextResponse.json({ success: true, message: "All tables created." });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    try { await client.end(); } catch { /* noop */ }
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
