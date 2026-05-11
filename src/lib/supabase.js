// HOWL READ, Supabase persistence layer.
// All functions degrade gracefully if Supabase isn't configured. The Previous
// Reads section uses the returned error to show actionable guidance to the
// user when the connection or schema is broken.

import { createClient } from '@supabase/supabase-js';
import { getVerdict } from '../data/rubric';

const url = import.meta.env.VITE_SUPABASE_URL;
const key = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Quick init diagnostic in the console so the user can confirm credentials
// landed without opening the network tab.
if (typeof window !== 'undefined') {
  if (url && key) {
    console.info('[HOWL READ] Supabase configured:', url);
  } else {
    console.info('[HOWL READ] Supabase NOT configured. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to enable Previous Reads.');
  }
}

export const supabase = url && key ? createClient(url, key) : null;
export const supabaseEnabled = !!supabase;

// Surface the env-var values the build was given (for displaying in error
// banners). Truncated so we don't leak the whole key into the DOM.
export const supabaseDebug = {
  urlPresent: !!url,
  keyPresent: !!key,
  urlPreview: url ? url.replace(/^https?:\/\//, '').slice(0, 40) : null,
};

// Persist a completed READ.
export async function saveRead(brandMeta, report) {
  if (!supabase) return { ok: false, reason: 'supabase-disabled' };
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
    console.error('[HOWL READ] saveRead failed:', error);
    return { ok: false, reason: classifyError(error), message: error.message };
  }
  return { ok: true, data };
}

// Fetch summaries of the most recent reads.
export async function fetchRecentReads(limit = 30) {
  if (!supabase) return { ok: false, reason: 'supabase-disabled', data: [] };
  const { data, error } = await supabase
    .from('reads')
    .select('id, created_at, brand_name, website_url, category, business_model, overall_score, verdict, brand_meta')
    .order('created_at', { ascending: false })
    .limit(limit);
  if (error) {
    console.error('[HOWL READ] fetchRecentReads failed:', error);
    return { ok: false, reason: classifyError(error), message: error.message, data: [] };
  }
  return { ok: true, data: data || [] };
}

export async function fetchReadById(id) {
  if (!supabase) return null;
  const { data, error } = await supabase
    .from('reads')
    .select('*')
    .eq('id', id)
    .single();
  if (error) {
    console.error('[HOWL READ] fetchReadById failed:', error);
    return null;
  }
  return data;
}

export async function deleteRead(id) {
  if (!supabase) return false;
  const { error } = await supabase.from('reads').delete().eq('id', id);
  if (error) {
    console.error('[HOWL READ] deleteRead failed:', error);
    return false;
  }
  return true;
}

// Map a Supabase error into a category the UI can switch on.
function classifyError(error) {
  const code = error?.code || '';
  const msg = (error?.message || '').toLowerCase();
  if (code === '42P01' || msg.includes('relation') && msg.includes('does not exist')) {
    return 'table-missing';
  }
  if (code === '42501' || msg.includes('row-level security') || msg.includes('rls')) {
    return 'rls-blocked';
  }
  if (msg.includes('jwt') || msg.includes('invalid api key') || msg.includes('unauthorized')) {
    return 'bad-credentials';
  }
  if (msg.includes('fetch') || msg.includes('network')) {
    return 'network';
  }
  return 'unknown';
}
