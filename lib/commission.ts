/**
 * Display-side commission maths.
 * The source of truth is the Postgres trigger `generate_commission` (see supabase/migrations),
 * which writes commission_amount / shop_earning when an order becomes "delivered".
 * These helpers only format previews (e.g. "what will I earn on this order").
 */
export const COMMISSION_RATE = 0.05;

export function previewCommission(subtotal: number) {
  const commission = Math.round(subtotal * COMMISSION_RATE);
  return { commission, shopEarning: subtotal - commission };
}
