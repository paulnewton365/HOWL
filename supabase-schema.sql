-- HOWL READ — Supabase schema
-- Run this in your Supabase project's SQL Editor.
-- Project Settings → SQL Editor → New query → paste → Run.
--
-- Safe to re-run: every policy is dropped and recreated. If you previously
-- had the "anon delete" policy granted, this script will remove it.

create table if not exists reads (
  id              uuid primary key default gen_random_uuid(),
  created_at      timestamptz not null default now(),
  brand_name      text not null,
  website_url     text not null,
  category        text,
  business_model  text,
  overall_score   integer,
  verdict         text,
  brand_meta      jsonb,
  report          jsonb
);

create index if not exists reads_created_at_idx on reads (created_at desc);

-- Row Level Security.
-- The app is gated by an application-level password (ACCESS_PASSWORD).
-- The anon key is exposed in the client bundle, so we keep RLS enabled and
-- open the table to anon read + insert ONLY. Deletes are admin-only and
-- flow through the /api/delete-read server endpoint, which uses the
-- service_role key to bypass RLS after verifying the caller's password
-- AND email against ADMIN_EMAIL.
alter table reads enable row level security;

-- Drop any existing policies first. The anon delete policy is intentionally
-- removed here as part of the admin-permissions migration.
drop policy if exists "anon read"   on reads;
drop policy if exists "anon insert" on reads;
drop policy if exists "anon delete" on reads;

create policy "anon read"   on reads for select using (true);
create policy "anon insert" on reads for insert with check (true);
-- No anon delete policy. Deletes go through /api/delete-read with the
-- service_role key, which bypasses RLS for admin operations only.
