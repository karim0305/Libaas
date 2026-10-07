'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth, useToast } from '@/components/Providers';
import { registerCustomer } from '@/lib/services/auth';
import TermsCheckbox from '@/components/TermsCheckbox';

export default function Register() {
  const router = useRouter(); const { refresh } = useAuth(); const toast = useToast();
  const [f, setF] = useState({ name: '', email: '', phone: '', password: '' }); const [err, setErr] = useState(''); const [busy, setBusy] = useState(false); const [agreed, setAgreed] = useState(false);
  const on = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement>) => setF({ ...f, [k]: e.target.value });
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!agreed) { setErr('Please accept the Terms & Conditions to continue.'); return; }
    setBusy(true); setErr('');
    try { await registerCustomer(f.name, f.email, f.phone, f.password); refresh(); toast('Account created. Happy shopping!'); router.push('/'); }
    catch (x) { setErr((x as Error).message); setBusy(false); }
  };
  return (
    <div className="mx-auto max-w-md px-4 py-14">
      <h1 className="text-3xl font-semibold">Create your account</h1>
      <form onSubmit={submit} className="card mt-6 space-y-4 p-6">
        <div><label className="label" htmlFor="n">Full name</label><input id="n" required className="input" value={f.name} onChange={on('name')} /></div>
        <div><label className="label" htmlFor="e">Email</label><input id="e" type="email" required className="input" value={f.email} onChange={on('email')} /></div>
        <div><label className="label" htmlFor="ph">Mobile number</label><input id="ph" required inputMode="tel" className="input" placeholder="0300 1234567" value={f.phone} onChange={on('phone')} /></div>
        <div><label className="label" htmlFor="pw">Password</label><input id="pw" type="password" required minLength={6} className="input" value={f.password} onChange={on('password')} /></div>
        <TermsCheckbox kind="customer" checked={agreed} onChange={setAgreed} />
        {err && <p role="alert" className="rounded-lg bg-crimson-50 p-3 text-sm text-crimson-700">{err}</p>}
        <button className="btn btn-primary w-full py-3" disabled={busy || !agreed}>{busy ? 'Creating account…' : 'Create account'}</button>
        <p className="text-center text-sm text-slate-500">Already registered? <Link href="/login" className="font-semibold text-crimson">Log in</Link></p>
      </form>
    </div>
  );
}
