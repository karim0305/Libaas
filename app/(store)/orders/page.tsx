'use client';
import { BRAND } from '@/lib/brand';
import { useState } from 'react';
import Link from 'next/link';
import { useAuth, useConfirm, useToast } from '@/components/Providers';
import { useQuery } from '@/lib/hooks';
import { confirmReceipt, disputeCancellation, listCustomerOrders, updateOrderStatus } from '@/lib/services/orders';
import { listMyReviews } from '@/lib/services/reviews';
import StatusBadge from '@/components/ui/StatusBadge';
import ReviewForm from '@/components/ReviewForm';
import { Stars } from '@/components/ui/Stars';
import { EmptyState, ErrorState, Skeleton } from '@/components/ui/States';
import { rs, shortDate } from '@/lib/format';
import { ORDER_STATUSES, type Order, type OrderStatus } from '@/lib/types';

const track: OrderStatus[] = ORDER_STATUSES.filter((s) => s !== 'cancelled');

function Dispute({ order, onDone }: { order: Order; onDone: () => void }) {
  const toast = useToast(); const [note, setNote] = useState(''); const [busy, setBusy] = useState(false);
  const send = async (e: React.FormEvent) => {
    e.preventDefault(); setBusy(true);
    try { await disputeCancellation(order.id, note.trim()); toast(`Reported. ${BRAND.name} will contact you.`); onDone(); } catch (x) { toast((x as Error).message, 'error'); setBusy(false); }
  };
  return (
    <form onSubmit={send} className="mt-2 space-y-2">
      <label className="sr-only" htmlFor={`d-${order.id}`}>What really happened</label>
      <textarea id={`d-${order.id}`} rows={2} maxLength={500} className="input" placeholder="Tell us what happened, e.g. nobody called me or came to my address" value={note} onChange={(e) => setNote(e.target.value)} />
      <div className="flex gap-2"><button className="btn btn-danger btn-sm" disabled={busy}>{busy ? 'Sending…' : `Report to ${BRAND.name}`}</button><button type="button" className="btn btn-ghost btn-sm" onClick={onDone}>Cancel</button></div>
    </form>
  );
}

export default function MyOrders() {
  const { user, ready } = useAuth(); const confirm = useConfirm(); const toast = useToast();
  const q = useQuery(() => (user ? listCustomerOrders(user.id) : Promise.resolve([])), [user?.id]);
  const mine = useQuery(() => (user ? listMyReviews(user.id) : Promise.resolve([])), [user?.id]);
  const [reviewing, setReviewing] = useState<string | null>(null); // `${orderId}:${productId}`
  const [disputing, setDisputing] = useState<string | null>(null);

  if (ready && !user) return <div className="mx-auto max-w-lg px-4 py-16"><EmptyState title="Log in to see your orders" action={<Link href="/login?next=/orders" className="btn btn-primary">Log in</Link>} /></div>;
  if (user && user.role !== 'customer') return <div className="mx-auto max-w-lg px-4 py-16"><EmptyState title="This page is for customers" text="Use your dashboard to manage orders." action={<Link href={user.role === 'admin' ? '/admin' : '/shop-dashboard'} className="btn btn-primary">Open dashboard</Link>} /></div>;

  const cancel = async (id: string, no: string) => { if (await confirm({ title: `Cancel order ${no}?`, message: 'The shop will be told and the items go back into stock.', confirmLabel: 'Cancel order', danger: true })) { await updateOrderStatus(id, 'cancelled', { by: 'customer' }); toast(`Order ${no} cancelled.`, 'info'); } };
  const received = async (o: Order) => {
    if (await confirm({ title: `Did you receive ${o.order_no}?`, message: 'Only confirm if the items are in your hands and you have paid. This marks the order as delivered.', confirmLabel: 'Yes, I received it' })) {
      try { await confirmReceipt(o.id); toast('Thanks! Order marked as delivered. You can now review your items.'); } catch (x) { toast((x as Error).message, 'error'); }
    }
  };
  const reviewOf = (orderId: string, productId: string) => (mine.data ?? []).find((r) => r.order_id === orderId && r.product_id === productId);

  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <h1 className="text-3xl font-semibold">My orders</h1>
      <div className="mt-8 space-y-4">
        {q.loading ? <><Skeleton className="h-40" /><Skeleton className="h-40" /></> : q.error ? <ErrorState message={q.error} retry={q.reload} /> :
          q.data!.length === 0 ? <EmptyState title="No orders yet" text="When you place an order it shows up here with live status." action={<Link href="/products" className="btn btn-primary">Browse products</Link>} /> :
          q.data!.map((o) => {
            const idx = track.indexOf(o.status);
            const canConfirm = ['confirmed', 'processing', 'shipped'].includes(o.status);
            return (
              <article key={o.id} className="card p-5">
                <header className="flex flex-wrap items-center justify-between gap-2"><div><p className="font-display text-lg font-semibold text-indigo-800">{o.order_no}</p><p className="text-xs text-slate-500">{shortDate(o.created_at)} · {o.shop_name}</p></div><StatusBadge status={o.status} /></header>
                <ul className="mt-3 divide-y divide-line text-sm">
                  {o.items.map((i) => {
                    const key = `${o.id}:${i.product_id}`; const rv = reviewOf(o.id, i.product_id);
                    return (
                      <li key={key} className="py-2.5">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <span><Link href={`/products/${i.product_id}`} className="hover:text-indigo-800">{i.name}</Link> <span className="text-slate-500">({i.size}, {i.color}) × {i.quantity}</span></span>
                          <span className="flex items-center gap-3">
                            <span>{rs(i.unit_price * i.quantity)}</span>
                            {o.status === 'delivered' && user && (rv ? <button className="flex items-center gap-1.5 text-xs text-slate-600 hover:text-indigo-800" onClick={() => setReviewing(key)}><Stars value={rv.rating} size={13} />Edit</button>
                              : <button className="btn btn-outline btn-sm" onClick={() => setReviewing(key)}>Write a review</button>)}
                          </span>
                        </div>
                        {reviewing === key && user && <ReviewForm userId={user.id} orderId={o.id} productId={i.product_id} productName={i.name} existing={rv} onDone={() => { setReviewing(null); mine.reload(); }} />}
                      </li>
                    );
                  })}
                </ul>
                {o.status !== 'cancelled' && <ol className="mt-4 grid grid-cols-6 gap-1 text-center text-[11px] sm:text-xs">{track.map((s, i) => <li key={s}><div className={`h-1.5 rounded-full ${i <= idx ? 'bg-indigo' : 'bg-slate-200'}`} /><span className={`mt-1 block capitalize ${i <= idx ? 'font-semibold text-indigo-800' : 'text-slate-400'}`}>{s}</span></li>)}</ol>}

                {o.status === 'cancelled' && (
                  <div className="mt-4 rounded-lg bg-crimson-50 p-3 text-sm text-crimson-700">
                    <p>Cancelled by {o.cancelled_by === 'shop' ? 'the shop' : o.cancelled_by === 'admin' ? `${BRAND.name}` : 'you'}{o.cancel_reason ? `: ${o.cancel_reason}` : ''}.</p>
                    {o.cancelled_by === 'shop' && (o.disputed_at ? <p className="mt-1 font-medium">You reported this. {BRAND.name} will contact you.</p> : disputing === o.id ? <Dispute order={o} onDone={() => setDisputing(null)} /> : <button className="mt-1 font-semibold underline" onClick={() => setDisputing(o.id)}>That’s not true. Report to {BRAND.name}</button>)}
                  </div>
                )}

                <footer className="mt-4 flex flex-wrap items-center justify-between gap-2">
                  <p className="text-sm">Pay on delivery: <b>{rs(o.subtotal + o.delivery_charge)}</b><span className="text-xs text-slate-500"> ({o.delivery_charge ? `incl. ${rs(o.delivery_charge)} delivery` : 'free delivery'})</span></p>
                  <div className="flex gap-2">
                    {canConfirm && <button className="btn btn-gold btn-sm" onClick={() => received(o)}>I received this order</button>}
                    {(o.status === 'pending' || o.status === 'referred' || o.status === 'confirmed') && <button className="btn btn-outline btn-sm" onClick={() => cancel(o.id, o.order_no)}>Cancel order</button>}
                  </div>
                </footer>
              </article>
            );
          })}
      </div>
    </div>
  );
}
