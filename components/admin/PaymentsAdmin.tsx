'use client';
import { useState } from 'react';
import { useQuery } from '@/lib/hooks';
import { listAllPayments, receivePayment } from '@/lib/services/payments';
import { listAllOrders } from '@/lib/services/orders';
import { listShops } from '@/lib/services/shops';
import { summarize } from '@/lib/services/analytics';
import { useConfirm, useToast } from '../Providers';
import PaymentBadge from '../PaymentBadge';
import { EmptyState, ErrorState, TableSkeleton } from '../ui/States';
import { rs, shortDate } from '@/lib/format';

const dayLabel = (d: string) => shortDate(`${d}T00:00:00`);

/** Admin: every commission payment shops have submitted. Filter by shop, mark received (final). */
export default function PaymentsAdmin() {
  const pay = useQuery(listAllPayments); const shops = useQuery(() => listShops()); const orders = useQuery(listAllOrders);
  const confirm = useConfirm(); const toast = useToast();
  const [shop, setShop] = useState('');
  const [busy, setBusy] = useState<string | null>(null);

  if (pay.error) return <ErrorState message={pay.error} retry={pay.reload} />;
  const all = pay.data ?? [];
  const rows = all.filter((p) => !shop || p.shop_id === shop);
  const sum = (s: 'received' | 'not_received') => rows.filter((p) => p.status === s).reduce((a, p) => a + p.amount, 0);
  const received = sum('received'); const waiting = sum('not_received');
  const shopRow = shops.data?.find((s) => s.id === shop);
  const owed = shop && orders.data ? summarize(orders.data.filter((o) => o.shop_id === shop)).commission : null;

  const receive = async (id: string, name: string, amount: number) => {
    if (!(await confirm({ title: `Mark ${rs(amount)} from ${name} as received?`, message: 'This is final. After it is received, neither you nor the shop can change or undo it.', confirmLabel: 'Mark received' }))) return;
    setBusy(id);
    try { await receivePayment(id); toast(`${rs(amount)} from ${name} marked received.`); } catch (x) { toast((x as Error).message, 'error'); }
    setBusy(null);
  };

  return (
    <div className="card overflow-hidden">
      <div className="border-b border-line p-4">
        <h2 className="text-base font-semibold">Commission payments from shops</h2>
        <p className="mt-0.5 text-xs text-slate-500">Payments the shops say they have made. Mark one received once the money has reached you.</p>
        <div className="mt-3 flex flex-wrap items-end gap-3">
          <div><label className="label" htmlFor="pshop">Shop</label><select id="pshop" className="input !w-auto min-w-[220px]" value={shop} onChange={(e) => setShop(e.target.value)}><option value="">All shops</option>{(shops.data ?? []).map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}</select></div>
          <div className="flex flex-wrap gap-4 text-sm">
            <span>Total submitted: <b>{rs(received + waiting)}</b></span>
            <span className="text-green-700">Received: <b>{rs(received)}</b></span>
            <span className="text-amber-700">Not received: <b>{rs(waiting)}</b></span>
            {owed !== null && <span className="text-crimson">{shopRow?.name} commission owed: <b>{rs(owed)}</b> · balance <b>{rs(Math.max(0, owed - received))}</b></span>}
          </div>
        </div>
      </div>
      {pay.loading ? <TableSkeleton rows={3} /> : rows.length === 0 ? <EmptyState title="No payments" text={shop ? 'This shop has not submitted any payment.' : 'Payments submitted by shops will appear here.'} /> : (
        <div className="overflow-x-auto"><table className="w-full">
          <thead><tr><th className="th">Shop</th><th className="th">Date</th><th className="th text-right">Amount</th><th className="th">Comment</th><th className="th">Status</th><th className="th">Submitted</th><th className="th">Action</th></tr></thead>
          <tbody className="divide-y divide-line">{rows.map((p) => (
            <tr key={p.id}><td className="td font-medium">{p.shop_name}</td><td className="td">{dayLabel(p.paid_on)}</td><td className="td text-right font-medium">{rs(p.amount)}</td><td className="td max-w-[260px] whitespace-normal text-slate-700">{p.comment || <span className="text-slate-400">–</span>}</td>
              <td className="td"><PaymentBadge status={p.status} />{p.received_at && <span className="mt-0.5 block text-xs text-slate-500">on {shortDate(p.received_at)}</span>}</td><td className="td text-slate-500">{shortDate(p.created_at)}</td>
              <td className="td">{p.status === 'not_received' ? <button className="btn btn-primary btn-sm" disabled={busy === p.id} onClick={() => receive(p.id, p.shop_name, p.amount)}>Receive</button> : <span className="text-xs text-slate-400">Closed</span>}</td></tr>))}</tbody>
          <tfoot><tr className="bg-surface font-semibold"><td className="td" colSpan={2}>Total {shop ? `(${shopRow?.name})` : '(all shops)'}</td><td className="td text-right">{rs(received + waiting)}</td><td className="td text-green-700" colSpan={2}>Received {rs(received)}</td><td className="td text-amber-700" colSpan={2}>Not received {rs(waiting)}</td></tr></tfoot></table></div>)}
    </div>
  );
}
