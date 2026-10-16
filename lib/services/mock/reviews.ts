import { db, delay, ensureHydrated, mutate, uid } from '../../store';
import type { Review, ReviewView } from '../../types';

const view = (r: Review): ReviewView => {
  const p = db.products.find((x) => x.id === r.product_id);
  return { ...r, product_name: p?.name ?? 'Product', product_code: p?.code ?? '', shop_name: db.shops.find((s) => s.id === r.shop_id)?.name ?? 'Shop' };
};
const newest = (a: Review, b: Review) => b.created_at.localeCompare(a.created_at);
const shopActive = (id: string) => db.shops.find((s) => s.id === id)?.status === 'active';

export async function listProductReviews(productId: string): Promise<ReviewView[]> {
  await delay(80); ensureHydrated();
  return db.reviews.filter((r) => r.product_id === productId && !r.is_hidden).sort(newest).map(view);
}
export async function listHomeReviews(limit: number): Promise<ReviewView[]> {
  await delay(80); ensureHydrated();
  return db.reviews.filter((r) => !r.is_hidden && r.rating >= 4 && r.comment.trim() && shopActive(r.shop_id)).sort(newest).slice(0, limit).map(view);
}
export async function listMyReviews(userId: string): Promise<Review[]> { await delay(60); ensureHydrated(); return db.reviews.filter((r) => r.customer_id === userId); }
export async function listShopReviews(shopId: string): Promise<ReviewView[]> { await delay(); ensureHydrated(); return db.reviews.filter((r) => r.shop_id === shopId && !r.is_hidden).sort(newest).map(view); }
export async function listAllReviews(): Promise<ReviewView[]> { await delay(); ensureHydrated(); return [...db.reviews].sort(newest).map(view); }

/** Only the customer of a DELIVERED order can review a product from it, once per order item (sending again edits it). */
export async function submitReview(userId: string, input: { order_id: string; product_id: string; rating: number; comment: string }): Promise<void> {
  await delay(); ensureHydrated();
  const o = db.orders.find((x) => x.id === input.order_id && x.customer_id === userId);
  if (!o) throw new Error('Order not found.');
  if (o.status !== 'delivered') throw new Error('You can review a product after the order is delivered.');
  if (!o.items.some((i) => i.product_id === input.product_id)) throw new Error('That product is not in this order.');
  if (!(input.rating >= 1 && input.rating <= 5)) throw new Error('Choose a rating from 1 to 5 stars.');
  const name = db.profiles.find((p) => p.id === userId)?.name ?? 'Customer';
  const [f, l] = name.split(' ');
  mutate(() => {
    const ex = db.reviews.find((r) => r.order_id === input.order_id && r.product_id === input.product_id);
    if (ex) { ex.rating = input.rating; ex.comment = input.comment.slice(0, 600); }
    else db.reviews.push({ id: uid('r'), order_id: o.id, product_id: input.product_id, shop_id: o.shop_id, customer_id: userId, customer_name: l ? `${f} ${l[0]}.` : f, rating: input.rating, comment: input.comment.slice(0, 600), is_hidden: false, created_at: new Date().toISOString() });
  });
}
export async function setReviewHidden(id: string, hidden: boolean): Promise<void> { await delay(); mutate(() => { const r = db.reviews.find((x) => x.id === id); if (r) r.is_hidden = hidden; }); }
