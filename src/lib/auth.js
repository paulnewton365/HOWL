// HOWL READ — Password gate.
// The actual auth check happens server-side in /api/claude. This module just
// stores the user-entered password in localStorage and exposes a header helper
// for the fetch calls.

const KEY = 'howl-read:pwd';

export function getPassword() {
  try {
    return localStorage.getItem(KEY) || '';
  } catch {
    return '';
  }
}

export function setPassword(pwd) {
  try {
    localStorage.setItem(KEY, pwd);
  } catch { /* ignore */ }
}

export function clearPassword() {
  try {
    localStorage.removeItem(KEY);
  } catch { /* ignore */ }
}

export function hasPassword() {
  return !!getPassword();
}

// Header to attach to every authenticated /api/claude call.
export function passwordHeaders() {
  const pwd = getPassword();
  return pwd ? { 'X-Howl-Password': pwd } : {};
}
