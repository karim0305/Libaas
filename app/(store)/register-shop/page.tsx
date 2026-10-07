'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth, usePlatform, useToast } from '@/components/Providers';
import TermsCheckbox from '@/components/TermsCheckbox';
import { registerShop } from '@/lib/services/shops';

export default function RegisterShop() {
  const router = useRouter(); const { refresh } = useAuth(); const toast = useToast();
  const [f, setF] = useState({ owner_name: '', email: '', password: '', shop_name: '', city: '', phone: '', description: '' });
  const [err, setErr] = useState(''); const [busy, setBusy] = useState(false); const [agreed, setAgreed] = useState(false);
  const { rate, pct } = usePlatform();
  const on = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setF({ ...f, [k]: e.target.value });
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!agreed) { setErr('Please accept the Terms & Conditions to continue.'); return; }
    setBusy(true); setErr('');
    try { await registerShop(f); refresh(); toast('Shop submitted. We’ll review it shortly.'); router.push('/shop-dashboard'); }
    catch (x) { setErr((x as Error).message); setBusy(false); }
  };
  return (
    <div className="mx-auto max-w-2xl px-4 py-14">
      <h1 className="text-3xl font-semibold">Open your shop on Libaas</h1>
      <p className="mt-2 text-slate-600">List your clothing, receive cash-on-delivery orders and keep {+(100 - rate * 100).toFixed(2)}% of every delivered sale. We only charge {pct} commission when an order is delivered.</p>
      <form onSubmit={submit} className="card mt-8 grid gap-4 p-6 sm:grid-cols-2">
        <div><label className="label" htmlFor="o">Your name</label><input id="o" required className="input" value={f.owner_name} onChange={on('owner_name')} /></div>
        <div><label className="label" htmlFor="sn">Shop name</label><input id="sn" required className="input" value={f.shop_name} onChange={on('shop_name')} /></div>
        <div><label className="label" htmlFor="e">Email</label><input id="e" type="email" required className="input" value={f.email} onChange={on('email')} /></div>
        <div><label className="label" htmlFor="pw">Password</label><input id="pw" type="password" minLength={6} required className="input" value={f.password} onChange={on('password')} /></div>
        <div><label className="label" htmlFor="ph">Mobile number</label><input id="ph" required className="input" value={f.phone} onChange={on('phone')} /></div>
        <div><label className="label" htmlFor="c">City</label><input id="c" required className="input" value={f.city} onChange={on('city')} /></div>
        <div className="sm:col-span-2"><label className="label" htmlFor="d">What do you sell?</label><textarea id="d" required rows={3} className="input" value={f.description} onChange={on('description')} /></div>
        <TermsCheckbox kind="shop" checked={agreed} onChange={setAgreed} />
        {err && <p role="alert" className="rounded-lg bg-crimson-50 p-3 text-sm text-crimson-700 sm:col-span-2">{err}</p>}
        <button className="btn btn-primary py-3 sm:col-span-2" disabled={busy || !agreed}>{busy ? 'Submitting…' : 'Submit shop for approval'}</button>
      </form>
    </div>
  );
}
