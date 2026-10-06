import { db, delay, ensureHydrated, mutate, uid } from '../../store';
import type { Category, Order, Profile } from '../../types';

/* TODO(supabase): create SQL views (shop_stats, platform_stats, daily_sales) — see supabase/migrations/003_views.sql. */
import { buildOverview, dailySeries, summarize } from '../calc';
const sum = (a: number[]) => a.reduce((x, y) => x + y, 0);
export { dailySeries, summarize };

export async function adminOverview() {
  await delay(); ensureHydrated();
  return buildOverview(db.orders, db.shops, db.profiles.filter((p) => p.role === 'customer').length, db.products.length);
}

export async function listCustomers(): Promise<(Profile & { orders: number; spent: number })[]> {
  await delay(); ensureHydrated();
  return db.profiles.filter((p) => p.role === 'customer').map((c) => {
    const o = db.orders.filter((x) => x.customer_id === c.id);
    return { ...c, orders: o.length, spent: sum(o.filter((x) => x.status === 'delivered').map((x) => x.subtotal)) };
  });
}

export async function listCategories(): Promise<(Category & { product_count: number })[]> {
  await delay(); ensureHydrated();
  return db.categories.map((c) => ({ ...c, product_count: db.products.filter((p) => p.category_id === c.id).length }));
}
export async function saveCategory(name: string, id?: string): Promise<void> {
  await delay();
  mutate(() => {
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    if (id) { const c = db.categories.find((x) => x.id === id); if (c) { c.name = name; c.slug = slug; } }
    else db.categories.push({ id: uid('c'), name, slug });
  });
}
export async function deleteCategory(id: string): Promise<void> {
  await delay();
  if (db.products.some((p) => p.category_id === id)) throw new Error('This category still has products. Move or delete them first.');
  mutate(() => { db.categories = db.categories.filter((c) => c.id !== id); });
}
export async function publicCategories(): Promise<Category[]> { ensureHydrated(); return db.categories; }
