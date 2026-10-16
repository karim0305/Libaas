import { notify } from '../../store';
import { must, sb, UUID } from './_client';
import type { CartLine, CheckoutDetails, Order, OrderStatus } from '../../types';

/* eslint-disable @typescript-eslint/no-explicit-any */
const SEL = '*, shops(name), order_items(product_id, product_code, name, quantity, unit_price, size, color)';

function map(r: any): Order {
  const { shops, order_items, ...o } = r;
  return { ...o, shop_name: shops?.name ?? 'Shop', items: (order_items ?? []).map((i: any) => ({ ...i, unit_price: Number(i.unit_price) })),
    delivery_charge: Number(o.delivery_charge ?? 0), subtotal: Number(o.subtotal), commission_amount: Number(o.commission_amount), shop_earning: Number(o.shop_earning) };
}

/** Prices, stock and splitting by shop are all handled inside the database function place_order(). */
export async function placeOrder(_userId: string, lines: CartLine[], d: CheckoutDetails): Promise<Order[]> {
  const valid = lines.filter((l) => UUID.test(l.product_id));
  if (!valid.length) throw new Error('Your cart has old items. Empty the cart and add products again.');
  const created = must<any[]>(await sb().rpc('place_order', {
    p_name: d.full_name, p_phone: d.phone, p_address: d.address, p_city: d.city, p_notes: d.notes, p_items: valid,
  }));
  const ids = created.map((o) => o.id);
  const rows = must<any[]>(await sb().from('orders').select(SEL).in('id', ids));
  notify();
  return rows.map(map);
}

const list = async (col?: string, val?: string, referredOnly = false) => {
  let q: any = sb().from('orders').select(SEL).order('created_at', { ascending: false });
  if (col && val) q = q.eq(col, val);
  if (referredOnly) q = q.not('referred_at', 'is', null); // shops only see orders the admin referred
  return must<any[]>(await q).map(map);
};
export const listCustomerOrders = (userId: string) => list('customer_id', userId);
export const listShopOrders = (shopId: string) => (UUID.test(shopId) ? list('shop_id', shopId, true) : Promise.resolve([] as Order[]));
export const listAllOrders = () => list();

/** The database trigger writes commission_amount / shop_earning (at the admin’s rate) when status becomes 'delivered'. */
export async function updateOrderStatus(id: string, status: OrderStatus, extra?: { reason?: string; by?: 'customer' | 'shop' | 'admin' }): Promise<void> {
  // the trigger decides who cancelled (customer, shop or admin) and requires a reason from shops
  must(await sb().from('orders').update(status === 'cancelled' && extra?.reason ? { status, cancel_reason: extra.reason } : { status }).eq('id', id));
  notify();
}

/** Customer confirms they received the order -> delivered -> commission (database function confirm_receipt). */
export async function confirmReceipt(orderId: string): Promise<void> { must(await sb().rpc('confirm_receipt', { p_order_id: orderId })); notify(); }
export async function disputeCancellation(orderId: string, note: string): Promise<void> { must(await sb().rpc('dispute_cancellation', { p_order_id: orderId, p_note: note })); notify(); }
export async function markChecked(orderId: string): Promise<void> { must(await sb().from('orders').update({ admin_checked_at: new Date().toISOString() }).eq('id', orderId)); notify(); }
