'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Banknote } from 'lucide-react';
import { useAuth, useCart, useToast } from '@/components/Providers';
import { useQuery } from '@/lib/hooks';
import { getProductsByIds } from '@/lib/services/products';
import { placeOrder } from '@/lib/services/orders';
import { EmptyState } from '@/components/ui/States';
import { rs } from '@/lib/format';

const CITIES = ['Lahore', 'Karachi', 'Islamabad', 'Rawalpindi', 'Faisalabad', 'Multan', 'Peshawar', 'Quetta', 'Gujranwala', 'Sialkot', 'Hyderabad', 'Other'];

export default function Checkout() {
  const { user, ready } = useAuth(); const cart = useCart(); const router = useRouter(); const toast = useToast();
  const q = useQuery(() => getProductsByIds(cart.lines.map((l) => l.product_id)), [cart.lines.length]);
  const [f, setF] = useState({ full_name: '', phone: '', address: '', city: 'Lahore', notes: '' });
  const [err, setErr] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  useEffect(() => { if (user) setF((x) => ({ ...x, full_name: x.full_name || user.name, phone: x.phone || (user.phone ?? '') })); }, [user]);
  const on = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => setF({ ...f, [k]: e.target.value });

  if (ready && !user) return <div className="mx-auto max-w-lg px-4 py-16"><EmptyState title="Log in to place your order" text="We need an account so you can track this order afterwards." action={<Link href="/login?next=/checkout" className="btn btn-primary">Log in or register</Link>} /></div>;
  if (cart.lines.length === 0) return <div className="mx-auto max-w-lg px-4 py-16"><EmptyState title="Nothing to check out" text="Your cart is empty." action={<Link href="/products" className="btn btn-primary">Browse products</Link>} /></div>;

  const rows = cart.lines.map((l) => ({ l, p: q.data?.find((x) => x.id === l.product_id) })).filter((r) => r.p);
  const subtotal = rows.reduce((s, r) => s + r.p!.final_price * r.l.quantity, 0);
  const delivery = subtotal >= 5000 ? 0 : 250;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const er: Record<string, string> = {};
    if (f.full_name.trim().length < 3) er.full_name = 'Enter your full name.';
    if (!/^(\+92|0)3\d{2}[\s-]?\d{7}$/.test(f.phone.replace(/\s/g, ''))) er.phone = 'Enter a Pakistani mobile number like 0300 1234567.';
    if (f.address.trim().length < 10) er.address = 'Enter your house, street and area so the rider can find you.';
    setErr(er);
    if (Object.keys(er).length) return;
    setBusy(true);
    try {
      const orders = await placeOrder(user!.id, cart.lines, f);
      cart.clear();
      router.push(`/order-success?no=${orders.map((o) => o.order_no).join(',')}`);
    } catch (x) { toast((x as Error).message, 'error'); setBusy(false); }
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <h1 className="text-3xl font-semibold">Checkout</h1>
      <form onSubmit={submit} noValidate className="mt-8 grid gap-8 lg:grid-cols-[1fr_380px]">
        <div className="card space-y-5 p-5 sm:p-6">
          <h2 className="text-lg font-semibold">Delivery details</h2>
          <div><label className="label" htmlFor="n">Full name</label><input id="n" className="input" value={f.full_name} onChange={on('full_name')} aria-invalid={!!err.full_name} />{err.full_name && <p className="mt-1 text-xs text-crimson">{err.full_name}</p>}</div>
          <div><label className="label" htmlFor="ph">Mobile number</label><input id="ph" className="input" inputMode="tel" placeholder="0300 1234567" value={f.phone} onChange={on('phone')} aria-invalid={!!err.phone} />{err.phone && <p className="mt-1 text-xs text-crimson">{err.phone}</p>}</div>
          <div><label className="label" htmlFor="ad">Complete address</label><textarea id="ad" rows={3} className="input" placeholder="House no., street, area" value={f.address} onChange={on('address')} aria-invalid={!!err.address} />{err.address && <p className="mt-1 text-xs text-crimson">{err.address}</p>}</div>
          <div><label className="label" htmlFor="ci">City</label><select id="ci" className="input" value={f.city} onChange={on('city')}>{CITIES.map((c) => <option key={c}>{c}</option>)}</select></div>
          <div><label className="label" htmlFor="no">Notes for the shop <span className="font-normal text-slate-400">(optional)</span></label><textarea id="no" rows={2} className="input" placeholder="e.g. call before delivery" value={f.notes} onChange={on('notes')} /></div>
          <div><p className="label">Payment method</p><div className="flex items-center gap-3 rounded-lg border-2 border-indigo bg-indigo-50 p-4"><Banknote className="text-indigo" /><div><p className="font-semibold text-indigo-800">Cash on delivery</p><p className="text-xs text-slate-600">Pay the rider in cash when your parcel arrives.</p></div></div></div>
        </div>
        <aside className="card h-fit p-5">
          <h2 className="text-lg font-semibold">Your order</h2>
          <ul className="mt-4 divide-y divide-line text-sm">{rows.map(({ l, p }) => <li key={`${l.product_id}${l.size}${l.color}`} className="flex justify-between gap-3 py-2.5"><span>{p!.name}<span className="block text-xs text-slate-500">{l.size} · {l.color} · Qty {l.quantity}</span></span><span className="font-medium">{rs(p!.final_price * l.quantity)}</span></li>)}</ul>
          <dl className="mt-3 space-y-2 border-t border-line pt-3 text-sm"><div className="flex justify-between"><dt>Subtotal</dt><dd>{rs(subtotal)}</dd></div><div className="flex justify-between"><dt>Delivery</dt><dd>{delivery ? rs(delivery) : 'Free'}</dd></div><div className="flex justify-between text-base font-semibold"><dt>Pay on delivery</dt><dd>{rs(subtotal + delivery)}</dd></div></dl>
          <button className="btn btn-gold mt-5 w-full py-3" disabled={busy || q.loading}>{busy ? 'Placing order…' : 'Place order'}</button>
        </aside>
      </form>
    </div>
  );
}
