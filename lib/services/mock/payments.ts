import { db, delay, ensureHydrated, mutate, uid } from '../../store';
import type { PaymentView } from '../../types';

const view = (p: PaymentView | import('../../types').CommissionPayment): PaymentView => ({ ...p, shop_name: db.shops.find((s) => s.id === p.shop_id)?.name ?? 'Shop' });
const newest = (a: { paid_on: string; created_at: string }, b: { paid_on: string; created_at: string }) => b.paid_on.localeCompare(a.paid_on) || b.created_at.localeCompare(a.created_at);

export async function listShopPayments(shopId: string): Promise<PaymentView[]> { await delay(); ensureHydrated(); return db.payments.filter((p) => p.shop_id === shopId).sort(newest).map(view); }
export async function listAllPayments(): Promise<PaymentView[]> { await delay(); ensureHydrated(); return [...db.payments].sort(newest).map(view); }

function check(i: { paid_on: string; amount: number }) {
  if (!(i.amount > 0)) throw new Error('Enter the amount you paid.');
  if (!i.paid_on) throw new Error('Choose the payment date.');
  if (i.paid_on > new Date().toLocaleDateString('en-CA')) throw new Error('The payment date cannot be in the future.');
}
export async function submitPayment(shopId: string, i: { paid_on: string; amount: number; comment: string }): Promise<void> {
  await delay(); check(i);
  mutate(() => { db.payments.push({ id: uid('cp'), shop_id: shopId, paid_on: i.paid_on, amount: Math.round(i.amount), comment: i.comment.slice(0, 500), status: 'not_received', received_at: null, created_at: new Date().toISOString() }); });
}
/** A shop can edit a payment only until the admin marks it received. */
export async function updatePayment(id: string, i: { paid_on: string; amount: number; comment: string }): Promise<void> {
  await delay(); check(i);
  const p = db.payments.find((x) => x.id === id);
  if (!p) throw new Error('Payment not found.');
  if (p.status === 'received') throw new Error('This payment was received by the admin and is locked.');
  mutate(() => { p.paid_on = i.paid_on; p.amount = Math.round(i.amount); p.comment = i.comment.slice(0, 500); });
}
/** Admin marks a payment received. Final: it can't be edited or undone afterwards. */
export async function receivePayment(id: string): Promise<void> {
  await delay();
  const p = db.payments.find((x) => x.id === id);
  if (!p) throw new Error('Payment not found.');
  if (p.status === 'received') throw new Error('This payment is already received.');
  mutate(() => { p.status = 'received'; p.received_at = new Date().toISOString(); });
}
