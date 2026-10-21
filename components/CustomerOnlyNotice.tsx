'use client';
import { useRouter } from 'next/navigation';
import { UserRound } from 'lucide-react';
import { useAuth } from './Providers';
import { blockedMessage } from '@/lib/roles';
import type { Role } from '@/lib/types';

/** Shown to a shop owner or admin who tries to order. Orders are for customer accounts only. */
export default function CustomerOnlyNotice({ role, next = '/cart' }: { role: Role; next?: string }) {
  const { logout } = useAuth(); const router = useRouter();
  return (
    <div role="alert" className="flex flex-wrap items-center gap-4 rounded-xl border border-marigold bg-marigold-50 p-4">
      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-white text-marigold-600"><UserRound size={20} /></span>
      <p className="min-w-0 flex-1 text-sm text-slate-800">{blockedMessage(role)}</p>
      <button className="btn btn-primary btn-sm" onClick={() => { logout(); router.push(`/login?next=${encodeURIComponent(next)}`); }}>Log out and log in as customer</button>
    </div>
  );
}
