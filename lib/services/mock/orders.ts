import { db, delay, ensureHydrated, mutate, uid } from '../../store';
import { finalPrice } from '../../format';
import type { CartLine, CheckoutDetails, Order, OrderStatus } from '../../types';

/* Sample-mode twin of the database logic (place_order + guard_status + generate_commission). */
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
      const subtotal = items.reduce((s, i) => s + i.unit_price * i.quantity, 0);
      const o: Order = {
        id: uid('o'), order_no: `LB-${Math.floor(100000 + Math.random() * 899999)}`, customer_id: userId, customer_name: d.full_name,
        phone: d.phone, address: d.address, city: d.city, notes: d.notes, shop_id: shopId, shop_name: shop.name, status: 'pending',
        created_at: new Date().toISOString(), referred_at: null, delivered_at: null, items, subtotal,
        delivery_charge: shop.free_delivery_above != null && subtotal >= shop.free_delivery_above ? 0 : shop.delivery_charge,
        commission_amount: 0, shop_earning: 0,
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

export async function updateOrderStatus(id: string, status: OrderStatus): Promise<void> {
  await delay();
  mutate(() => {
    const o = db.orders.find((x) => x.id === id);
    if (!o) return;
    if (status === 'cancelled' && o.status !== 'cancelled') {
      o.items.forEach((i) => { const p = db.products.find((x) => x.id === i.product_id); if (p) p.stock += i.quantity; });
    }
    o.status = status;
    if (status === 'referred') o.referred_at = new Date().toISOString();
    if (status === 'delivered') {
      o.commission_amount = Math.round(o.subtotal * db.settings.commission_rate);
      o.shop_earning = o.subtotal - o.commission_amount;
      o.delivered_at = new Date().toISOString();
    } else { o.commission_amount = 0; o.shop_earning = 0; }
  });
}
