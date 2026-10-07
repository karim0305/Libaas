'use client';
import { useEffect, useState } from 'react';
import { useConfirm, usePlatform, useToast } from './Providers';
import { updateCommissionRate } from '@/lib/services/settings';
import { rs } from '@/lib/format';

/** Admin: change the platform commission. Stored in platform_settings and used by the database trigger. */
export default function CommissionSettings() {
  const { rate, pct } = usePlatform(); const toast = useToast(); const confirm = useConfirm();
  const [v, setV] = useState(''); const [busy, setBusy] = useState(false);
  useEffect(() => { setV(String(+(rate * 100).toFixed(2))); }, [rate]);
  const n = Number(v); const valid = v.trim() !== '' && n >= 0 && n <= 50;
  const fee = valid ? Math.round(5000 * (n / 100)) : 0;

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!valid) { toast('Enter a percentage between 0 and 50.', 'error'); return; }
    if (!(await confirm({ title: `Change commission to ${n}%?`, message: 'It applies to orders delivered from now on. Orders already delivered keep the rate they were delivered at.', confirmLabel: 'Save commission' }))) return;
    setBusy(true);
    try { await updateCommissionRate(Math.round(n * 100) / 10000); toast(`Commission is now ${n}%.`); }
    catch (x) { toast((x as Error).message, 'error'); }
    setBusy(false);
  };
  return (
    <form onSubmit={save} className="card space-y-4 p-6">
      <div><h2 className="text-lg font-semibold">Platform commission</h2><p className="mt-1 text-sm text-slate-600">Charged to shops on the product value of delivered orders. Current rate: <b>{pct}</b>.</p></div>
      <div className="max-w-xs"><label className="label" htmlFor="rate">Commission (%)</label><div className="relative"><input id="rate" inputMode="decimal" className="input !pr-9" value={v} onChange={(e) => setV(e.target.value)} /><span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">%</span></div></div>
      {valid && <p className="rounded-lg bg-indigo-50 p-3 text-sm text-slate-700">On an order of {rs(5000)}: commission <b>{rs(fee)}</b>, shop earns <b>{rs(5000 - fee)}</b>.</p>}
      <button className="btn btn-primary" disabled={busy || !valid}>{busy ? 'Saving…' : 'Save commission'}</button>
    </form>
  );
}
