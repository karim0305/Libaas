import { db, delay, ensureHydrated, mutate, uid } from '../../store';
import { finalPrice } from '../../format';
import type { CartLine, CheckoutDetails, Order, OrderStatus } from '../../types';

/*
 * TODO(supabase): call the `place_order` RPC (see supabase/migrations/002_functions.sql).
 * Commission is NOT calculated here: on the database side a trigger fills commission_amount and
 * shop_earning (5%) when status becomes 'delivered'. The sample store mirrors that rule below.
 */
const RATE = 0.05;

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
        return { product_id: p.id, name: p.name, quantity: l.quantity, unit_price: finalPrice(p.price, p.discount_percent), size: l.size, color: l.color };
      });
      const o: Order = {
        id: uid('o'), order_no: `LB-${Math.floor(100000 + Math.random() * 899999)}`, customer_id: userId, customer_name: d.full_name,
        phone: d.phone, address: d.address, city: d.city, notes: d.notes, shop_id: shopId, shop_name: shop.name, status: 'pending',
        created_at: new Date().toISOString(), items, subtotal: items.reduce((s, i) => s + i.unit_price * i.quantity, 0), commission_amount: 0, shop_earning: 0,
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
export async function listShopOrders(shopId: string): Promise<Order[]> {
  await delay(); ensureHydrated();
  return db.orders.filter((o) => o.shop_id === shopId);
}
export async function listAllOrders(): Promise<Order[]> {
  await delay(); ensureHydrated();
  return [...db.orders];
}

export async function updateOrderStatus(id: string, status: OrderStatus): Promise<void> {
  await delay();
  mutate(() => {
    const o = db.orders.find((x) => x.id === id);
    if (!o) return;
    if (status === 'cancelled' && o.status !== 'cancelled') {
      o.items.forEach((i) => { const p = db.products.find((x) => x.id === i.product_id); if (p) p.stock += i.quantity; });
    }
    o.status = status;
    // mirrors the DB trigger: only delivered orders earn commission
    if (status === 'delivered') { o.commission_amount = Math.round(o.subtotal * RATE); o.shop_earning = o.subtotal - o.commission_amount; }
    else { o.commission_amount = 0; o.shop_earning = 0; }
  });
}

