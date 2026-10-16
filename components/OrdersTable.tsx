'use client';
import { useMemo, useState } from 'react';
import StatusBadge from './ui/StatusBadge';
import { EmptyState } from './ui/States';
import OrderDetails from './OrderDetails';
import { useConfirm, usePlatform, useToast } from './Providers';
import { nextStatuses, updateOrderStatus } from '@/lib/services/orders';
import { rs, shortDate } from '@/lib/format';
import { ORDER_STATUSES, type Order, type OrderStatus } from '@/lib/types';

const SHOP_REASONS = ['Customer refused the delivery', 'Customer not reachable', 'Wrong or incomplete address', 'Out of stock', 'Other'];
const ADMIN_REASONS = ['Fake or duplicate order', 'Customer asked to cancel', 'Shop could not fulfil it', 'Other'];

function CancelDialog({ order, role, onClose, onDone }: { order: Order; role: 'admin' | 'shop'; onClose: () => void; onDone: () => void }) {
  const reasons = role === 'admin' ? ADMIN_REASONS : SHOP_REASONS;
  const [reason, setReason] = useState(reasons[0]); const [note, setNote] = useState(''); const [busy, setBusy] = useState(false);
  const toast = useToast();
  const text = reason === 'Other' ? note.trim() : `${reason}${note.trim() ? `: ${note.trim()}` : ''}`;
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (text.length < 3) { toast('Please write the reason.', 'error'); return; }
    setBusy(true);
    try { await updateOrderStatus(order.id, 'cancelled', { reason: text, by: role }); toast(`${order.order_no} cancelled.`); onDone(); }
    catch (x) { toast((x as Error).message, 'error'); setBusy(false); }
  };
  return (
    <div className="fixed inset-0 z-[110] grid place-items-center bg-indigo-900/50 p-4" role="dialog" aria-modal="true" onClick={onClose}>
      <form onSubmit={submit} className="w-full max-w-md rounded-xl bg-white p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <h2 className="font-display text-lg font-semibold">Cancel {order.order_no}?</h2>
        <p className="mt-1 text-sm text-slate-600">Stock goes back and the customer sees the reason. {role === 'shop' && 'The admin can check cancellations with the customer, so please be accurate.'}</p>
        <label className="label mt-4" htmlFor="cr">Reason</label>
        <select id="cr" className="input" value={reason} onChange={(e) => setReason(e.target.value)}>{reasons.map((r) => <option key={r}>{r}</option>)}</select>
        <label className="label mt-3" htmlFor="cn">Details {reason !== 'Other' && <span className="font-normal text-slate-400">(optional)</span>}</label>
        <textarea id="cn" rows={2} className="input" value={note} onChange={(e) => setNote(e.target.value)} />
        <div className="mt-5 flex justify-end gap-2"><button type="button" className="btn btn-ghost" onClick={onClose}>Keep order</button><button className="btn btn-danger" disabled={busy}>{busy ? 'Cancelling…' : 'Cancel order'}</button></div>
      </form>
    </div>
  );
}

/**
 * role="admin": sees every order; can REFER a pending order to its shop (or cancel). Only the admin sees "Refer".
 * role="shop":  sees only referred orders; confirms and moves them forward. Every row opens the full details.
 */
export default function OrdersTable({ orders, showShop = false, canUpdate = true, title, role = 'shop' }: { orders: Order[]; showShop?: boolean; canUpdate?: boolean; title?: string; role?: 'admin' | 'shop' }) {
  const [tab, setTab] = useState<'all' | OrderStatus>('all');
  const [q, setQ] = useState('');
  const [view, setView] = useState<Order | null>(null);
  const [cancelFor, setCancelFor] = useState<Order | null>(null);
  const confirm = useConfirm(); const toast = useToast(); const { rate, pct } = usePlatform();
  const rows = useMemo(() => orders.filter((o) => (tab === 'all' || o.status === tab) && (!q || `${o.order_no} ${o.customer_name} ${o.shop_name} ${o.phone}`.toLowerCase().includes(q.toLowerCase()))), [orders, tab, q]);
  const count = (s: OrderStatus) => orders.filter((o) => o.status === s).length;
  const tabs: ('all' | OrderStatus)[] = ['all', ...ORDER_STATUSES.filter((s) => role === 'admin' || s !== 'pending')];

  const move = async (o: Order, s: OrderStatus) => {
    if (s === 'cancelled') { setCancelFor(o); return; }
    const fee = Math.round(o.subtotal * rate);
    const ok = await confirm({
      title: s === 'referred' ? `Refer ${o.order_no} to ${o.shop_name}?` : `Mark ${o.order_no} as ${s}?`,
      message: s === 'referred' ? 'The order is sent to the shop. They will see it, with the customer’s address and phone, in their dashboard. Only you (admin) can refer orders.'
        : s === 'delivered' ? `Only mark this delivered if the customer received it. It records ${rs(fee)} platform commission (${pct}) and ${rs(o.subtotal - fee)} for the shop. The customer is also asked to confirm.` : 'The customer will see the new status straight away.',
      confirmLabel: s === 'referred' ? 'Refer to shop' : `Mark ${s}`,
    });
    if (!ok) return;
    try { await updateOrderStatus(o.id, s, { by: role }); toast(s === 'referred' ? `${o.order_no} referred to ${o.shop_name}.` : `${o.order_no} is now ${s}.`); }
    catch (x) { toast((x as Error).message, 'error'); }
  };

  return (
    <div className="card overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line p-4">
        {title && <h2 className="text-base font-semibold">{title}</h2>}
        <input className="input !w-full sm:!w-64" placeholder="Search order, customer, phone or shop" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Search orders" />
      </div>
      <div className="flex gap-1 overflow-x-auto border-b border-line px-3 py-2" role="tablist">
        {tabs.map((s) => <button key={s} role="tab" aria-selected={tab === s} onClick={() => setTab(s)} className={`whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-semibold capitalize ${tab === s ? 'bg-indigo text-white' : 'text-slate-600 hover:bg-surface'}`}>{s}{s !== 'all' && <span className={`ml-1 ${role === 'admin' && s === 'pending' && count(s) > 0 && tab !== s ? 'rounded-full bg-crimson px-1.5 text-white' : 'opacity-70'}`}>{count(s)}</span>}</button>)}
      </div>
      {rows.length === 0 ? <EmptyState title="No orders here" text={role === 'shop' ? 'Orders the admin refers to your shop will appear here.' : 'Orders matching this filter will appear in this table.'} /> : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead><tr><th className="th">Order ID</th>{showShop && <th className="th">Shop</th>}<th className="th">Customer</th><th className="th">Product</th><th className="th text-right">Qty</th><th className="th text-right">Amount</th><th className="th text-right">Delivery</th><th className="th text-right">Commission ({pct})</th><th className="th text-right">Shop earning</th><th className="th">Date</th><th className="th">Status</th>{canUpdate && <th className="th">Actions</th>}</tr></thead>
            <tbody className="divide-y divide-line">
              {rows.map((o) => {
                const next = nextStatuses(o.status, role);
                return (
                  <tr key={o.id} className="hover:bg-surface/60">
                    <td className="td"><button className="font-semibold text-indigo-800 underline decoration-dotted underline-offset-2 hover:text-crimson" onClick={() => setView(o)} aria-label={`Open details of ${o.order_no}`}>{o.order_no}</button></td>
                    {showShop && <td className="td">{o.shop_name}</td>}
                    <td className="td"><span className="block">{o.customer_name}</span><span className="text-xs text-slate-500">{o.phone} · {o.city}</span></td>
                    <td className="td max-w-[220px] truncate" title={o.items.map((i) => i.name).join(', ')}>{o.items[0].name}{o.items.length > 1 && <span className="text-slate-500"> +{o.items.length - 1} more</span>}</td>
                    <td className="td text-right">{o.items.reduce((s, i) => s + i.quantity, 0)}</td>
                    <td className="td text-right font-medium">{rs(o.subtotal)}</td>
                    <td className="td text-right text-slate-600">{o.delivery_charge ? rs(o.delivery_charge) : 'Free'}</td>
                    <td className="td text-right">{o.status === 'delivered' ? <span className="text-crimson">{rs(o.commission_amount)}</span> : <span className="text-slate-400">–</span>}</td>
                    <td className="td text-right">{o.status === 'delivered' ? <span className="font-semibold text-green-700">{rs(o.shop_earning)}</span> : <span className="text-slate-400">–</span>}</td>
                    <td className="td text-slate-500">{shortDate(o.created_at)}</td>
                    <td className="td"><StatusBadge status={o.status} /></td>
                    {canUpdate && <td className="td"><div className="flex items-center gap-1.5">
                      <button onClick={() => setView(o)} className="btn btn-outline btn-sm">Details</button>
                      {next.map((s) => <button key={s} onClick={() => move(o, s)} className={`btn btn-sm capitalize ${s === 'cancelled' ? 'btn-outline !text-crimson' : s === 'referred' ? 'btn-gold' : 'btn-primary'}`}>{s === 'cancelled' ? 'Cancel' : s === 'referred' ? 'Refer' : s}</button>)}
                      {next.length === 0 && <span className="text-xs text-slate-400">{role === 'admin' && ['processing', 'shipped'].includes(o.status) ? 'With shop' : 'Closed'}</span>}</div></td>}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
      {view && <OrderDetails order={view} showShop={role === 'admin'} onClose={() => setView(null)} />}
      {cancelFor && <CancelDialog order={cancelFor} role={role} onClose={() => setCancelFor(null)} onDone={() => setCancelFor(null)} />}
    </div>
  );
}
