import { notify } from '../../store';
import { must, sb, UUID } from './_client';
import type { Review, ReviewView } from '../../types';

/* eslint-disable @typescript-eslint/no-explicit-any */
const SEL = '*, products(name, code), shops(name, status)';
function map(r: any): ReviewView {
  const { products, shops, ...x } = r;
  return { ...x, product_name: products?.name ?? 'Product', product_code: products?.code ?? '', shop_name: shops?.name ?? 'Shop' };
}

export async function listProductReviews(productId: string): Promise<ReviewView[]> {
  if (!UUID.test(productId)) return [];
  return must<any[]>(await sb().from('reviews').select(SEL).eq('product_id', productId).eq('is_hidden', false).order('created_at', { ascending: false })).map(map);
}
export async function listHomeReviews(limit: number): Promise<ReviewView[]> {
  return must<any[]>(await sb().from('reviews').select('*, products(name, code), shops!inner(name, status)')
    .eq('shops.status', 'active').eq('is_hidden', false).gte('rating', 4).neq('comment', '').order('created_at', { ascending: false }).limit(limit)).map(map);
}
export async function listMyReviews(userId: string): Promise<Review[]> { return must<Review[]>(await sb().from('reviews').select('*').eq('customer_id', userId)); }
export async function listShopReviews(shopId: string): Promise<ReviewView[]> {
  if (!UUID.test(shopId)) return [];
  return must<any[]>(await sb().from('reviews').select(SEL).eq('shop_id', shopId).order('created_at', { ascending: false })).map(map);
}
export async function listAllReviews(): Promise<ReviewView[]> { return must<any[]>(await sb().from('reviews').select(SEL).order('created_at', { ascending: false })).map(map); }

/** The database function submit_review() checks the order is delivered and belongs to this customer. */
export async function submitReview(_userId: string, input: { order_id: string; product_id: string; rating: number; comment: string }): Promise<void> {
  must(await sb().rpc('submit_review', { p_order_id: input.order_id, p_product_id: input.product_id, p_rating: input.rating, p_comment: input.comment }));
  notify();
}
export async function setReviewHidden(id: string, hidden: boolean): Promise<void> { must(await sb().from('reviews').update({ is_hidden: hidden }).eq('id', id)); notify(); }
