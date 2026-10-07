import { notify } from '../../store';
import { finalPrice } from '../../format';
import { must, sb, UUID } from './_client';
import type { Product, ProductView } from '../../types';
import type { ProductFilters } from '../mock/products';

/* eslint-disable @typescript-eslint/no-explicit-any */
const SEL = '*, shops(name, status, delivery_charge, free_delivery_above), categories(name), product_images(url, position)';

function map(r: any): ProductView {
  const { shops, categories, product_images, ...p } = r;
  const images = [...(product_images ?? [])].sort((a: any, b: any) => a.position - b.position).map((i: any) => i.url);
  return { ...p, price: Number(p.price), images, shop_name: shops?.name ?? 'Shop', delivery_charge: Number(shops?.delivery_charge ?? 0), free_delivery_above: shops?.free_delivery_above == null ? null : Number(shops.free_delivery_above), category_name: categories?.name ?? 'Clothing', final_price: finalPrice(Number(p.price), p.discount_percent) };
}

export async function listProducts(f: ProductFilters = {}): Promise<ProductView[]> {
  let q: any = sb().from('products').select('*, shops!inner(name, status, delivery_charge, free_delivery_above), categories(name), product_images(url, position)').eq('shops.status', 'active');
  if (f.category) q = q.eq('category_id', f.category);
  if (f.shop) q = q.eq('shop_id', f.shop);
  if (f.size) q = q.contains('sizes', [f.size]);
  if (f.featured) q = q.eq('featured', true);
  if (f.q?.trim()) { const t = f.q.replace(/[%,()]/g, ' ').trim(); q = q.or(`name.ilike.%${t}%,description.ilike.%${t}%`); }
  let list = must<any[]>(await q).map(map);
  if (f.minPrice != null) list = list.filter((p) => p.final_price >= f.minPrice!);
  if (f.maxPrice != null) list = list.filter((p) => p.final_price <= f.maxPrice!);
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
  if (!UUID.test(id)) return null;
  const r = must<any>(await sb().from('products').select(SEL).eq('id', id).maybeSingle());
  return r ? map(r) : null;
}

export async function getProductsByIds(ids: string[]): Promise<ProductView[]> {
  const valid = ids.filter((i) => UUID.test(i));
  if (!valid.length) return [];
  return must<any[]>(await sb().from('products').select(SEL).in('id', valid)).map(map);
}

export async function relatedProducts(id: string): Promise<ProductView[]> {
  const p = await getProduct(id);
  if (!p) return [];
  const rows = must<any[]>(await sb().from('products').select('*, shops!inner(name, status, delivery_charge, free_delivery_above), categories(name), product_images(url, position)')
    .eq('shops.status', 'active').neq('id', id).or(`category_id.eq.${p.category_id},shop_id.eq.${p.shop_id}`).limit(4));
  return rows.map(map);
}

export async function listShopProducts(shopId: string): Promise<ProductView[]> {
  if (!UUID.test(shopId)) return [];
  return must<any[]>(await sb().from('products').select(SEL).eq('shop_id', shopId).order('created_at', { ascending: false })).map(map);
}

export async function listAllProducts(): Promise<ProductView[]> {
  return must<any[]>(await sb().from('products').select(SEL).order('created_at', { ascending: false })).map(map);
}

/** New photos arrive as data URLs from the form; upload them to Storage and keep existing URLs as they are. */
async function uploadImages(shopId: string, images: string[]): Promise<string[]> {
  const out: string[] = [];
  for (const src of images) {
    if (!src.startsWith('data:')) { out.push(src); continue; }
    const blob = await (await fetch(src)).blob();
    const path = `${shopId}/${crypto.randomUUID()}.${blob.type.split('/')[1] || 'jpg'}`;
    const up = await sb().storage.from('product-images').upload(path, blob, { contentType: blob.type });
    if (up.error) throw new Error(`Photo upload failed: ${up.error.message}`);
    out.push(sb().storage.from('product-images').getPublicUrl(path).data.publicUrl);
  }
  return out;
}

export async function saveProduct(input: Omit<Product, 'id' | 'created_at' | 'sold'> & { id?: string }): Promise<void> {
  const row = { shop_id: input.shop_id, category_id: input.category_id, name: input.name, description: input.description, price: input.price,
    discount_percent: input.discount_percent, stock: input.stock, sizes: input.sizes, colors: input.colors, featured: input.featured };
  let id = input.id;
  if (id) must(await sb().from('products').update(row).eq('id', id));
  else id = must<any>(await sb().from('products').insert(row).select('id').single()).id as string;

  const urls = await uploadImages(input.shop_id, input.images);
  must(await sb().from('product_images').delete().eq('product_id', id));
  if (urls.length) must(await sb().from('product_images').insert(urls.map((url, position) => ({ product_id: id, url, position }))));
  notify();
}

export async function deleteProduct(id: string): Promise<void> {
  must(await sb().from('products').delete().eq('id', id));
  notify();
}
