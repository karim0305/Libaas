'use client';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState, type ReactNode } from 'react';
import { Menu, Search, ShoppingBag, User, X, LayoutDashboard, LogOut, Package } from 'lucide-react';
import { useAuth, useCart } from './Providers';
import { publicCategories } from '@/lib/services/analytics';
import type { Category } from '@/lib/types';

export function Logo({ light = false }: { light?: boolean }) {
  return (
    <Link href="/" className="flex items-center gap-2" aria-label="Libaas home">
      <span className="grid h-9 w-9 place-items-center rounded-lg bg-crimson font-display text-lg font-bold text-white">ل</span>
      <span className={`font-display text-xl font-bold tracking-tight ${light ? 'text-white' : 'text-indigo-800'}`}>Libaas</span>
    </Link>
  );
}

export function SiteHeader() {
  const { user, logout } = useAuth();
  const cart = useCart();
  const router = useRouter();
  const [q, setQ] = useState('');
  const [open, setOpen] = useState(false);
  const [menu, setMenu] = useState(false);
  const [cats, setCats] = useState<Category[]>([]);
  useEffect(() => { publicCategories().then(setCats); }, []);
  const search = (e: React.FormEvent) => { e.preventDefault(); router.push(`/products?q=${encodeURIComponent(q)}`); setOpen(false); };
  const dash = user?.role === 'admin' ? '/admin' : user?.role === 'shop' ? '/shop-dashboard' : '/orders';

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-white/95 backdrop-blur">
      <div className="bg-indigo-800 py-1.5 text-center text-xs text-indigo-100">Cash on delivery across Pakistan · Free delivery on orders above Rs. 5,000</div>
      <div className="mx-auto flex max-w-7xl items-center gap-3 px-4 py-3">
        <button className="btn btn-ghost !p-2 lg:hidden" aria-label="Open menu" onClick={() => setOpen(!open)}>{open ? <X size={22} /> : <Menu size={22} />}</button>
        <Logo />
        <form onSubmit={search} className="relative mx-4 hidden max-w-xl flex-1 md:block" role="search">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input value={q} onChange={(e) => setQ(e.target.value)} className="input !rounded-full !pl-10" placeholder="Search kurtas, lawn, waistcoats or shops" aria-label="Search products" />
        </form>
        <nav className="ml-auto flex items-center gap-1">
          <Link href="/shops" className="btn btn-ghost hidden lg:inline-flex">Shops</Link>
          <Link href="/register-shop" className="btn btn-ghost hidden lg:inline-flex">Sell on Libaas</Link>
          {user ? (
            <div className="relative">
              <button className="btn btn-ghost" onClick={() => setMenu(!menu)} aria-haspopup="menu" aria-expanded={menu}><User size={18} /><span className="hidden sm:inline">{user.name.split(' ')[0]}</span></button>
              {menu && (
                <div className="absolute right-0 mt-2 w-52 rounded-xl border border-line bg-white p-1.5 shadow-xl" role="menu" onMouseLeave={() => setMenu(false)}>
                  <Link href={dash} onClick={() => setMenu(false)} className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm hover:bg-surface">{user.role === 'customer' ? <Package size={16} /> : <LayoutDashboard size={16} />}{user.role === 'customer' ? 'My orders' : 'Dashboard'}</Link>
                  <button onClick={() => { logout(); setMenu(false); router.push('/'); }} className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm hover:bg-surface"><LogOut size={16} />Log out</button>
                </div>
              )}
            </div>
          ) : (
            <><Link href="/login" className="btn btn-ghost">Log in</Link><Link href="/register" className="btn btn-primary hidden sm:inline-flex">Register</Link></>
          )}
          <Link href="/cart" className="btn btn-ghost relative !p-2.5" aria-label={`Cart, ${cart.count} items`}>
            <ShoppingBag size={22} />
            {cart.count > 0 && <span className="absolute -right-0.5 -top-0.5 grid h-5 min-w-5 place-items-center rounded-full bg-crimson px-1 text-[11px] font-bold text-white">{cart.count}</span>}
          </Link>
        </nav>
      </div>
      <div className="hidden border-t border-line lg:block">
        <ul className="mx-auto flex max-w-7xl gap-1 overflow-x-auto px-4 text-sm">
          <li><Link href="/products" className="block whitespace-nowrap px-3 py-2.5 font-semibold text-indigo-800 hover:text-crimson">All products</Link></li>
          {cats.map((c) => <li key={c.id}><Link href={`/products?category=${c.id}`} className="block whitespace-nowrap px-3 py-2.5 text-slate-600 hover:text-crimson">{c.name}</Link></li>)}
        </ul>
      </div>
      {open && (
        <div className="border-t border-line bg-white px-4 pb-4 lg:hidden">
          <form onSubmit={search} className="my-3"><input value={q} onChange={(e) => setQ(e.target.value)} className="input" placeholder="Search products" aria-label="Search products" /></form>
          <ul className="grid grid-cols-2 gap-1 text-sm">
            {cats.map((c) => <li key={c.id}><Link onClick={() => setOpen(false)} href={`/products?category=${c.id}`} className="block rounded-lg px-3 py-2 hover:bg-surface">{c.name}</Link></li>)}
            <li><Link onClick={() => setOpen(false)} href="/shops" className="block rounded-lg px-3 py-2 font-semibold hover:bg-surface">All shops</Link></li>
            <li><Link onClick={() => setOpen(false)} href="/register-shop" className="block rounded-lg px-3 py-2 font-semibold hover:bg-surface">Sell on Libaas</Link></li>
          </ul>
        </div>
      )}
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="mt-20 bg-indigo-900 text-indigo-100">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-14 sm:grid-cols-2 lg:grid-cols-4">
        <div><Logo light /><p className="mt-4 max-w-xs text-sm text-indigo-200">One marketplace for Pakistan’s clothing shops. Order online, pay when it arrives.</p></div>
        <div><h4 className="mb-3 font-semibold text-white">Shop</h4><ul className="space-y-2 text-sm"><li><Link href="/products" className="hover:text-white">All products</Link></li><li><Link href="/shops" className="hover:text-white">Browse shops</Link></li><li><Link href="/orders" className="hover:text-white">Track my order</Link></li></ul></div>
        <div><h4 className="mb-3 font-semibold text-white">Sell with us</h4><ul className="space-y-2 text-sm"><li><Link href="/register-shop" className="hover:text-white">Open a shop</Link></li><li><Link href="/login?as=shop" className="hover:text-white">Shop login</Link></li><li className="text-indigo-300">5% commission, only on delivered orders</li></ul></div>
        <div><h4 className="mb-3 font-semibold text-white">Help</h4><ul className="space-y-2 text-sm text-indigo-200"><li>Cash on delivery in 500+ cities</li><li>7-day returns on unworn items</li><li>help@libaas.pk · 0800 55 22 11</li></ul></div>
      </div>
      <div className="border-t border-indigo-700 py-5 text-center text-xs text-indigo-300">© {new Date().getFullYear()} Libaas Marketplace. All prices in Pakistani Rupees.</div>
    </footer>
  );
}

export default function StoreChrome({ children }: { children: ReactNode }) {
  return <><SiteHeader /><main className="min-h-[60vh]">{children}</main><SiteFooter /></>;
}
