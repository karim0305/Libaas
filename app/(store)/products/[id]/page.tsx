'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Minus, Plus, Store } from 'lucide-react';
import { useQuery } from '@/lib/hooks';
import { getProduct, relatedProducts } from '@/lib/services/products';
import { useCart, useToast } from '@/components/Providers';
import ProductImage from '@/components/ui/ProductImage';
import ProductCard from '@/components/ui/ProductCard';
import { EmptyState, ErrorState, Skeleton } from '@/components/ui/States';
import { COLOR_HEX } from '@/lib/seed';
import { rs } from '@/lib/format';

export default function ProductPage({ params }: { params: { id: string } }) {
  const { id } = params;
  const q = useQuery(() => getProduct(id), [id]);
  const rel = useQuery(() => relatedProducts(id), [id]);
  const cart = useCart(); const toast = useToast(); const router = useRouter();
  const [size, setSize] = useState(''); const [color, setColor] = useState(''); const [qty, setQty] = useState(1); const [img, setImg] = useState(0);
  const p = q.data;
  useEffect(() => { if (p) { setSize(p.sizes[0]); setColor(p.colors[0]); setQty(1); setImg(0); } }, [p?.id]); // eslint-disable-line

  if (q.loading) return <div className="mx-auto grid max-w-7xl gap-10 px-4 py-10 md:grid-cols-2"><Skeleton className="aspect-[4/5]" /><div className="space-y-4"><Skeleton className="h-8 w-3/4" /><Skeleton className="h-6 w-1/3" /><Skeleton className="h-32" /></div></div>;
  if (q.error) return <ErrorState message={q.error} retry={q.reload} />;
  if (!p) return <EmptyState title="Product not found" text="It may have been removed by the shop." action={<Link href="/products" className="btn btn-primary">Browse products</Link>} />;

  const gallery = p.images.length ? p.images : [undefined, undefined, undefined];
  const out = p.stock === 0;
  const line = { product_id: p.id, size, color, quantity: qty };
  const add = () => { cart.add(line); toast(`${p.name} added to your cart.`); };
  const buyNow = () => { cart.add(line); router.push('/checkout'); };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <nav className="mb-6 text-sm text-slate-500"><Link href="/" className="hover:underline">Home</Link> / <Link href={`/products?category=${p.category_id}`} className="hover:underline">{p.category_name}</Link> / <span className="text-slate-800">{p.name}</span></nav>
      <div className="grid gap-10 md:grid-cols-2">
        <div>
          <div className="aspect-[4/5] overflow-hidden rounded-2xl bg-surface"><ProductImage src={gallery[img]} colors={img === 0 ? p.colors : [...p.colors].reverse()} name={p.name} category={p.category_name} /></div>
          <div className="mt-3 grid grid-cols-4 gap-3">{gallery.slice(0, 4).map((g, i) => <button key={i} onClick={() => setImg(i)} aria-label={`Image ${i + 1}`} className={`aspect-square overflow-hidden rounded-lg ring-2 ${img === i ? 'ring-indigo' : 'ring-transparent'}`}><ProductImage src={g} colors={i % 2 ? [...p.colors].reverse() : p.colors} name="" category={p.category_name} /></button>)}</div>
        </div>
        <div>
          <Link href={`/shops/${p.shop_id}`} className="inline-flex items-center gap-1.5 text-sm font-semibold text-crimson hover:underline"><Store size={15} />{p.shop_name}</Link>
          <h1 className="mt-2 text-3xl font-semibold">{p.name}</h1>
          <div className="mt-3 flex items-baseline gap-3"><span className="font-display text-3xl font-bold text-indigo-800">{rs(p.final_price)}</span>{p.discount_percent > 0 && <><span className="text-lg text-slate-400 line-through">{rs(p.price)}</span><span className="rounded-md bg-crimson px-2 py-0.5 text-xs font-bold text-white">Save {p.discount_percent}%</span></>}</div>
          <p className="mt-5 max-w-prose leading-relaxed text-slate-600">{p.description}</p>

          <div className="mt-6"><p className="label">Size: <span className="font-normal text-slate-500">{size}</span></p><div className="flex flex-wrap gap-2">{p.sizes.map((s) => <button key={s} onClick={() => setSize(s)} aria-pressed={size === s} className={`min-w-12 rounded-lg border px-3 py-2 text-sm font-medium ${size === s ? 'border-indigo bg-indigo text-white' : 'border-line hover:border-indigo'}`}>{s}</button>)}</div></div>
          <div className="mt-5"><p className="label">Colour: <span className="font-normal text-slate-500">{color}</span></p><div className="flex flex-wrap gap-2.5">{p.colors.map((c) => <button key={c} onClick={() => setColor(c)} title={c} aria-label={c} aria-pressed={color === c} className={`h-9 w-9 rounded-full ring-2 ring-offset-2 ${color === c ? 'ring-indigo' : 'ring-slate-200'}`} style={{ background: COLOR_HEX[c] }} />)}</div></div>

          <p className={`mt-5 text-sm font-medium ${out ? 'text-crimson' : p.stock <= 10 ? 'text-amber-700' : 'text-green-700'}`}>{out ? 'Out of stock' : p.stock <= 10 ? `Only ${p.stock} left` : 'In stock'}</p>
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <div className="flex items-center rounded-lg border border-line"><button aria-label="Decrease quantity" className="p-3" onClick={() => setQty(Math.max(1, qty - 1))}><Minus size={16} /></button><span className="w-10 text-center font-semibold" aria-live="polite">{qty}</span><button aria-label="Increase quantity" className="p-3" onClick={() => setQty(Math.min(p.stock, qty + 1))}><Plus size={16} /></button></div>
            <button className="btn btn-outline px-6 py-3" disabled={out} onClick={add}>Add to cart</button>
            <button className="btn btn-primary px-6 py-3" disabled={out} onClick={buyNow}>Buy now</button>
          </div>
          <p className="mt-6 rounded-lg bg-indigo-50 p-3 text-sm text-indigo-800">Cash on delivery. You pay {rs(p.final_price * qty)} when the order reaches you.</p>
        </div>
      </div>
      {rel.data && rel.data.length > 0 && <section className="mt-16"><h2 className="mb-6 text-2xl font-semibold">You may also like</h2><div className="grid grid-cols-2 gap-3 sm:gap-5 md:grid-cols-4">{rel.data.map((r) => <ProductCard key={r.id} p={r} />)}</div></section>}
    </div>
  );
}
