import type { ProductView } from './types';

type Line = { p: Pick<ProductView, 'shop_id' | 'shop_name' | 'final_price' | 'delivery_charge' | 'free_delivery_above'>; quantity: number };
export interface ShopDelivery { shop_id: string; shop_name: string; subtotal: number; baseCharge: number; charge: number; freeAbove: number | null }

/**
 * Delivery is set by each shop, and a cart is split into one order per shop,
 * so delivery is worked out per shop. (The database function place_order() re-calculates it server-side.)
 */
export function calcDelivery(rows: Line[]) {
  const map = new Map<string, ShopDelivery>();
  for (const { p, quantity } of rows) {
    const e = map.get(p.shop_id) ?? { shop_id: p.shop_id, shop_name: p.shop_name, subtotal: 0, baseCharge: p.delivery_charge, charge: 0, freeAbove: p.free_delivery_above };
    e.subtotal += p.final_price * quantity;
    map.set(p.shop_id, e);
  }
  const shops = [...map.values()].map((s) => ({ ...s, charge: s.freeAbove != null && s.subtotal >= s.freeAbove ? 0 : s.baseCharge }));
  return { shops, total: shops.reduce((a, s) => a + s.charge, 0) };
}
