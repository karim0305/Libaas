'use client';
import { Suspense, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth, useToast } from '@/components/Providers';
import { login } from '@/lib/services/auth';
import { isSupabaseConfigured } from '@/lib/supabase/client';

const demo = [['Customer', 'ayesha@example.com', '/orders'], ['Shop owner', 'khaddar@libaas.pk', '/shop-dashboard'], ['Admin', 'admin@libaas.pk', '/admin']];

function Inner() {
  const sp = useSearchParams(); const router = useRouter(); const { refresh } = useAuth(); const toast = useToast();
  const [email, setEmail] = useState(''); const [password, setPassword] = useState(''); const [busy, setBusy] = useState(false); const [err, setErr] = useState('');
  const go = async (e: string, p: string) => {
    setBusy(true); setErr('');
    try { const u = await login(e, p); refresh(); toast(`Welcome back, ${u.name.split(' ')[0]}.`); router.push(sp.get('next') || (u.role === 'admin' ? '/admin' : u.role === 'shop' ? '/shop-dashboard' : '/')); }
    catch (x) { setErr((x as Error).message); setBusy(false); }
  };
  return (
    <div className="mx-auto max-w-md px-4 py-14">
      <h1 className="text-3xl font-semibold">Log in</h1>
      <form onSubmit={(e) => { e.preventDefault(); go(email, password); }} className="card mt-6 space-y-4 p-6">
        <div><label className="label" htmlFor="e">Email</label><input id="e" type="email" required className="input" value={email} onChange={(e) => setEmail(e.target.value)} /></div>
        <div><label className="label" htmlFor="p">Password</label><input id="p" type="password" required className="input" value={password} onChange={(e) => setPassword(e.target.value)} /></div>
        {err && <p role="alert" className="rounded-lg bg-crimson-50 p-3 text-sm text-crimson-700">{err}</p>}
        <button className="btn btn-primary w-full py-3" disabled={busy}>{busy ? 'Logging in…' : 'Log in'}</button>
        <p className="text-center text-sm text-slate-500">New here? <Link href="/register" className="font-semibold text-crimson">Create an account</Link> or <Link href="/register-shop" className="font-semibold text-crimson">open a shop</Link></p>
      </form>
      {!isSupabaseConfigured && <div className="mt-6 rounded-xl border border-dashed border-marigold bg-marigold-50 p-4">
        <p className="text-sm font-semibold text-indigo-800">Sample accounts (demo data)</p>
        <div className="mt-3 flex flex-wrap gap-2">{demo.map(([l, e]) => <button key={e} className="btn btn-outline btn-sm" onClick={() => go(e, 'demo1234')}>{l}</button>)}</div>
      </div>}
    </div>
  );
}
export default function LoginPage() { return <Suspense><Inner /></Suspense>; }
