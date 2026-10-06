'use client';
import { useState } from 'react';
import { useAuth, useConfirm, useToast } from './Providers';
import { resetSampleData } from '@/lib/store';
import { isSupabaseConfigured } from '@/lib/supabase/client';
import { COMMISSION_RATE } from '@/lib/commission';

export default function SettingsPanel({ admin = false }: { admin?: boolean }) {
  const { user } = useAuth(); const toast = useToast(); const confirm = useConfirm();
  const [notify, setNotify] = useState(true);
  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <section className="card space-y-3 p-6"><h2 className="text-lg font-semibold">Account</h2><dl className="grid gap-3 text-sm sm:grid-cols-2"><div><dt className="text-slate-500">Name</dt><dd className="font-medium">{user?.name}</dd></div><div><dt className="text-slate-500">Email</dt><dd className="font-medium">{user?.email}</dd></div></dl></section>
      <section className="card space-y-3 p-6"><h2 className="text-lg font-semibold">Notifications</h2><label className="flex items-center gap-3 text-sm"><input type="checkbox" checked={notify} onChange={(e) => { setNotify(e.target.checked); toast('Notification preference saved.'); }} />Email me when a new order arrives</label></section>
      {admin && <section className="card space-y-2 p-6"><h2 className="text-lg font-semibold">Platform</h2><p className="text-sm text-slate-600">Commission rate: <b>{COMMISSION_RATE * 100}%</b> of each delivered order. It’s enforced by the database function <code className="rounded bg-surface px-1">generate_commission</code>; change <code className="rounded bg-surface px-1">platform_settings.commission_rate</code> to update it.</p></section>}
      <section className="card space-y-3 p-6"><h2 className="text-lg font-semibold">Data source</h2><p className="text-sm text-slate-600">{isSupabaseConfigured ? 'Connected to Supabase. Data is stored in your project database.' : 'Running on built-in sample data stored in this browser. Add your Supabase keys to .env.local to switch to the real database.'}</p>
        {!isSupabaseConfigured && <button className="btn btn-outline" onClick={async () => { if (await confirm({ title: 'Reset sample data?', message: 'All changes made in this browser (orders, products, shops) return to the original sample data.', confirmLabel: 'Reset data', danger: true })) resetSampleData(); }}>Reset sample data</button>}</section>
    </div>
  );
}
