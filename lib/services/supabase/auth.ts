import { sb } from './_client';
import type { Profile } from '../../types';
import { TERMS_VERSION } from '../../terms';

export async function loadProfile(uid: string, email: string): Promise<Profile> {
  const [p, s] = await Promise.all([
    sb().from('profiles').select('full_name, phone, role').eq('id', uid).maybeSingle(),
    sb().from('shops').select('id').eq('owner_id', uid).maybeSingle(),
  ]);
  if (p.error) throw new Error(p.error.message);
  if (!p.data) throw new Error('Your profile row is missing. Run supabase/migrations/004_profile_email.sql in the SQL editor, then log in again.');
  return { id: uid, email, name: p.data.full_name || email, phone: p.data.phone ?? undefined, role: p.data.role, shop_id: s.data?.id };
}

export async function getSession(): Promise<Profile | null> {
  const { data } = await sb().auth.getSession();
  const u = data.session?.user;
  if (!u) return null;
  try { return await loadProfile(u.id, u.email ?? ''); } catch { return null; }
}

export async function login(email: string, password: string): Promise<Profile> {
  const { data, error } = await sb().auth.signInWithPassword({ email: email.trim(), password });
  if (error) throw new Error(error.message === 'Invalid login credentials' ? 'Email or password is wrong.' : error.message === 'Email not confirmed' ? 'Confirm your email first: open the link we sent you, then log in.' : error.message);
  return loadProfile(data.user.id, data.user.email ?? email);
}

export const CONFIRM_HINT = 'Account created. Open the confirmation link we emailed you, then log in. (While testing you can turn off “Confirm email” in Supabase → Authentication → Providers → Email.)';

export async function signUp(email: string, password: string, name: string, phone: string) {
  if (password.length < 6) throw new Error('Password must be at least 6 characters.');
  const { data, error } = await sb().auth.signUp({ email: email.trim(), password, options: { data: { full_name: name, phone, terms_accepted_at: new Date().toISOString(), terms_version: TERMS_VERSION } } });
  if (error) throw new Error(/already/i.test(error.message) ? 'An account with this email already exists.' : error.message);
  if (data.user && data.user.identities?.length === 0) throw new Error('An account with this email already exists.');
  if (!data.session) throw new Error(CONFIRM_HINT);
  return data.user!;
}

export async function registerCustomer(name: string, email: string, phone: string, password: string): Promise<Profile> {
  const u = await signUp(email, password, name, phone);
  return loadProfile(u.id, u.email ?? email);
}

export async function logout() { await sb().auth.signOut(); }

/* ---------- Forgot password with a 6-digit email code ----------
 * 1. resetPasswordForEmail  -> Supabase emails a code (the "Reset Password" email template must show {{ .Token }}).
 * 2. verifyOtp (recovery)   -> proves the person owns the email; Supabase signs them in for a moment.
 * 3. updateUser             -> sets the new password, then we sign out so they log in again with it. */
export async function requestPasswordReset(email: string): Promise<{ demoCode?: string }> {
  const { error } = await sb().auth.resetPasswordForEmail(email.trim());
  if (error) throw new Error(/rate|seconds|too many|limit/i.test(error.message) ? 'Please wait a minute before asking for another code.' : error.message);
  return {}; // Supabase gives the same answer whether or not the email has an account
}
export async function verifyResetCode(email: string, code: string): Promise<void> {
  const { error } = await sb().auth.verifyOtp({ email: email.trim(), token: code.trim(), type: 'recovery' });
  if (error) throw new Error('That code is wrong or has expired. Check it, or ask for a new code.');
}
export async function completePasswordReset(password: string): Promise<void> {
  const { error } = await sb().auth.updateUser({ password });
  if (error) throw new Error(/different|same/i.test(error.message) ? 'Choose a password that is different from your old one.' : /at least|weak|short/i.test(error.message) ? 'Password must be at least 6 characters.' : error.message);
  await sb().auth.signOut(); // they must now log in again with the new password
}
export async function cancelPasswordReset(): Promise<void> { await sb().auth.signOut(); }
