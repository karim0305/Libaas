import { db, delay, ensureHydrated, mutate, uid } from '../../store';
import { finalPrice } from '../../format';
import type { Product, ProductView } from '../../types';

/* TODO(supabase): .from('products').select('*, shops(name), categories(name), product_images(url)') — RLS hides inactive shops. */
function view(p: Product): ProductView {
  return {
    ...p,
    shop_name: db.shops.find((s) => s.id === p.shop_id)?.name ?? 'Shop',
    delivery_charge: db.shops.find((s) => s.id === p.shop_id)?.delivery_charge ?? 0,
    free_delivery_above: db.shops.find((s) => s.id === p.shop_id)?.free_delivery_above ?? null,
    category_name: db.categories.find((c) => c.id === p.category_id)?.name ?? 'Clothing',
    final_price: finalPrice(p.price, p.discount_percent),
  };
}
const shopActive = (id: string) => db.shops.find((s) => s.id === id)?.status === 'active';

export interface ProductFilters {
  q?: string; category?: string; shop?: string; size?: string; minPrice?: number; maxPrice?: number;
  sort?: 'latest' | 'popular' | 'price-asc' | 'price-desc'; featured?: boolean; limit?: number;
}

export async function listProducts(f: ProductFilters = {}): Promise<ProductView[]> {
  await delay(); ensureHydrated();
  const q = f.q?.trim().toLowerCase();
  let list = db.products.filter((p) => shopActive(p.shop_id)).map(view);
  if (q) list = list.filter((p) => `${p.name} ${p.shop_name} ${p.category_name}`.toLowerCase().includes(q));
  if (f.category) list = list.filter((p) => p.category_id === f.category);
  if (f.shop) list = list.filter((p) => p.shop_id === f.shop);
  if (f.size) list = list.filter((p) => p.sizes.includes(f.size!));
  if (f.minPrice != null) list = list.filter((p) => p.final_price >= f.minPrice!);
  if (f.maxPrice != null) list = list.filter((p) => p.final_price <= f.maxPrice!);
  if (f.featured) list = list.filter((p) => p.featured);
  const sorts = {
    latest: (a: ProductView, b: ProductView) => b.created_at.localeCompare(a.created_at),
    popular: (a: ProductView, b: ProductView) => b.sold - a.sold,
    'price-asc': (a: ProductView, b: ProductView) => a.final_price - b.final_price,
    'price-desc': (a: ProductView, b: ProductView) => b.final_price - a.final_price,
  };
  list.sort(sorts[f.sort ?? 'latest']);
  return f.limit ? list.slice(0, f.limit) : list;
}

export async function getProduct(id: string): Promise<ProductView | null> {
  await delay(); ensureHydrated();
  const p = db.products.find((x) => x.id === id);
  return p ? view(p) : null;
}

export async function getProductsByIds(ids: string[]): Promise<ProductView[]> {
  ensureHydrated();
  return db.products.filter((p) => ids.includes(p.id)).map(view);
}

export async function relatedProducts(id: string): Promise<ProductView[]> {
  await delay(); ensureHydrated();
  const p = db.products.find((x) => x.id === id);
  if (!p) return [];
  return db.products.filter((x) => x.id !== id && shopActive(x.shop_id) && (x.category_id === p.category_id || x.shop_id === p.shop_id)).slice(0, 4).map(view);
}

export async function listShopProducts(shopId: string): Promise<ProductView[]> {
  await delay(); ensureHydrated();
  return db.products.filter((p) => p.shop_id === shopId).map(view).sort((a, b) => b.created_at.localeCompare(a.created_at));
}

export async function listAllProducts(): Promise<ProductView[]> {
  await delay(); ensureHydrated();
  return db.products.map(view);
}

export async function saveProduct(input: Omit<Product, 'id' | 'created_at' | 'sold'> & { id?: string }): Promise<void> {
  await delay();
  mutate(() => {
    if (input.id) {
      const i = db.products.findIndex((p) => p.id === input.id);
      if (i >= 0) db.products[i] = { ...db.products[i], ...input } as Product;
    } else {
      db.products.unshift({ ...input, id: uid('p'), created_at: new Date().toISOString(), sold: 0 });
    }
  });
}

export async function deleteProduct(id: string): Promise<void> {
  await delay();
  mutate(() => { db.products = db.products.filter((p) => p.id !== id); });
}
