// HOWL READ, Supabase persistence layer.
// All functions degrade gracefully if Supabase isn't configured. The Previous
// Reads section uses the returned error to show actionable guidance to the
// user when the connection or schema is broken.

import { createClient } from '@supabase/supabase-js';
import { getVerdict } from '../data/rubric';
import { passwordHeaders } from './auth';

const url = import.meta.env.VITE_SUPABASE_URL;
const key = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Parse the role out of a Supabase JWT key. Used to catch the very common
// mistake of pasting the `service_role` secret key into the browser env var.
function inspectKey(jwt) {
  try {
    const parts = jwt.split('.');
    if (parts.length !== 3) return { valid: false };
    const b64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    const payload = JSON.parse(atob(b64));
    return { valid: true, role: payload.role || null };
  } catch {
    return { valid: false };
  }
}

const keyInfo = key ? inspectKey(key) : { valid: false };
const keyIsServiceRole = keyInfo.valid && keyInfo.role === 'service_role';
const keyIsAnon = keyInfo.valid && keyInfo.role === 'anon';

// Init diagnostic in the console so credentials issues are obvious without
// hunting through the network tab.
if (typeof window !== 'undefined') {
  if (!url || !key) {
    console.info('[HOWL READ] Supabase NOT configured. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to enable Previous Reads.');
  } else if (keyIsServiceRole) {
    console.error('[HOWL READ] VITE_SUPABASE_ANON_KEY is a service_role (secret) key. Use the anon (public) key instead. Supabase blocks secret keys in browsers as a safety feature.');
  } else if (!keyIsAnon) {
    console.warn('[HOWL READ] VITE_SUPABASE_ANON_KEY does not parse as a Supabase JWT. Double-check the value.');
  } else {
    console.info('[HOWL READ] Supabase configured:', url);
  }
}

// Only initialize the client if we have credentials AND the key is the right
// kind. Otherwise the app falls back to "no history" mode and the UI surfaces
// the specific reason.
export const supabase =
  url && key && !keyIsServiceRole ? createClient(url, key) : null;
export const supabaseEnabled = !!supabase;

// Status for the UI to render an actionable empty-state.
export const supabaseStatus = (() => {
  if (!url || !key) return 'not-configured';
  if (keyIsServiceRole) return 'wrong-key-type';
  if (!keyIsAnon) return 'invalid-key';
  return 'ready';
})();

export const supabaseDebug = {
  urlPresent: !!url,
  keyPresent: !!key,
  urlPreview: url ? url.replace(/^https?:\/\//, '').slice(0, 40) : null,
  keyRole: keyInfo.role || null,
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

// Normalize a URL for comparison: strip protocol, www, trailing slash, lowercase.
// "https://www.patagonia.com/" → "patagonia.com"
export function normalizeUrl(url) {
  if (!url) return '';
  return String(url)
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\//, '')
    .replace(/^www\./, '')
    .replace(/\/+$/, '')
    .split(/[?#]/)[0]; // drop query and fragment
}

// Look for an existing read matching the given brand name or URL.
// Returns the most recent matching record, or null if none.
// Match rules: case-insensitive exact brand name match, OR matching
// normalized URL (with or without protocol / www / trailing slash).
export async function findExistingRead(brandName, websiteUrl) {
  if (!supabase) return null;
  const name = (brandName || '').trim();
  const normTarget = normalizeUrl(websiteUrl);

  // First pass: exact name match (case-insensitive).
  if (name) {
    const { data, error } = await supabase
      .from('reads')
      .select('id, created_at, brand_name, website_url, category, business_model, overall_score, verdict, brand_meta')
      .ilike('brand_name', name)
      .order('created_at', { ascending: false })
      .limit(1);
    if (!error && data && data.length > 0) return data[0];
  }

  // Second pass: URL match. Use the longest distinctive part of the
  // normalized URL as the search seed, then verify normalized equality.
  if (normTarget) {
    const seed = normTarget.replace(/\..*$/, ''); // domain root, e.g. "patagonia"
    if (seed) {
      const { data, error } = await supabase
        .from('reads')
        .select('id, created_at, brand_name, website_url, category, business_model, overall_score, verdict, brand_meta')
        .ilike('website_url', `%${seed}%`)
        .order('created_at', { ascending: false })
        .limit(10);
      if (!error && data) {
        const match = data.find((r) => normalizeUrl(r.website_url) === normTarget);
        if (match) return match;
      }
    }
  }

  return null;
}

export async function deleteRead(id) {
  if (!supabase) return { ok: false, reason: 'supabase-disabled' };
  try {
    const res = await fetch('/api/delete-read', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...passwordHeaders(),
      },
      body: JSON.stringify({ id }),
    });
    if (res.ok) return { ok: true };
    const body = await res.json().catch(() => ({}));
    return {
      ok: false,
      reason: res.status === 403 ? 'forbidden' : res.status === 401 ? 'unauthorized' : 'unknown',
      message: body.error || `Server returned ${res.status}.`,
    };
  } catch (err) {
    return { ok: false, reason: 'network', message: err.message };
  }
}

// Map a Supabase error into a category the UI can switch on.
function classifyError(error) {
  const code = error?.code || '';
  const msg = (error?.message || '').toLowerCase();
  if (msg.includes('secret api key') || msg.includes('forbidden use of secret')) {
    return 'wrong-key-type';
  }
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
