import type { Order } from './types';

/** Orders with no status update for this many days are flagged for the admin to follow up. */
export const FOLLOW_UP_DAYS = 5;

export interface Flag { kind: 'overdue' | 'shop_cancelled' | 'disputed'; label: string }

/**
 * Why an order needs the admin's attention. Commission is only earned on delivery, so these catch a shop that
 * (a) never marks a delivered order as delivered, or (b) cancels an order and blames the customer.
 * An order drops off the list once the admin marks it as checked.
 */
export function attentionFlags(o: Order, now = Date.now()): Flag[] {
  if (o.admin_checked_at) return [];
  const f: Flag[] = [];
  if (['confirmed', 'processing', 'shipped'].includes(o.status)) {
    const days = Math.floor((now - new Date(o.status_changed_at).getTime()) / 86400000);
    if (days >= FOLLOW_UP_DAYS) f.push({ kind: 'overdue', label: `No update for ${days} days (${o.status})` });
  }
  if (o.status === 'cancelled' && o.cancelled_by === 'shop') f.push({ kind: 'shop_cancelled', label: `Cancelled by shop: ${o.cancel_reason || 'no reason given'}` });
  if (o.disputed_at) f.push({ kind: 'disputed', label: 'Customer disputes the cancellation' });
  return f;
}
