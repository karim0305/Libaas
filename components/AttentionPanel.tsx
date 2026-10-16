'use client';
import { useState } from 'react';
import { Phone } from 'lucide-react';
import OrderDetails from './OrderDetails';
import { useToast } from './Providers';
import { attentionFlags, FOLLOW_UP_DAYS } from '@/lib/attention';
import { markChecked } from '@/lib/services/orders';
import { rs } from '@/lib/format';
import type { Order } from '@/lib/types';

/** Admin only: orders where a shop might not be telling the whole truth about delivery. */
export default function AttentionPanel({ orders }: { orders: Order[] }) {
  const toast = useToast();
  const [view, setView] = useState<Order | null>(null);
  const flagged = orders.map((o) => ({ o, flags: attentionFlags(o) })).filter((x) => x.flags.length);
  const check = async (o: Order) => { await markChecked(o.id); toast(`${o.order_no} marked as checked.`, 'info'); };

  return (
    <section className="card overflow-hidden border-crimson/30">
      <div className="border-b border-line bg-crimson-50 p-4">
        <h2 className="text-base font-semibold text-crimson-700">Delivery checks {flagged.length > 0 && <span className="ml-1 rounded-full bg-crimson px-2 py-0.5 text-xs text-white">{flagged.length}</span>}</h2>
        <p className="mt-0.5 text-xs text-slate-600">Commission is only earned when an order is delivered, so check these with the customer: orders with no update for {FOLLOW_UP_DAYS}+ days, orders a shop cancelled, and cancellations the customer disputes.</p>
      </div>
      {flagged.length === 0 ? <p className="p-4 text-sm text-green-800">All clear. Nothing needs a delivery check right now.</p> : (
        <ul className="divide-y divide-line">
          {flagged.map(({ o, flags }) => (
            <li key={o.id} className="flex flex-wrap items-center gap-3 p-4 text-sm">
              <div className="min-w-0 flex-1">
                <p><button className="font-semibold text-indigo-800 underline decoration-dotted" onClick={() => setView(o)}>{o.order_no}</button> · {o.shop_name} · {rs(o.subtotal)}</p>
                <p className="text-slate-600">{o.customer_name} · <a className="font-medium text-indigo-800" href={`tel:${o.phone.replace(/[^\d+]/g, '')}`}><Phone size={12} className="mr-0.5 inline" />{o.phone}</a></p>
                <div className="mt-1 flex flex-wrap gap-1.5">{flags.map((f) => <span key={f.kind} className="rounded-full bg-crimson-50 px-2.5 py-0.5 text-xs font-medium text-crimson-700">{f.label}</span>)}</div>
                {o.dispute_note && <p className="mt-1 text-xs italic text-slate-600">Customer says: “{o.dispute_note}”</p>}
              </div>
              <div className="flex gap-1.5"><button className="btn btn-outline btn-sm" onClick={() => setView(o)}>Details</button><button className="btn btn-primary btn-sm" onClick={() => check(o)}>Mark checked</button></div>
            </li>
          ))}
        </ul>
      )}
      {view && <OrderDetails order={view} showShop onClose={() => setView(null)} />}
    </section>
  );
}
