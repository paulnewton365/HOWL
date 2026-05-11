// Vercel Serverless Function, validates the user-entered password against
// the ACCESS_PASSWORD env var. Used by the front-end login screen to test
// credentials before storing them in localStorage. No Anthropic call here.

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const expectedPassword = process.env.ACCESS_PASSWORD;
  if (!expectedPassword) {
    return res.status(500).json({ error: 'ACCESS_PASSWORD is not configured on the server.' });
  }

  const { password } = req.body || {};
  if (typeof password !== 'string' || password !== expectedPassword) {
    return res.status(401).json({ ok: false });
  }

  return res.status(200).json({ ok: true });
}
