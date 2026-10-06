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
