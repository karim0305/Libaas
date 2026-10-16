import { db, delay, ensureHydrated, mutate, uid } from '../../store';
import { finalPrice } from '../../format';
import type { CartLine, CheckoutDetails, Order, OrderStatus } from '../../types';

/* Sample-mode twin of the database logic (place_order, guard_status, generate_commission, confirm_receipt). */
export async function placeOrder(userId: string, lines: CartLine[], d: CheckoutDetails): Promise<Order[]> {
  await delay(500); ensureHydrated();
  const byShop = new Map<string, CartLine[]>();
  for (const l of lines) {
    const p = db.products.find((x) => x.id === l.product_id);
    if (!p) throw new Error('A product in your cart is no longer available.');
    if (p.stock < l.quantity) throw new Error(`Only ${p.stock} left of "${p.name}". Reduce the quantity and try again.`);
    byShop.set(p.shop_id, [...(byShop.get(p.shop_id) ?? []), l]);
  }
  const created: Order[] = [];
  mutate(() => {
    byShop.forEach((ls, shopId) => {
      const shop = db.shops.find((s) => s.id === shopId)!;
      const items = ls.map((l) => {
        const p = db.products.find((x) => x.id === l.product_id)!;
        p.stock -= l.quantity; p.sold += l.quantity;
        return { product_id: p.id, product_code: p.code, name: p.name, quantity: l.quantity, unit_price: finalPrice(p.price, p.discount_percent), size: l.size, color: l.color };
      });
      const subtotal = items.reduce((s, i) => s + i.unit_price * i.quantity, 0);
      const now = new Date().toISOString();
      const o: Order = {
        id: uid('o'), order_no: `AKS-${Math.floor(100000 + Math.random() * 899999)}`, customer_id: userId, customer_name: d.full_name,
        phone: d.phone, address: d.address, city: d.city, notes: d.notes, shop_id: shopId, shop_name: shop.name, status: 'pending',
        created_at: now, referred_at: null, delivered_at: null, status_changed_at: now, items, subtotal,
        delivery_charge: shop.free_delivery_above != null && subtotal >= shop.free_delivery_above ? 0 : shop.delivery_charge,
        commission_amount: 0, shop_earning: 0, cancel_reason: '', cancelled_by: null, customer_confirmed_at: null, disputed_at: null, dispute_note: '', admin_checked_at: null,
      };
      db.orders.unshift(o); created.push(o);
    });
  });
  return created;
}

export async function listCustomerOrders(userId: string): Promise<Order[]> {
  await delay(); ensureHydrated();
  return db.orders.filter((o) => o.customer_id === userId);
}
/** A shop only sees orders the admin has referred to it. */
export async function listShopOrders(shopId: string): Promise<Order[]> {
  await delay(); ensureHydrated();
  return db.orders.filter((o) => o.shop_id === shopId && o.referred_at);
}
export async function listAllOrders(): Promise<Order[]> {
  await delay(); ensureHydrated();
  return [...db.orders];
}

function apply(o: Order, status: OrderStatus, extra?: { reason?: string; by?: 'customer' | 'shop' | 'admin' }) {
  if (status === 'cancelled' && o.status !== 'cancelled') {
    o.items.forEach((i) => { const p = db.products.find((x) => x.id === i.product_id); if (p) p.stock += i.quantity; });
    o.cancelled_by = extra?.by ?? 'shop';
    o.cancel_reason = extra?.reason ?? '';
  }
  o.status = status;
  o.status_changed_at = new Date().toISOString();
  if (status === 'referred') o.referred_at = new Date().toISOString();
  if (status === 'delivered') {
    o.commission_amount = Math.round(o.subtotal * db.settings.commission_rate);
    o.shop_earning = o.subtotal - o.commission_amount;
    o.delivered_at = new Date().toISOString();
  } else { o.commission_amount = 0; o.shop_earning = 0; }
}

export async function updateOrderStatus(id: string, status: OrderStatus, extra?: { reason?: string; by?: 'customer' | 'shop' | 'admin' }): Promise<void> {
  await delay();
  if (status === 'cancelled' && extra?.by === 'shop' && (extra.reason ?? '').trim().length < 3) throw new Error('Please give a reason for cancelling this order.');
  mutate(() => { const o = db.orders.find((x) => x.id === id); if (o) apply(o, status, extra); });
}

/** The customer says they received the order: marks it delivered, which earns the commission. */
export async function confirmReceipt(orderId: string): Promise<void> {
  await delay();
  mutate(() => {
    const o = db.orders.find((x) => x.id === orderId);
    if (!o || !['confirmed', 'processing', 'shipped'].includes(o.status)) return;
    apply(o, 'delivered'); o.customer_confirmed_at = new Date().toISOString();
  });
}
/** The customer says the shop’s cancellation is untrue. The admin sees it in the delivery checks list. */
export async function disputeCancellation(orderId: string, note: string): Promise<void> {
  await delay();
  mutate(() => { const o = db.orders.find((x) => x.id === orderId); if (o && o.status === 'cancelled' && o.cancelled_by === 'shop') { o.disputed_at = new Date().toISOString(); o.dispute_note = note.slice(0, 500); } });
}
export async function markChecked(orderId: string): Promise<void> {
  await delay(); mutate(() => { const o = db.orders.find((x) => x.id === orderId); if (o) o.admin_checked_at = new Date().toISOString(); });
}
