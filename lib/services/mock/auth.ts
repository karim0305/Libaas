import { db, delay, ensureHydrated, mutate, uid } from '../../store';
import type { Profile } from '../../types';

/* TODO(supabase): replace with supabase.auth.signInWithPassword / signUp / signOut and read `profiles`. */
const SESSION = 'libaas_session';

export async function getSession(): Promise<Profile | null> {
  ensureHydrated();
  if (typeof window === 'undefined') return null;
  const id = localStorage.getItem(SESSION);
  return db.profiles.find((p) => p.id === id) ?? null;
}

export async function login(email: string, password: string): Promise<Profile> {
  await delay();
  ensureHydrated();
  if (!password) throw new Error('Enter your password.');
  const u = db.profiles.find((p) => p.email.toLowerCase() === email.trim().toLowerCase());
  if (!u) throw new Error('No account found for that email. Try a demo account below, or register.');
  localStorage.setItem(SESSION, u.id);
  return u;
}

export async function registerCustomer(name: string, email: string, phone: string, password: string): Promise<Profile> {
  await delay();
  ensureHydrated();
  if (password.length < 6) throw new Error('Password must be at least 6 characters.');
  if (db.profiles.some((p) => p.email.toLowerCase() === email.toLowerCase())) throw new Error('An account with this email already exists.');
  const user: Profile = { id: uid('u-'), email, name, phone, role: 'customer' };
  mutate(() => db.profiles.push(user));
  localStorage.setItem(SESSION, user.id);
  return user;
}

export async function logout() { localStorage.removeItem(SESSION); }

/* ---------- Forgot password (sample mode) ----------
 * No email can be sent in sample mode, so the 6-digit code is returned and shown on screen as a demo.
 * With Supabase connected, the code is emailed instead (see supabase/auth.ts). */
const resetCodes = new Map<string, string>();
let verifiedResetEmail: string | null = null;

export async function requestPasswordReset(email: string): Promise<{ demoCode?: string }> {
  await delay(); ensureHydrated();
  const key = email.trim().toLowerCase();
  if (!db.profiles.some((p) => p.email.toLowerCase() === key)) return {}; // same answer whether or not the email exists
  const code = String(Math.floor(100000 + Math.random() * 900000));
  resetCodes.set(key, code);
  return { demoCode: code };
}
export async function verifyResetCode(email: string, code: string): Promise<void> {
  await delay();
  const key = email.trim().toLowerCase();
  if (resetCodes.get(key) !== code.trim()) throw new Error('That code is wrong or has expired. Check it, or ask for a new code.');
  verifiedResetEmail = key; resetCodes.delete(key);
}
export async function completePasswordReset(password: string): Promise<void> {
  await delay();
  if (!verifiedResetEmail) throw new Error('Your code check expired. Please start again.');
  if (password.length < 6) throw new Error('Password must be at least 6 characters.');
  verifiedResetEmail = null; // sample mode does not store passwords
}
export async function cancelPasswordReset(): Promise<void> { verifiedResetEmail = null; }
