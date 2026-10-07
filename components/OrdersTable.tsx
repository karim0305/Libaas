'use client';
import { useMemo, useState } from 'react';
import StatusBadge from './ui/StatusBadge';
import { EmptyState } from './ui/States';
import { useConfirm, usePlatform, useToast } from './Providers';
import { nextStatuses, updateOrderStatus } from '@/lib/services/orders';
import { rs, shortDate } from '@/lib/format';
import { ORDER_STATUSES, type Order, type OrderStatus } from '@/lib/types';

/**
 * role="admin": sees every order; can REFER a pending order to its shop (or cancel). Only the admin sees "Refer".
 * role="shop":  sees only referred orders; confirms and moves them forward.
 */
export default function OrdersTable({ orders, showShop = false, canUpdate = true, title, role = 'shop' }: { orders: Order[]; showShop?: boolean; canUpdate?: boolean; title?: string; role?: 'admin' | 'shop' }) {
  const [tab, setTab] = useState<'all' | OrderStatus>('all');
  const [q, setQ] = useState('');
  const confirm = useConfirm(); const toast = useToast(); const { rate, pct } = usePlatform();
  const rows = useMemo(() => orders.filter((o) => (tab === 'all' || o.status === tab) && (!q || `${o.order_no} ${o.customer_name} ${o.shop_name}`.toLowerCase().includes(q.toLowerCase()))), [orders, tab, q]);
  const count = (s: OrderStatus) => orders.filter((o) => o.status === s).length;
  const tabs: ('all' | OrderStatus)[] = ['all', ...ORDER_STATUSES.filter((s) => role === 'admin' || s !== 'pending')];

  const move = async (o: Order, s: OrderStatus) => {
    const fee = Math.round(o.subtotal * rate);
    const ok = await confirm({
      title: s === 'referred' ? `Refer ${o.order_no} to ${o.shop_name}?` : s === 'cancelled' ? `Cancel ${o.order_no}?` : `Mark ${o.order_no} as ${s}?`,
      message: s === 'referred' ? 'The order is sent to the shop. They will see it in their dashboard and can confirm it. Only you (admin) can refer orders.'
        : s === 'delivered' ? `Delivering this order records ${rs(fee)} platform commission (${pct}) and ${rs(o.subtotal - fee)} for the shop.`
        : s === 'cancelled' ? 'Stock goes back to the shop and the customer is told. This can’t be undone.' : 'The customer will see the new status straight away.',
      confirmLabel: s === 'referred' ? 'Refer to shop' : s === 'cancelled' ? 'Cancel order' : `Mark ${s}`, danger: s === 'cancelled',
    });
    if (!ok) return;
    try { await updateOrderStatus(o.id, s); toast(s === 'referred' ? `${o.order_no} referred to ${o.shop_name}.` : `${o.order_no} is now ${s}.`); }
    catch (x) { toast((x as Error).message, 'error'); }
  };

  return (
    <div className="card overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line p-4">
        {title && <h2 className="text-base font-semibold">{title}</h2>}
        <input className="input !w-full sm:!w-64" placeholder="Search order, customer or shop" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Search orders" />
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
                    <td className="td font-semibold text-indigo-800">{o.order_no}</td>
                    {showShop && <td className="td">{o.shop_name}</td>}
                    <td className="td"><span className="block">{o.customer_name}</span><span className="text-xs text-slate-500">{o.city}</span></td>
                    <td className="td max-w-[220px] truncate" title={o.items.map((i) => i.name).join(', ')}>{o.items[0].name}{o.items.length > 1 && <span className="text-slate-500"> +{o.items.length - 1} more</span>}</td>
                    <td className="td text-right">{o.items.reduce((s, i) => s + i.quantity, 0)}</td>
                    <td className="td text-right font-medium">{rs(o.subtotal)}</td>
                    <td className="td text-right text-slate-600">{o.delivery_charge ? rs(o.delivery_charge) : 'Free'}</td>
                    <td className="td text-right">{o.status === 'delivered' ? <span className="text-crimson">{rs(o.commission_amount)}</span> : <span className="text-slate-400">–</span>}</td>
                    <td className="td text-right">{o.status === 'delivered' ? <span className="font-semibold text-green-700">{rs(o.shop_earning)}</span> : <span className="text-slate-400">–</span>}</td>
                    <td className="td text-slate-500">{shortDate(o.created_at)}</td>
                    <td className="td"><StatusBadge status={o.status} /></td>
                    {canUpdate && <td className="td">{next.length === 0 ? <span className="text-xs text-slate-400">{role === 'admin' && ['processing', 'shipped'].includes(o.status) ? 'With shop' : 'Closed'}</span> : (
                      <div className="flex gap-1.5">{next.map((s) => <button key={s} onClick={() => move(o, s)} className={`btn btn-sm capitalize ${s === 'cancelled' ? 'btn-outline !text-crimson' : s === 'referred' ? 'btn-gold' : 'btn-primary'}`}>{s === 'cancelled' ? 'Cancel' : s === 'referred' ? 'Refer' : s}</button>)}</div>)}</td>}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
