import type { Order, OrderStatus } from '../types';

const sum = (a: number[]) => a.reduce((x, y) => x + y, 0);

export function summarize(orders: Order[]) {
  const delivered = orders.filter((o) => o.status === 'delivered');
  return {
    totalOrders: orders.length,
    pending: orders.filter((o) => o.status === 'pending').length,
    delivered: delivered.length,
    cancelled: orders.filter((o) => o.status === 'cancelled').length,
    sales: sum(delivered.map((o) => o.subtotal)),
    commission: sum(delivered.map((o) => o.commission_amount)),
    earnings: sum(delivered.map((o) => o.shop_earning)),
  };
}

export function dailySeries(orders: Order[], days = 30) {
  const out: { date: string; label: string; sales: number; orders: number; commission: number; earnings: number }[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(Date.now() - i * 86400000);
    const key = d.toISOString().slice(0, 10);
    const day = orders.filter((o) => o.created_at.slice(0, 10) === key);
    const del = day.filter((o) => o.status === 'delivered');
    out.push({ date: key, label: d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }), orders: day.length,
      sales: sum(del.map((o) => o.subtotal)), commission: sum(del.map((o) => o.commission_amount)), earnings: sum(del.map((o) => o.shop_earning)) });
  }
  return out;
}


export function buildOverview(orders: Order[], shops: { id: string; name: string; status: string }[], customers: number, products: number) {
  const s = summarize(orders);
  const topShops = shops.map((shop) => {
    const o = orders.filter((x) => x.shop_id === shop.id && x.status === 'delivered');
    return { name: shop.name, sales: sum(o.map((x) => x.subtotal)), commission: sum(o.map((x) => x.commission_amount)) };
  }).sort((a, b) => b.sales - a.sales).slice(0, 5);
  const prod = new Map<string, number>();
  orders.filter((o) => o.status === 'delivered').forEach((o) => o.items.forEach((i) => prod.set(i.name, (prod.get(i.name) ?? 0) + i.quantity * i.unit_price)));
  const topProducts = [...prod.entries()].map(([name, sales]) => ({ name, sales })).sort((a, b) => b.sales - a.sales).slice(0, 5);
  return {
    ...s, shops: shops.length, activeShops: shops.filter((x) => x.status === 'active').length, pendingShops: shops.filter((x) => x.status === 'pending').length,
    customers, products, series: dailySeries(orders), topShops, topProducts,
  };
}

/** Statuses a shop may move an order to from its current status. */
export function nextStatuses(s: OrderStatus): OrderStatus[] {
  const flow: Record<OrderStatus, OrderStatus[]> = {
    pending: ['confirmed', 'cancelled'], confirmed: ['processing', 'cancelled'], processing: ['shipped', 'cancelled'],
    shipped: ['delivered', 'cancelled'], delivered: [], cancelled: [],
  };
  return flow[s];
}
