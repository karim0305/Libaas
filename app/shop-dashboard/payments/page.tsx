'use client';
import { useState } from 'react';
import { Banknote, Percent, Wallet } from 'lucide-react';
import { useQuery } from '@/lib/hooks';
import { useMyShop } from '@/components/useMyShop';
import { useToast } from '@/components/Providers';
import { listShopOrders } from '@/lib/services/orders';
import { listShopPayments, submitPayment, updatePayment } from '@/lib/services/payments';
import { summarize } from '@/lib/services/analytics';
import PaymentBadge from '@/components/PaymentBadge';
import StatCard from '@/components/ui/StatCard';
import { EmptyState, ErrorState, Skeleton } from '@/components/ui/States';
import { BRAND } from '@/lib/brand';
import { rs, shortDate } from '@/lib/format';
import type { PaymentView } from '@/lib/types';

const today = () => new Date().toLocaleDateString('en-CA');
const dayLabel = (d: string) => shortDate(`${d}T00:00:00`);

export default function ShopPayments() {
  const { shopId } = useMyShop(); const toast = useToast();
  const pay = useQuery(() => listShopPayments(shopId), [shopId]);
  const ord = useQuery(() => listShopOrders(shopId), [shopId]);
  const [editing, setEditing] = useState<PaymentView | null>(null);
  const [date, setDate] = useState(today()); const [amount, setAmount] = useState(''); const [comment, setComment] = useState('');
  const [busy, setBusy] = useState(false);

  const startEdit = (p: PaymentView) => { setEditing(p); setDate(p.paid_on); setAmount(String(p.amount)); setComment(p.comment); window.scrollTo({ top: 0, behavior: 'smooth' }); };
  const reset = () => { setEditing(null); setDate(today()); setAmount(''); setComment(''); };
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const n = Number(amount);
    if (!(n > 0)) { toast('Enter the amount you paid.', 'error'); return; }
    if (!date || date > today()) { toast('Choose a payment date that is not in the future.', 'error'); return; }
    setBusy(true);
    try {
      const input = { paid_on: date, amount: n, comment: comment.trim() };
      if (editing) await updatePayment(editing.id, input); else await submitPayment(shopId, input);
      toast(editing ? 'Payment updated.' : 'Payment submitted. The admin will confirm when it is received.'); reset();
    } catch (x) { toast((x as Error).message, 'error'); }
    setBusy(false);
  };

  if (pay.error) return <ErrorState message={pay.error} retry={pay.reload} />;
  if (pay.loading || ord.loading || !pay.data || !ord.data) return <Skeleton className="h-96" />;
  const list = pay.data;
  const sum = (s: 'received' | 'not_received') => list.filter((p) => p.status === s).reduce((a, p) => a + p.amount, 0);
  const owed = summarize(ord.data).commission; const received = sum('received'); const waiting = sum('not_received');
  const total = received + waiting;

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Commission on delivered orders" value={rs(owed)} icon={Percent} tone="crimson" />
        <StatCard label={`Received by ${BRAND.name}`} value={rs(received)} icon={Wallet} tone="green" hint="Confirmed by the admin" />
        <StatCard label="Balance to pay" value={rs(Math.max(0, owed - received))} icon={Banknote} tone="gold" hint={waiting ? `${rs(waiting)} submitted, waiting for the admin` : 'Commission minus received payments'} />
      </div>

      <form onSubmit={submit} className="card space-y-4 p-5">
        <div><h2 className="text-base font-semibold">{editing ? 'Edit payment' : 'Submit a commission payment'}</h2><p className="mt-0.5 text-sm text-slate-600">Paid your commission to {BRAND.name}? Enter the date, the amount and a note (bank, JazzCash, Easypaisa, reference number). You can edit it until the admin marks it received.</p></div>
        <div className="grid gap-4 sm:grid-cols-3">
          <div><label className="label" htmlFor="pd">Payment date</label><input id="pd" type="date" className="input" max={today()} value={date} onChange={(e) => setDate(e.target.value)} /></div>
          <div><label className="label" htmlFor="pa">Amount (Rs.)</label><input id="pa" inputMode="numeric" className="input" placeholder="e.g. 1500" value={amount} onChange={(e) => setAmount(e.target.value.replace(/[^\d.]/g, ''))} /></div>
          <div className="sm:col-span-3"><label className="label" htmlFor="pc">Comment</label><textarea id="pc" rows={2} maxLength={500} className="input" placeholder="e.g. Bank transfer, ref 88421" value={comment} onChange={(e) => setComment(e.target.value)} /></div>
        </div>
        <div className="flex gap-2"><button className="btn btn-primary" disabled={busy}>{busy ? 'Saving…' : editing ? 'Save changes' : 'Submit payment'}</button>{editing && <button type="button" className="btn btn-ghost" onClick={reset}>Cancel</button>}</div>
      </form>

      <div className="card overflow-hidden">
        <h2 className="border-b border-line p-4 text-base font-semibold">Your submitted payments</h2>
        {list.length === 0 ? <EmptyState title="No payments yet" text="Payments you submit appear here with their status." /> : (
          <div className="overflow-x-auto"><table className="w-full">
            <thead><tr><th className="th">Date</th><th className="th text-right">Amount</th><th className="th">Comment</th><th className="th">Status</th><th className="th">Submitted</th><th className="th">Action</th></tr></thead>
            <tbody className="divide-y divide-line">{list.map((p) => (
              <tr key={p.id}><td className="td">{dayLabel(p.paid_on)}</td><td className="td text-right font-medium">{rs(p.amount)}</td><td className="td max-w-[280px] whitespace-normal text-slate-700">{p.comment || <span className="text-slate-400">–</span>}</td>
                <td className="td"><PaymentBadge status={p.status} />{p.received_at && <span className="mt-0.5 block text-xs text-slate-500">on {shortDate(p.received_at)}</span>}</td><td className="td text-slate-500">{shortDate(p.created_at)}</td>
                <td className="td">{p.status === 'not_received' ? <button className="btn btn-outline btn-sm" onClick={() => startEdit(p)}>Edit</button> : <span className="text-xs text-slate-400">Locked</span>}</td></tr>))}</tbody>
            <tfoot>
              <tr className="bg-surface font-semibold"><td className="td">Total submitted</td><td className="td text-right">{rs(total)}</td><td className="td" colSpan={4} />
              </tr>
              <tr className="bg-surface text-sm"><td className="td text-green-700">Received</td><td className="td text-right text-green-700">{rs(received)}</td><td className="td text-amber-700" colSpan={1}>Not received</td><td className="td text-amber-700" colSpan={3}>{rs(waiting)}</td></tr>
            </tfoot></table></div>)}
      </div>
    </div>
  );
}
