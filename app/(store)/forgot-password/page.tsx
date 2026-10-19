'use client';
import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { CheckCircle2, KeyRound, Mail, ShieldCheck } from 'lucide-react';
import { useAuth, useToast } from '@/components/Providers';
import { cancelPasswordReset, completePasswordReset, requestPasswordReset, verifyResetCode } from '@/lib/services/auth';

type Step = 'email' | 'code' | 'password' | 'done';
const STEPS: [Step, string][] = [['email', 'Email'], ['code', 'Code'], ['password', 'New password']];
const MAX_TRIES = 5;

/** Same for admin, shop owner and customer: email -> 6-digit code -> new password -> log in again. */
export default function ForgotPassword() {
  const router = useRouter(); const toast = useToast(); const { refresh } = useAuth();
  const [step, setStep] = useState<Step>('email');
  const [email, setEmail] = useState(''); const [code, setCode] = useState('');
  const [pw, setPw] = useState(''); const [pw2, setPw2] = useState('');
  const [busy, setBusy] = useState(false); const [err, setErr] = useState('');
  const [wait, setWait] = useState(0); const [tries, setTries] = useState(0); const [demo, setDemo] = useState<string | null>(null);
  const verified = useRef(false); const finished = useRef(false);

  useEffect(() => { if (wait <= 0) return; const t = setTimeout(() => setWait((w) => w - 1), 1000); return () => clearTimeout(t); }, [wait]);
  // If the person leaves after the code was accepted but before choosing a password, don't leave them logged in
  useEffect(() => () => { if (verified.current && !finished.current) void cancelPasswordReset(); }, []);

  const sendCode = async (e?: React.FormEvent) => {
    e?.preventDefault(); setErr('');
    if (!/^\S+@\S+\.\S+$/.test(email.trim())) { setErr('Enter a valid email address.'); return; }
    setBusy(true);
    try {
      const r = await requestPasswordReset(email);
      setDemo(r.demoCode ?? null); setCode(''); setTries(0); setStep('code'); setWait(60);
      toast('If this email has an account, we sent a 6-digit code to it.', 'info');
    } catch (x) { setErr((x as Error).message); }
    setBusy(false);
  };
  const checkCode = async (e: React.FormEvent) => {
    e.preventDefault(); setErr('');
    if (!/^\d{6,8}$/.test(code.trim())) { setErr('Enter the code from your email (digits only).'); return; }
    setBusy(true);
    try { await verifyResetCode(email, code); verified.current = true; setStep('password'); }
    catch (x) {
      const n = tries + 1; setTries(n);
      if (n >= MAX_TRIES) { setStep('email'); setErr('Too many wrong codes. Ask for a new code.'); } else setErr(`${(x as Error).message} (${MAX_TRIES - n} tries left)`);
    }
    setBusy(false);
  };
  const savePassword = async (e: React.FormEvent) => {
    e.preventDefault(); setErr('');
    if (pw.length < 6) { setErr('Password must be at least 6 characters.'); return; }
    if (pw !== pw2) { setErr('The two passwords do not match.'); return; }
    setBusy(true);
    try { await completePasswordReset(pw); finished.current = true; refresh(); setStep('done'); setTimeout(() => router.push('/login?reset=1'), 2500); }
    catch (x) { setErr((x as Error).message); }
    setBusy(false);
  };

  const idx = STEPS.findIndex(([s]) => s === step);
  return (
    <div className="mx-auto max-w-md px-4 py-14">
      <h1 className="text-3xl font-semibold">Forgot password</h1>
      {step !== 'done' && (
        <ol className="mt-5 grid grid-cols-3 gap-2 text-center text-xs" aria-label="Progress">
          {STEPS.map(([s, l], i) => <li key={s}><div className={`h-1.5 rounded-full ${i <= idx ? 'bg-indigo' : 'bg-slate-200'}`} /><span className={`mt-1 block ${i <= idx ? 'font-semibold text-indigo-800' : 'text-slate-400'}`}>{i + 1}. {l}</span></li>)}
        </ol>
      )}

      {step === 'email' && (
        <form onSubmit={sendCode} className="card mt-6 space-y-4 p-6" noValidate>
          <div className="flex items-center gap-3"><span className="grid h-10 w-10 place-items-center rounded-full bg-indigo-50 text-indigo"><Mail size={20} /></span><p className="text-sm text-slate-600">Enter the email you log in with. We will send you a 6-digit code.</p></div>
          <div><label className="label" htmlFor="fe">Email</label><input id="fe" type="email" autoFocus className="input" value={email} onChange={(e) => setEmail(e.target.value)} /></div>
          {err && <p role="alert" className="rounded-lg bg-crimson-50 p-3 text-sm text-crimson-700">{err}</p>}
          <button className="btn btn-primary w-full py-3" disabled={busy}>{busy ? 'Sending…' : 'Send code'}</button>
          <p className="text-center text-sm text-slate-500"><Link href="/login" className="font-semibold text-crimson">Back to log in</Link></p>
        </form>
      )}

      {step === 'code' && (
        <form onSubmit={checkCode} className="card mt-6 space-y-4 p-6" noValidate>
          <div className="flex items-center gap-3"><span className="grid h-10 w-10 place-items-center rounded-full bg-indigo-50 text-indigo"><ShieldCheck size={20} /></span><p className="text-sm text-slate-600">If <b>{email}</b> has an account, a 6-digit code is on its way. Check your inbox and spam folder.</p></div>
          {demo && <p className="rounded-lg border border-dashed border-marigold bg-marigold-50 p-3 text-sm">Demo mode (no email is sent): your code is <b className="font-mono text-base tracking-widest">{demo}</b></p>}
          <div><label className="label" htmlFor="fc">6-digit code</label><input id="fc" inputMode="numeric" autoComplete="one-time-code" autoFocus maxLength={8} className="input text-center font-mono text-xl tracking-[0.4em]" value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))} /></div>
          {err && <p role="alert" className="rounded-lg bg-crimson-50 p-3 text-sm text-crimson-700">{err}</p>}
          <button className="btn btn-primary w-full py-3" disabled={busy}>{busy ? 'Checking…' : 'Confirm code'}</button>
          <div className="flex items-center justify-between text-sm">
            <button type="button" className="font-semibold text-crimson disabled:text-slate-400" disabled={wait > 0 || busy} onClick={() => sendCode()}>{wait > 0 ? `Send again in ${wait}s` : 'Send a new code'}</button>
            <button type="button" className="text-slate-500 hover:text-indigo-800" onClick={() => { setStep('email'); setErr(''); }}>Change email</button>
          </div>
        </form>
      )}

      {step === 'password' && (
        <form onSubmit={savePassword} className="card mt-6 space-y-4 p-6" noValidate>
          <div className="flex items-center gap-3"><span className="grid h-10 w-10 place-items-center rounded-full bg-green-50 text-green-700"><KeyRound size={20} /></span><p className="text-sm text-slate-600">Code confirmed. Choose a new password.</p></div>
          <div><label className="label" htmlFor="np">New password</label><input id="np" type="password" autoFocus autoComplete="new-password" className="input" value={pw} onChange={(e) => setPw(e.target.value)} /><p className="mt-1 text-xs text-slate-500">At least 6 characters.</p></div>
          <div><label className="label" htmlFor="np2">Confirm password</label><input id="np2" type="password" autoComplete="new-password" className="input" value={pw2} onChange={(e) => setPw2(e.target.value)} aria-invalid={!!pw2 && pw !== pw2} />{pw2 && pw !== pw2 && <p className="mt-1 text-xs text-crimson">The passwords do not match.</p>}</div>
          {err && <p role="alert" className="rounded-lg bg-crimson-50 p-3 text-sm text-crimson-700">{err}</p>}
          <button className="btn btn-primary w-full py-3" disabled={busy}>{busy ? 'Saving…' : 'Change password'}</button>
        </form>
      )}

      {step === 'done' && (
        <div className="card mt-6 p-8 text-center">
          <CheckCircle2 className="mx-auto text-green-600" size={56} />
          <h2 className="mt-4 text-xl font-semibold">Password changed</h2>
          <p className="mt-1 text-sm text-slate-600">Now log in with your email and your new password.</p>
          <Link href="/login?reset=1" className="btn btn-primary mt-6">Go to log in</Link>
        </div>
      )}
    </div>
  );
}
