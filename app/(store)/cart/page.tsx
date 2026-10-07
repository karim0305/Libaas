'use client';
import Link from 'next/link';
import { Minus, Plus, Trash2 } from 'lucide-react';
import { useCart, useConfirm, useToast } from '@/components/Providers';
import { useQuery } from '@/lib/hooks';
import { getProductsByIds } from '@/lib/services/products';
import ProductImage from '@/components/ui/ProductImage';
import { EmptyState, Skeleton } from '@/components/ui/States';
import { rs } from '@/lib/format';
import { calcDelivery } from '@/lib/delivery';

export default function CartPage() {
  const cart = useCart(); const confirm = useConfirm(); const toast = useToast();
  const ids = cart.lines.map((l) => l.product_id).join(',');
  const q = useQuery(() => getProductsByIds(cart.lines.map((l) => l.product_id)), [ids]);

  if (cart.lines.length === 0) return <div className="mx-auto max-w-3xl px-4 py-16"><EmptyState title="Your cart is empty" text="Add a few things you like and they’ll wait for you here." action={<Link href="/products" className="btn btn-primary">Start shopping</Link>} /></div>;
  if (q.loading || !q.data) return <div className="mx-auto max-w-5xl space-y-3 px-4 py-10"><Skeleton className="h-28" /><Skeleton className="h-28" /></div>;

  const rows = cart.lines.map((l) => ({ l, p: q.data!.find((x) => x.id === l.product_id) })).filter((r) => r.p);
  const subtotal = rows.reduce((s, r) => s + r.p!.final_price * r.l.quantity, 0);
  const del = calcDelivery(rows.map((r) => ({ p: r.p!, quantity: r.l.quantity })));
  const remove = async (l: typeof cart.lines[number], name: string) => { if (await confirm({ title: 'Remove this item?', message: `${name} will be taken out of your cart.`, confirmLabel: 'Remove', danger: true })) { cart.remove(l); toast('Item removed from your cart.', 'info'); } };

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <h1 className="text-3xl font-semibold">Your cart</h1>
      <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_360px]">
        <ul className="space-y-3">
          {rows.map(({ l, p }) => (
            <li key={`${l.product_id}${l.size}${l.color}`} className="card flex gap-4 p-3 sm:p-4">
              <Link href={`/products/${p!.id}`} className="h-28 w-24 shrink-0 overflow-hidden rounded-lg"><ProductImage src={p!.images[0]} colors={[l.color, ...p!.colors]} name={p!.name} category={p!.category_name} /></Link>
              <div className="flex min-w-0 flex-1 flex-col">
                <Link href={`/products/${p!.id}`} className="line-clamp-2 font-medium hover:text-indigo">{p!.name}</Link>
                <p className="text-xs text-crimson">{p!.shop_name}</p>
                <p className="mt-1 text-sm text-slate-500">Size {l.size} · {l.color}</p>
                <div className="mt-auto flex items-center justify-between pt-2">
                  <div className="flex items-center rounded-lg border border-line"><button aria-label="Decrease quantity" className="p-2" onClick={() => cart.setQty(l, l.quantity - 1)}><Minus size={14} /></button><span className="w-8 text-center text-sm font-semibold">{l.quantity}</span><button aria-label="Increase quantity" className="p-2" onClick={() => cart.setQty(l, Math.min(p!.stock, l.quantity + 1))}><Plus size={14} /></button></div>
                  <p className="font-display font-semibold text-indigo-800">{rs(p!.final_price * l.quantity)}</p>
                </div>
              </div>
              <button aria-label={`Remove ${p!.name}`} className="self-start p-1 text-slate-400 hover:text-crimson" onClick={() => remove(l, p!.name)}><Trash2 size={18} /></button>
            </li>
          ))}
        </ul>
        <aside className="card h-fit p-5">
          <h2 className="text-lg font-semibold">Order summary</h2>
          <dl className="mt-4 space-y-2 text-sm"><div className="flex justify-between"><dt>Subtotal</dt><dd>{rs(subtotal)}</dd></div>{del.shops.map((s) => <div key={s.shop_id} className="flex justify-between gap-3"><dt>Delivery{del.shops.length > 1 ? ` · ${s.shop_name}` : ''}</dt><dd>{s.charge ? rs(s.charge) : 'Free'}</dd></div>)}<div className="flex justify-between border-t border-line pt-3 text-base font-semibold"><dt>Total to pay on delivery</dt><dd>{rs(subtotal + del.total)}</dd></div></dl>
          {del.shops.filter((s) => s.charge > 0 && s.freeAbove != null).map((s) => <p key={s.shop_id} className="mt-2 text-xs text-slate-500">Add {rs((s.freeAbove as number) - s.subtotal)} more from {s.shop_name} for free delivery.</p>)}
          {rows.length > 0 && new Set(rows.map((r) => r.p!.shop_id)).size > 1 && <p className="mt-3 rounded-lg bg-marigold-50 p-3 text-xs text-slate-700">Your items come from {new Set(rows.map((r) => r.p!.shop_id)).size} shops, so they’ll arrive as separate orders.</p>}
          <Link href="/checkout" className="btn btn-primary mt-5 w-full py-3">Proceed to checkout</Link>
          <Link href="/products" className="btn btn-ghost mt-2 w-full">Keep shopping</Link>
        </aside>
      </div>
    </div>
  );
}
