'use client';
import { useState, type ReactNode } from 'react';
import { useAuth, useToast } from './Providers';

export default function SettingsPanel({ children }: { children?: ReactNode }) {
  const { user } = useAuth(); const toast = useToast();
  const [notify, setNotify] = useState(true);
  return (
    <div className="mx-auto max-w-2xl space-y-6">
      {children}
      <section className="card space-y-3 p-6"><h2 className="text-lg font-semibold">Account</h2><dl className="grid gap-3 text-sm sm:grid-cols-2"><div><dt className="text-slate-500">Name</dt><dd className="font-medium">{user?.name}</dd></div><div><dt className="text-slate-500">Email</dt><dd className="font-medium">{user?.email}</dd></div></dl></section>
      <section className="card space-y-3 p-6"><h2 className="text-lg font-semibold">Notifications</h2><label className="flex items-center gap-3 text-sm"><input type="checkbox" checked={notify} onChange={(e) => { setNotify(e.target.checked); toast('Notification preference saved.'); }} />Email me when a new order arrives</label></section>
    </div>
  );
}
