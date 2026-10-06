'use client';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState, type ReactNode } from 'react';
import { Menu, X, LogOut, Store, type LucideIcon } from 'lucide-react';
import { Logo } from './StoreChrome';
import { useAuth } from './Providers';

export interface NavItem { href: string; label: string; icon: LucideIcon }

export default function DashboardShell({ nav, title, children, badge }: { nav: NavItem[]; title: string; children: ReactNode; badge: string }) {
  const path = usePathname();
  const { user, logout } = useAuth();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const root = nav[0].href;
  const active = (h: string) => (h === root ? path === h : path.startsWith(h));

  const sidebar = (
    <div className="flex h-full flex-col bg-indigo-800 text-indigo-100">
      <div className="flex items-center justify-between px-5 py-5"><Logo light /><button className="lg:hidden" aria-label="Close menu" onClick={() => setOpen(false)}><X size={20} /></button></div>
      <p className="px-5 pb-2 text-xs font-medium text-indigo-300">{badge}</p>
      <nav className="flex-1 space-y-0.5 overflow-y-auto px-3">
        {nav.map((n) => (
          <Link key={n.href} href={n.href} onClick={() => setOpen(false)} aria-current={active(n.href) ? 'page' : undefined}
            className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${active(n.href) ? 'bg-marigold text-indigo-900' : 'hover:bg-indigo-700'}`}>
            <n.icon size={18} />{n.label}
          </Link>
        ))}
      </nav>
      <div className="space-y-1 border-t border-indigo-700 p-3">
        <Link href="/" className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm hover:bg-indigo-700"><Store size={18} />View storefront</Link>
        <button onClick={() => { logout(); router.push('/'); }} className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm hover:bg-indigo-700"><LogOut size={18} />Log out</button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-surface lg:pl-64">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 lg:block">{sidebar}</aside>
      {open && <div className="fixed inset-0 z-50 lg:hidden"><div className="absolute inset-0 bg-indigo-900/50" onClick={() => setOpen(false)} /><div className="absolute inset-y-0 left-0 w-64">{sidebar}</div></div>}
      <header className="sticky top-0 z-20 flex items-center gap-3 border-b border-line bg-white px-4 py-3 sm:px-6">
        <button className="btn btn-ghost !p-2 lg:hidden" aria-label="Open menu" onClick={() => setOpen(true)}><Menu size={22} /></button>
        <h1 className="text-lg font-semibold sm:text-xl">{title}</h1>
        <div className="ml-auto text-right text-sm"><p className="font-medium text-slate-800">{user?.name}</p><p className="text-xs text-slate-500">{user?.email}</p></div>
      </header>
      <div className="p-4 sm:p-6">{children}</div>
    </div>
  );
}
