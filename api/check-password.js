// Validates the user-entered password against ACCESS_PASSWORD.
// Optionally accepts an email and reports back whether it matches the
// admin email, so the login screen can confirm the user's role.

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const expectedPassword = process.env.ACCESS_PASSWORD;
  if (!expectedPassword) {
    return res.status(500).json({ error: 'ACCESS_PASSWORD is not configured on the server.' });
  }

  const { password, email } = req.body || {};
  if (typeof password !== 'string' || password !== expectedPassword) {
    return res.status(401).json({ ok: false });
  }

  const adminEmail = (process.env.ADMIN_EMAIL || 'paul.newton@antennagroup.com').toLowerCase();
  const userEmail = typeof email === 'string' ? email.toLowerCase() : '';
  const isAdmin = !!userEmail && userEmail === adminEmail;

  return res.status(200).json({ ok: true, isAdmin });
}
