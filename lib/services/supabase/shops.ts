import { notify } from '../../store';
import { must, sb, UUID } from './_client';
import { loadProfile, signUp } from './auth';
import type { Profile, Shop, ShopStatus } from '../../types';

/* eslint-disable @typescript-eslint/no-explicit-any */
export async function listShops(opts: { activeOnly?: boolean } = {}): Promise<(Shop & { product_count: number })[]> {
  let q: any = sb().from('shops').select('*, products(count)').order('created_at', { ascending: false });
  if (opts.activeOnly) q = q.eq('status', 'active');
  return must<any[]>(await q).map(({ products, ...s }) => ({ ...s, product_count: products?.[0]?.count ?? 0 }));
}

export async function getShop(id: string): Promise<Shop | null> {
  if (!UUID.test(id)) return null;
  return must<Shop | null>(await sb().from('shops').select('*').eq('id', id).maybeSingle());
}

export async function setShopStatus(id: string, status: ShopStatus): Promise<void> {
  must(await sb().from('shops').update({ status }).eq('id', id));
  notify();
}

export async function updateShop(id: string, patch: Partial<Pick<Shop, 'name' | 'description' | 'city' | 'phone' | 'delivery_charge' | 'free_delivery_above'>>): Promise<void> {
  must(await sb().from('shops').update(patch).eq('id', id));
  notify();
}

export async function registerShop(input: { owner_name: string; email: string; password: string; shop_name: string; city: string; phone: string; description: string }): Promise<Profile> {
  const u = await signUp(input.email, input.password, input.owner_name, input.phone);
  must(await sb().rpc('register_shop', { p_name: input.shop_name, p_city: input.city, p_phone: input.phone, p_description: input.description }));
  return loadProfile(u.id, u.email ?? input.email);
}
