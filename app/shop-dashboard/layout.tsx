'use client';
import { LayoutDashboard, Package, PlusSquare, ShoppingCart, BarChart3, Wallet, Store, Settings } from 'lucide-react';
import RequireRole from '@/components/RequireRole';
import DashboardShell from '@/components/DashboardShell';
import { useMyShop } from '@/components/useMyShop';

const nav = [
  { href: '/shop-dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/shop-dashboard/products/new', label: 'Add product', icon: PlusSquare },
  { href: '/shop-dashboard/products', label: 'Products', icon: Package },
  { href: '/shop-dashboard/orders', label: 'Orders', icon: ShoppingCart },
  { href: '/shop-dashboard/sales', label: 'Sales', icon: BarChart3 },
  { href: '/shop-dashboard/earnings', label: 'Earnings', icon: Wallet },
  { href: '/shop-dashboard/profile', label: 'Shop profile', icon: Store },
  { href: '/shop-dashboard/settings', label: 'Settings', icon: Settings },
];
// Sidebar order from the brief: Dashboard, Products, Add Product … – keep Products before Add product
nav.splice(1, 2, nav[2], nav[1]);

function Banner() {
  const { shop } = useMyShop();
  if (!shop || shop.status === 'active') return null;
  const msg = { pending: 'Your shop is waiting for admin approval. You can add products now; customers see them once you’re approved.', rejected: 'Your registration was rejected. Contact help@libaas.pk to appeal.', inactive: 'Your shop is currently deactivated by the admin, so customers can’t see your products.' }[shop.status as 'pending'];
  return <div role="status" className="mb-5 rounded-xl border border-marigold bg-marigold-50 p-4 text-sm text-slate-800">{msg}</div>;
}

export default function ShopLayout({ children }: { children: React.ReactNode }) {
  return <RequireRole role="shop"><DashboardShell nav={nav} title="Shop dashboard" badge="Vendor panel"><Banner />{children}</DashboardShell></RequireRole>;
}
