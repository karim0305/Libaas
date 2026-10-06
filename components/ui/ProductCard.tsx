'use client';
import Link from 'next/link';
import { ShoppingBag } from 'lucide-react';
import ProductImage from './ProductImage';
import { useCart, useToast } from '../Providers';
import { rs } from '@/lib/format';
import type { ProductView } from '@/lib/types';
import { COLOR_HEX } from '@/lib/seed';

export default function ProductCard({ p }: { p: ProductView }) {
  const cart = useCart();
  const toast = useToast();
  const out = p.stock === 0;
  const quickAdd = () => {
    cart.add({ product_id: p.id, size: p.sizes[0], color: p.colors[0], quantity: 1 });
    toast(`${p.name} added to your cart (size ${p.sizes[0]}, ${p.colors[0]}). Change options in the cart.`);
  };
  return (
    <article className="group flex flex-col">
      <Link href={`/products/${p.id}`} className="relative block aspect-[4/5] overflow-hidden rounded-xl bg-surface">
        <div className="h-full w-full transition-transform duration-500 group-hover:scale-105"><ProductImage src={p.images[0]} colors={p.colors} name={p.name} category={p.category_name} /></div>
        {p.discount_percent > 0 && <span className="absolute left-2 top-2 rounded-md bg-crimson px-2 py-1 text-xs font-bold text-white">-{p.discount_percent}%</span>}
        {out && <span className="absolute inset-x-0 bottom-0 bg-indigo-900/80 py-1.5 text-center text-xs font-semibold text-white">Sold out</span>}
      </Link>
      <div className="mt-3 flex flex-1 flex-col">
        <Link href={`/shops/${p.shop_id}`} className="text-xs font-medium text-crimson hover:underline">{p.shop_name}</Link>
        <Link href={`/products/${p.id}`} className="mt-0.5 line-clamp-2 font-medium leading-snug text-slate-900 hover:text-indigo">{p.name}</Link>
        <div className="mt-1.5 flex items-baseline gap-2">
          <span className="font-display text-lg font-semibold text-indigo-800">{rs(p.final_price)}</span>
          {p.discount_percent > 0 && <span className="text-sm text-slate-400 line-through">{rs(p.price)}</span>}
        </div>
        <p className="mt-1 text-xs text-slate-500">Sizes: {p.sizes.join(', ')}</p>
        <div className="mt-1.5 flex gap-1.5" aria-label={`Colours: ${p.colors.join(', ')}`}>
          {p.colors.map((c) => <span key={c} title={c} className="h-4 w-4 rounded-full ring-1 ring-slate-300" style={{ background: COLOR_HEX[c] }} />)}
        </div>
        <button onClick={quickAdd} disabled={out} className="btn btn-outline mt-3 w-full">
          <ShoppingBag size={16} /> {out ? 'Sold out' : 'Add to cart'}
        </button>
      </div>
    </article>
  );
}
