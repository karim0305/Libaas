'use client';
import Link from 'next/link';
import { useAuth, useConfirm, useToast } from '@/components/Providers';
import { useQuery } from '@/lib/hooks';
import { listCustomerOrders, updateOrderStatus } from '@/lib/services/orders';
import StatusBadge from '@/components/ui/StatusBadge';
import { EmptyState, ErrorState, Skeleton } from '@/components/ui/States';
import { rs, shortDate } from '@/lib/format';
import { ORDER_STATUSES, type OrderStatus } from '@/lib/types';

const track: OrderStatus[] = ORDER_STATUSES.filter((s) => s !== 'cancelled');

export default function MyOrders() {
  const { user, ready } = useAuth(); const confirm = useConfirm(); const toast = useToast();
  const q = useQuery(() => (user ? listCustomerOrders(user.id) : Promise.resolve([])), [user?.id]);
  if (ready && !user) return <div className="mx-auto max-w-lg px-4 py-16"><EmptyState title="Log in to see your orders" action={<Link href="/login?next=/orders" className="btn btn-primary">Log in</Link>} /></div>;
  if (user && user.role !== 'customer') return <div className="mx-auto max-w-lg px-4 py-16"><EmptyState title="This page is for customers" text="Use your dashboard to manage orders." action={<Link href={user.role === 'admin' ? '/admin' : '/shop-dashboard'} className="btn btn-primary">Open dashboard</Link>} /></div>;

  const cancel = async (id: string, no: string) => { if (await confirm({ title: `Cancel order ${no}?`, message: 'The shop will be told and the items go back into stock.', confirmLabel: 'Cancel order', danger: true })) { await updateOrderStatus(id, 'cancelled'); toast(`Order ${no} cancelled.`, 'info'); } };

  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <h1 className="text-3xl font-semibold">My orders</h1>
      <div className="mt-8 space-y-4">
        {q.loading ? <><Skeleton className="h-40" /><Skeleton className="h-40" /></> : q.error ? <ErrorState message={q.error} retry={q.reload} /> :
          q.data!.length === 0 ? <EmptyState title="No orders yet" text="When you place an order it shows up here with live status." action={<Link href="/products" className="btn btn-primary">Browse products</Link>} /> :
          q.data!.map((o) => {
            const idx = track.indexOf(o.status);
            return (
              <article key={o.id} className="card p-5">
                <header className="flex flex-wrap items-center justify-between gap-2"><div><p className="font-display text-lg font-semibold text-indigo-800">{o.order_no}</p><p className="text-xs text-slate-500">{shortDate(o.created_at)} · {o.shop_name}</p></div><StatusBadge status={o.status} /></header>
                <ul className="mt-3 divide-y divide-line text-sm">{o.items.map((i, k) => <li key={k} className="flex justify-between py-2"><span>{i.name} <span className="text-slate-500">({i.size}, {i.color}) × {i.quantity}</span></span><span>{rs(i.unit_price * i.quantity)}</span></li>)}</ul>
                {o.status !== 'cancelled' && <ol className="mt-4 grid grid-cols-6 gap-1 text-center text-[11px] sm:text-xs">{track.map((s, i) => <li key={s}><div className={`h-1.5 rounded-full ${i <= idx ? 'bg-indigo' : 'bg-slate-200'}`} /><span className={`mt-1 block capitalize ${i <= idx ? 'font-semibold text-indigo-800' : 'text-slate-400'}`}>{s}</span></li>)}</ol>}
                <footer className="mt-4 flex items-center justify-between"><p className="text-sm">Pay on delivery: <b>{rs(o.subtotal + o.delivery_charge)}</b><span className="text-xs text-slate-500"> ({o.delivery_charge ? `incl. ${rs(o.delivery_charge)} delivery` : 'free delivery'})</span></p>{(o.status === 'pending' || o.status === 'referred' || o.status === 'confirmed') && <button className="btn btn-outline btn-sm" onClick={() => cancel(o.id, o.order_no)}>Cancel order</button>}</footer>
              </article>
            );
          })}
      </div>
    </div>
  );
}
