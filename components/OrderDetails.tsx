'use client';
import { useEffect } from 'react';
import { MessageCircle, Phone, X } from 'lucide-react';
import StatusBadge from './ui/StatusBadge';
import { attentionFlags } from '@/lib/attention';
import { rs, shortDate } from '@/lib/format';
import type { Order } from '@/lib/types';

const telHref = (p: string) => `tel:${p.replace(/[^\d+]/g, '')}`;
/** 0300 1234567 -> https://wa.me/923001234567 */
const waHref = (p: string) => { const d = p.replace(/\D/g, ''); return `https://wa.me/${d.startsWith('0') ? `92${d.slice(1)}` : d}`; };

/** Everything the shop (and admin) need to deliver: who, where, what, how much cash to collect. */
export default function OrderDetails({ order: o, onClose, showShop = false }: { order: Order; onClose: () => void; showShop?: boolean }) {
  useEffect(() => { const k = (e: KeyboardEvent) => e.key === 'Escape' && onClose(); window.addEventListener('keydown', k); return () => window.removeEventListener('keydown', k); }, [onClose]);
  const flags = attentionFlags(o);
  const total = o.subtotal + o.delivery_charge;
  return (
    <div className="fixed inset-0 z-[90] grid place-items-center bg-indigo-900/50 p-3" role="dialog" aria-modal="true" aria-label={`Order ${o.order_no}`} onClick={onClose}>
      <div className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="sticky top-0 flex items-start justify-between gap-3 border-b border-line bg-white p-4 sm:p-5">
          <div><h2 className="font-display text-xl font-semibold text-indigo-800">{o.order_no}</h2><p className="text-xs text-slate-500">Placed {shortDate(o.created_at)}{showShop && ` · ${o.shop_name}`}</p></div>
          <div className="flex items-center gap-3"><StatusBadge status={o.status} /><button aria-label="Close" onClick={onClose} className="rounded p-1 text-slate-500 hover:bg-surface"><X size={20} /></button></div>
        </div>
        <div className="space-y-5 p-4 sm:p-5">
          {flags.length > 0 && <ul className="space-y-1 rounded-lg border border-crimson/30 bg-crimson-50 p-3 text-sm text-crimson-700">{flags.map((f) => <li key={f.kind}>⚠ {f.label}</li>)}</ul>}

          <section>
            <h3 className="text-sm font-semibold">Customer and delivery address</h3>
            <div className="mt-2 rounded-xl border border-line p-4">
              <p className="font-semibold">{o.customer_name}</p>
              <p className="mt-0.5 text-sm text-slate-700">{o.phone}</p>
              <div className="mt-2 flex flex-wrap gap-2">
                <a href={telHref(o.phone)} className="btn btn-outline btn-sm"><Phone size={14} />Call</a>
                <a href={waHref(o.phone)} target="_blank" rel="noopener noreferrer" className="btn btn-outline btn-sm"><MessageCircle size={14} />WhatsApp</a>
              </div>
              <p className="mt-3 text-sm leading-relaxed">{o.address}<br />{o.city}</p>
              {o.notes && <p className="mt-2 rounded-lg bg-marigold-50 p-2.5 text-sm"><b>Customer’s note:</b> {o.notes}</p>}
            </div>
          </section>

          <section>
            <h3 className="text-sm font-semibold">Items</h3>
            <div className="mt-2 overflow-x-auto rounded-xl border border-line">
              <table className="w-full text-sm"><thead><tr><th className="th">Code</th><th className="th">Product</th><th className="th">Size · Colour</th><th className="th text-right">Qty</th><th className="th text-right">Price</th></tr></thead>
                <tbody className="divide-y divide-line">{o.items.map((i, k) => <tr key={k}><td className="td font-mono text-xs">{i.product_code ?? '–'}</td><td className="td whitespace-normal">{i.name}</td><td className="td">{i.size} · {i.color}</td><td className="td text-right">{i.quantity}</td><td className="td text-right">{rs(i.unit_price * i.quantity)}</td></tr>)}</tbody></table>
            </div>
            <dl className="mt-3 space-y-1 text-sm">
              <div className="flex justify-between"><dt>Products</dt><dd>{rs(o.subtotal)}</dd></div>
              <div className="flex justify-between"><dt>Delivery</dt><dd>{o.delivery_charge ? rs(o.delivery_charge) : 'Free'}</dd></div>
              <div className="flex justify-between border-t border-line pt-2 text-base font-semibold"><dt>Cash to collect on delivery</dt><dd>{rs(total)}</dd></div>
              {o.status === 'delivered' && <div className="flex justify-between text-slate-600"><dt>Commission / shop earning</dt><dd>{rs(o.commission_amount)} / <b className="text-green-700">{rs(o.shop_earning)}</b></dd></div>}
            </dl>
          </section>

          <section className="text-sm text-slate-600">
            <h3 className="mb-1 text-sm font-semibold text-slate-800">History</h3>
            <ul className="space-y-0.5">
              <li>Placed: {shortDate(o.created_at)}</li>
              {o.referred_at && <li>Referred to shop: {shortDate(o.referred_at)}</li>}
              {o.status !== 'pending' && o.status !== 'referred' && <li>Last update: {shortDate(o.status_changed_at)} ({o.status})</li>}
              {o.customer_confirmed_at && <li>Customer confirmed receipt: {shortDate(o.customer_confirmed_at)}</li>}
              {o.status === 'cancelled' && <li>Cancelled by <b>{o.cancelled_by ?? 'unknown'}</b>{o.cancel_reason ? `: ${o.cancel_reason}` : ''}</li>}
              {o.disputed_at && <li className="text-crimson">Customer disputed this cancellation{o.dispute_note ? `: “${o.dispute_note}”` : ''}</li>}
            </ul>
          </section>
        </div>
      </div>
    </div>
  );
}
