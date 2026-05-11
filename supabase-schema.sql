-- HOWL READ — Supabase schema
-- Run this in your Supabase project's SQL Editor.
-- Project Settings → SQL Editor → New query → paste → Run.

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
-- open the table to anon read/write/delete. Anyone who gets the anon key
-- can hit the table, so do not store sensitive data here.
alter table reads enable row level security;

drop policy if exists "anon read"   on reads;
drop policy if exists "anon insert" on reads;
drop policy if exists "anon delete" on reads;

create policy "anon read"   on reads for select using (true);
create policy "anon insert" on reads for insert with check (true);
create policy "anon delete" on reads for delete using (true);
