// Admin-only delete endpoint. Verifies the caller's password AND email
// against the server's ACCESS_PASSWORD and ADMIN_EMAIL env vars, then uses
// the Supabase service_role key to perform the delete. Non-admins get a 403.

import { createClient } from '@supabase/supabase-js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // 1. Password gate (same check used by /api/claude)
  const expectedPassword = process.env.ACCESS_PASSWORD;
  if (!expectedPassword) {
    return res.status(500).json({ error: 'ACCESS_PASSWORD is not configured on the server.' });
  }
  if (req.headers['x-howl-password'] !== expectedPassword) {
    return res.status(401).json({ error: 'Unauthorized.' });
  }

  // 2. Admin check. Defaults to paul.newton@antennagroup.com if ADMIN_EMAIL
  //    is not explicitly set. Comparison is case-insensitive.
  const adminEmail = (process.env.ADMIN_EMAIL || 'paul.newton@antennagroup.com').toLowerCase();
  const userEmail = (req.headers['x-howl-email'] || '').toString().toLowerCase();
  if (!userEmail || userEmail !== adminEmail) {
    return res.status(403).json({ error: 'Only the admin can delete reads.' });
  }

  // 3. Resolve target
  const { id } = req.body || {};
  if (!id || typeof id !== 'string') {
    return res.status(400).json({ error: 'Missing id.' });
  }

  // 4. Server-side Supabase client. Uses the service_role key so the request
  //    bypasses RLS even though anon can no longer delete.
  const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceKey) {
    return res.status(500).json({
      error: 'Server Supabase credentials not configured. Set SUPABASE_SERVICE_ROLE_KEY (and VITE_SUPABASE_URL or SUPABASE_URL).',
    });
  }

  try {
    const supabase = createClient(supabaseUrl, serviceKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const { error } = await supabase.from('reads').delete().eq('id', id);
    if (error) {
      return res.status(500).json({ error: error.message });
    }
    return res.status(200).json({ ok: true });
  } catch (err) {
    return res.status(500).json({ error: err.message || 'Delete failed.' });
  }
}
