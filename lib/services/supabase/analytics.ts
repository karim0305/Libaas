import { notify } from '../../store';
import { must, sb } from './_client';
import { buildOverview } from '../calc';
import { listAllOrders } from './orders';
import { listShops } from './shops';
import type { Category, Profile } from '../../types';

/* eslint-disable @typescript-eslint/no-explicit-any */
export async function adminOverview() {
  const [orders, shops, c, p] = await Promise.all([
    listAllOrders(), listShops(),
    sb().from('profiles').select('id', { count: 'exact', head: true }).eq('role', 'customer'),
    sb().from('products').select('id', { count: 'exact', head: true }),
  ]);
  return buildOverview(orders, shops, c.count ?? 0, p.count ?? 0);
}

export async function listCustomers(): Promise<(Profile & { orders: number; spent: number })[]> {
  const [profiles, orders] = await Promise.all([
    sb().from('profiles').select('id, email, full_name, phone, role').eq('role', 'customer').order('created_at', { ascending: false }),
    sb().from('orders').select('customer_id, subtotal, status'),
  ]);
  const o = must<any[]>(orders);
  return must<any[]>(profiles).map((c) => {
    const mine = o.filter((x) => x.customer_id === c.id);
    return { id: c.id, email: c.email ?? '', name: c.full_name || c.email || 'Customer', phone: c.phone ?? undefined, role: 'customer' as const,
      orders: mine.length, spent: mine.filter((x) => x.status === 'delivered').reduce((s, x) => s + Number(x.subtotal), 0) };
  });
}

export async function listCategories(): Promise<(Category & { product_count: number })[]> {
  const rows = must<any[]>(await sb().from('categories').select('*, products(count)').order('name'));
  return rows.map(({ products, ...c }) => ({ ...c, product_count: products?.[0]?.count ?? 0 }));
}
export async function publicCategories(): Promise<Category[]> {
  return must<Category[]>(await sb().from('categories').select('*').order('name'));
}
export async function saveCategory(name: string, id?: string): Promise<void> {
  const row = { name, slug: name.toLowerCase().replace(/[^a-z0-9]+/g, '-') };
  must(id ? await sb().from('categories').update(row).eq('id', id) : await sb().from('categories').insert(row));
  notify();
}
export async function deleteCategory(id: string): Promise<void> {
  const { error } = await sb().from('categories').delete().eq('id', id);
  if (error) throw new Error((error as any).code === '23503' ? 'This category still has products. Move or delete them first.' : error.message);
  notify();
}
