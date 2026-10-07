'use client';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { LayoutDashboard, Package, PlusSquare, ShoppingCart, BarChart3, Wallet, Store, Settings, Clock, Ban } from 'lucide-react';
import RequireRole from '@/components/RequireRole';
import DashboardShell from '@/components/DashboardShell';
import { Logo } from '@/components/StoreChrome';
import { Skeleton } from '@/components/ui/States';
import { useAuth } from '@/components/Providers';
import { useMyShop } from '@/components/useMyShop';

const nav = [
  { href: '/shop-dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/shop-dashboard/products', label: 'Products', icon: Package },
  { href: '/shop-dashboard/products/new', label: 'Add product', icon: PlusSquare },
  { href: '/shop-dashboard/orders', label: 'Orders', icon: ShoppingCart },
  { href: '/shop-dashboard/sales', label: 'Sales', icon: BarChart3 },
  { href: '/shop-dashboard/earnings', label: 'Earnings', icon: Wallet },
  { href: '/shop-dashboard/profile', label: 'Shop profile', icon: Store },
  { href: '/shop-dashboard/settings', label: 'Settings', icon: Settings },
];

const COPY = {
  pending: { icon: Clock, title: 'Your shop is waiting for approval', text: 'We’re reviewing your registration. You’ll get access to your dashboard as soon as an admin approves it.' },
  rejected: { icon: Ban, title: 'Your shop registration was rejected', text: 'Your dashboard stays locked. Contact help@libaas.pk if you think this is a mistake.' },
  inactive: { icon: Ban, title: 'Your shop is deactivated', text: 'An admin has switched your shop off, so the dashboard is locked and customers can’t see your products. Contact help@libaas.pk to get it reactivated.' },
  missing: { icon: Store, title: 'No shop found for this account', text: 'This account isn’t linked to a shop. Register a shop or log in with the right email.' },
} as const;

/** Only an approved (active) shop may open the dashboard. */
function ApprovalGate({ children }: { children: React.ReactNode }) {
  const { shop, loading, reload } = useMyShop();
  const { logout } = useAuth();
  const router = useRouter();
  if (loading) return <div className="p-8"><Skeleton className="h-8 w-48" /><Skeleton className="mt-6 h-64 w-full" /></div>;
  if (shop?.status === 'active') return <>{children}</>;

  const c = COPY[shop ? (shop.status as 'pending') : 'missing'];
  return (
    <div className="grid min-h-screen place-items-center bg-surface p-4">
      <div className="card w-full max-w-md p-8 text-center">
        <div className="flex justify-center"><Logo /></div>
        <div className="mx-auto mt-8 grid h-14 w-14 place-items-center rounded-full bg-marigold-50 text-marigold-600"><c.icon size={26} /></div>
        <h1 className="mt-4 text-xl font-semibold">{c.title}</h1>
        {shop && <p className="mt-1 text-sm font-medium text-slate-700">{shop.name}</p>}
        <p className="mt-2 text-sm text-slate-600">{c.text}</p>
        <div className="mt-6 flex flex-col gap-2">
          {shop?.status === 'pending' && <button className="btn btn-primary" onClick={reload}>Check approval status</button>}
          <Link href="/" className="btn btn-outline">Back to storefront</Link>
          <button className="btn btn-ghost" onClick={() => { logout(); router.push('/'); }}>Log out</button>
        </div>
      </div>
    </div>
  );
}

export default function ShopLayout({ children }: { children: React.ReactNode }) {
  return (
    <RequireRole role="shop">
      <ApprovalGate><DashboardShell nav={nav} title="Shop dashboard" badge="Vendor panel">{children}</DashboardShell></ApprovalGate>
    </RequireRole>
  );
}