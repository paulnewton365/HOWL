// HOWL READ, Password gate + light identity.
// The shared password is the access boundary. Email is captured at sign-in
// for identification, used to grant admin permissions to a specific account.
// Server-side enforcement lives in /api/check-password and /api/delete-read.

const PWD_KEY = 'howl-read:pwd';
const EMAIL_KEY = 'howl-read:email';

// Default admin. The server uses its own ADMIN_EMAIL env var; this constant
// is only for hiding/showing admin-only UI in the client. Keep them in sync
// or set VITE_ADMIN_EMAIL at build time to override the default here.
const DEFAULT_ADMIN = 'paul.newton@antennagroup.com';
const ADMIN_EMAIL = (
  import.meta.env.VITE_ADMIN_EMAIL || DEFAULT_ADMIN
).toLowerCase();

export function getPassword() {
  try { return localStorage.getItem(PWD_KEY) || ''; } catch { return ''; }
}

export function setPassword(pwd) {
  try { localStorage.setItem(PWD_KEY, pwd); } catch { /* ignore */ }
}

export function getUserEmail() {
  try { return localStorage.getItem(EMAIL_KEY) || ''; } catch { return ''; }
}

export function setUserEmail(email) {
  try { localStorage.setItem(EMAIL_KEY, email); } catch { /* ignore */ }
}

export function clearPassword() {
  try {
    localStorage.removeItem(PWD_KEY);
    localStorage.removeItem(EMAIL_KEY);
  } catch { /* ignore */ }
}

export function hasPassword() {
  return !!getPassword();
}

export function hasEmail() {
  return !!getUserEmail();
}

export function isAdmin() {
  return getUserEmail().toLowerCase() === ADMIN_EMAIL;
}

export function adminEmailDisplay() {
  return ADMIN_EMAIL;
}

// Headers to attach to every authenticated API call.
export function passwordHeaders() {
  const headers = {};
  const pwd = getPassword();
  const email = getUserEmail();
  if (pwd) headers['X-Howl-Password'] = pwd;
  if (email) headers['X-Howl-Email'] = email;
  return headers;
}
