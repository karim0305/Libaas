'use client';
import { LayoutDashboard, Store, Package, Tags, Users, ShoppingCart, Percent, FileBarChart, Settings } from 'lucide-react';
import RequireRole from '@/components/RequireRole';
import DashboardShell from '@/components/DashboardShell';

const nav = [
  { href: '/admin', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/admin/shops', label: 'Shops', icon: Store },
  { href: '/admin/products', label: 'Products', icon: Package },
  { href: '/admin/categories', label: 'Categories', icon: Tags },
  { href: '/admin/customers', label: 'Customers', icon: Users },
  { href: '/admin/orders', label: 'Orders', icon: ShoppingCart },
  { href: '/admin/commissions', label: 'Commissions', icon: Percent },
  { href: '/admin/reports', label: 'Reports', icon: FileBarChart },
  { href: '/admin/settings', label: 'Settings', icon: Settings },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <RequireRole role="admin"><DashboardShell nav={nav} title="Admin panel" badge="Platform admin">{children}</DashboardShell></RequireRole>;
}
