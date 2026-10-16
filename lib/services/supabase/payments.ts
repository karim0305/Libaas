import { notify } from '../../store';
import { must, sb, UUID } from './_client';
import type { PaymentView } from '../../types';

/* eslint-disable @typescript-eslint/no-explicit-any */
const map = (r: any): PaymentView => { const { shops, ...p } = r; return { ...p, amount: Number(p.amount), shop_name: shops?.name ?? 'Shop' }; };
const friendly = (e: { message: string } | null) => { if (e) throw new Error(e.message); };

export async function listShopPayments(shopId: string): Promise<PaymentView[]> {
  if (!UUID.test(shopId)) return [];
  return must<any[]>(await sb().from('commission_payments').select('*, shops(name)').eq('shop_id', shopId).order('paid_on', { ascending: false }).order('created_at', { ascending: false })).map(map);
}
export async function listAllPayments(): Promise<PaymentView[]> {
  return must<any[]>(await sb().from('commission_payments').select('*, shops(name)').order('paid_on', { ascending: false }).order('created_at', { ascending: false })).map(map);
}
// The database trigger locks received payments and stops shops changing status, so these are safe from the browser.
export async function submitPayment(shopId: string, i: { paid_on: string; amount: number; comment: string }): Promise<void> {
  friendly((await sb().from('commission_payments').insert({ shop_id: shopId, paid_on: i.paid_on, amount: i.amount, comment: i.comment })).error); notify();
}
export async function updatePayment(id: string, i: { paid_on: string; amount: number; comment: string }): Promise<void> {
  const r = await sb().from('commission_payments').update({ paid_on: i.paid_on, amount: i.amount, comment: i.comment }).eq('id', id).select('id');
  friendly(r.error); if (!r.data?.length) throw new Error('This payment was received by the admin and is locked.'); notify();
}
export async function receivePayment(id: string): Promise<void> {
  const r = await sb().from('commission_payments').update({ status: 'received' }).eq('id', id).select('id');
  friendly(r.error); if (!r.data?.length) throw new Error('This payment is already received.'); notify();
}
