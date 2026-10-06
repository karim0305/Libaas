import { db, delay, ensureHydrated, mutate, uid } from '../../store';
import type { Profile, Shop, ShopStatus } from '../../types';

/* TODO(supabase): shops table; owner = auth.uid(); admin approval flips `status`. */
export async function listShops(opts: { activeOnly?: boolean } = {}): Promise<(Shop & { product_count: number })[]> {
  await delay(); ensureHydrated();
  return db.shops
    .filter((s) => !opts.activeOnly || s.status === 'active')
    .map((s) => ({ ...s, product_count: db.products.filter((p) => p.shop_id === s.id).length }));
}

export async function getShop(id: string): Promise<Shop | null> {
  await delay(); ensureHydrated();
  return db.shops.find((s) => s.id === id) ?? null;
}

export async function setShopStatus(id: string, status: ShopStatus): Promise<void> {
  await delay();
  mutate(() => { const s = db.shops.find((x) => x.id === id); if (s) s.status = status; });
}

export async function updateShop(id: string, patch: Partial<Pick<Shop, 'name' | 'description' | 'city' | 'phone'>>): Promise<void> {
  await delay();
  mutate(() => { const s = db.shops.find((x) => x.id === id); if (s) Object.assign(s, patch); });
}

export async function registerShop(input: { owner_name: string; email: string; password: string; shop_name: string; city: string; phone: string; description: string }): Promise<Profile> {
  await delay(); ensureHydrated();
  if (input.password.length < 6) throw new Error('Password must be at least 6 characters.');
  if (db.profiles.some((p) => p.email.toLowerCase() === input.email.toLowerCase())) throw new Error('An account with this email already exists.');
  const shopId = uid('s'); const userId = uid('u-');
  const user: Profile = { id: userId, email: input.email, name: input.owner_name, phone: input.phone, role: 'shop', shop_id: shopId };
  mutate(() => {
    db.profiles.push(user);
    db.shops.push({ id: shopId, owner_id: userId, name: input.shop_name, slug: input.shop_name.toLowerCase().replace(/[^a-z0-9]+/g, '-'), description: input.description, city: input.city, phone: input.phone, status: 'pending', created_at: new Date().toISOString() });
  });
  localStorage.setItem('libaas_session', userId);
  return user;
}
