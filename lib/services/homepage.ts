import { isSupabaseConfigured } from '../supabase/client';
import * as mock from './mock/homepage';
import * as live from './supabase/homepage';
import { getProductsByIds, listProducts } from './products';
import { listShops } from './shops';
import { isLive } from '../homeThemes';
import type { HeroSlide, HomeSection, LiveAnnouncement, ProductView } from '../types';

const s = isSupabaseConfigured ? live : mock;
export const listAnnouncements = s.listAnnouncements;
export const saveAnnouncement = s.saveAnnouncement;
export const deleteAnnouncement = s.deleteAnnouncement;
export const reorderAnnouncements = s.reorderAnnouncements;
export const listBanners = s.listBanners;
export const saveBanner = s.saveBanner;
export const deleteBanner = s.deleteBanner;
export const reorderBanners = s.reorderBanners;
export const listSections = s.listSections;
export const saveSection = s.saveSection;
export const uploadSiteImage = s.uploadSiteImage;

const SECTION_DEFAULTS: HomeSection[] = [
  { key: 'featured', title: 'Featured this week', mode: 'manual', shop_id: null, product_ids: [], item_limit: 4, enabled: true },
  { key: 'popular', title: 'Popular right now', mode: 'best_selling', shop_id: null, product_ids: [], item_limit: 4, enabled: true },
  { key: 'latest', title: 'Just added', mode: 'latest', shop_id: null, product_ids: [], item_limit: 4, enabled: true },
];
/** Always returns all three sections, filling in defaults for any row that doesn't exist yet. */
export async function getHomeSections(): Promise<HomeSection[]> {
  const rows = await s.listSections().catch(() => [] as HomeSection[]);
  return SECTION_DEFAULTS.map((d) => rows.find((r) => r.key === d.key) ?? d);
}

/** Products by id, in the admin's order, hiding anything from shops that aren't active. */
async function byIds(ids: string[]): Promise<ProductView[]> {
  if (!ids.length) return [];
  const [prods, shops] = await Promise.all([getProductsByIds(ids), listShops({ activeOnly: true })]);
  const active = new Set(shops.map((x) => x.id));
  return ids.map((id) => prods.find((p) => p.id === id)).filter((p): p is ProductView => !!p && active.has(p.shop_id));
}

export async function resolveSection(sec: HomeSection): Promise<ProductView[]> {
  if (!sec.enabled) return [];
  if (sec.mode === 'manual') return byIds(sec.product_ids);
  return listProducts({ shop: sec.shop_id ?? undefined, sort: sec.mode === 'best_selling' ? 'popular' : 'latest', limit: sec.item_limit });
}

export async function getLiveAnnouncements(): Promise<LiveAnnouncement[]> {
  const [list, shops] = await Promise.all([s.listAnnouncements(), listShops({ activeOnly: true })]);
  const names = new Map(shops.map((x) => [x.id, x.name]));
  return list.filter((a) => isLive(a)).sort((a, b) => a.sort_order - b.sort_order)
    .map((a) => ({ ...a, shop_name: a.shop_id ? names.get(a.shop_id) ?? null : null }))
    .filter((a) => !a.shop_id || a.shop_name); // an announcement for a deactivated shop is hidden
}

export async function getLiveSlides(): Promise<HeroSlide[]> {
  const [list, shops] = await Promise.all([s.listBanners(), listShops({ activeOnly: true })]);
  const byShop = new Map(shops.map((x) => [x.id, x]));
  const liveOnes = list.filter((b) => isLive(b)).sort((a, b) => a.sort_order - b.sort_order).filter((b) => !b.shop_id || byShop.has(b.shop_id));
  return Promise.all(liveOnes.map(async (b) => {
    const shop = b.shop_id ? byShop.get(b.shop_id) : undefined;
    const products = b.product_ids.length ? (await byIds(b.product_ids)).slice(0, 4) : shop ? await listProducts({ shop: shop.id, sort: 'popular', limit: 4 }) : [];
    return { ...b, shop: shop ? { id: shop.id, name: shop.name, city: shop.city } : null, products };
  }));
}
