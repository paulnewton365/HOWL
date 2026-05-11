// HOWL READ — Supabase persistence layer.
// All functions degrade gracefully if Supabase isn't configured. The app
// continues to work without history; the Previous Reads section just stays
// empty.

import { createClient } from '@supabase/supabase-js';
import { getVerdict } from '../data/rubric';

const url = import.meta.env.VITE_SUPABASE_URL;
const key = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = url && key ? createClient(url, key) : null;
export const supabaseEnabled = !!supabase;

// Persist a completed READ to the `reads` table.
export async function saveRead(brandMeta, report) {
  if (!supabase) return null;
  const verdict = getVerdict(report.overall_score);
  const { data, error } = await supabase
    .from('reads')
    .insert([{
      brand_name: brandMeta.brandName,
      website_url: brandMeta.websiteUrl,
      category: brandMeta.category,
      business_model: brandMeta.businessModel,
      overall_score: report.overall_score,
      verdict: verdict.id,
      brand_meta: brandMeta,
      report,
    }])
    .select()
    .single();
  if (error) {
    console.error('saveRead error:', error);
    return null;
  }
  return data;
}

// Fetch summaries of the most recent reads. Excludes the full `report` jsonb
// to keep the list query small and fast.
export async function fetchRecentReads(limit = 30) {
  if (!supabase) return [];
  const { data, error } = await supabase
    .from('reads')
    .select('id, created_at, brand_name, website_url, category, business_model, overall_score, verdict, brand_meta')
    .order('created_at', { ascending: false })
    .limit(limit);
  if (error) {
    console.error('fetchRecentReads error:', error);
    return [];
  }
  return data || [];
}

// Fetch a single read's full payload, including the `report` jsonb, so the
// app can render it without re-running the diagnostic.
export async function fetchReadById(id) {
  if (!supabase) return null;
  const { data, error } = await supabase
    .from('reads')
    .select('*')
    .eq('id', id)
    .single();
  if (error) {
    console.error('fetchReadById error:', error);
    return null;
  }
  return data;
}

export async function deleteRead(id) {
  if (!supabase) return false;
  const { error } = await supabase.from('reads').delete().eq('id', id);
  if (error) {
    console.error('deleteRead error:', error);
    return false;
  }
  return true;
}
