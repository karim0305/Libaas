'use client';
import Link from 'next/link';
import { Quote } from 'lucide-react';
import { useQuery } from '@/lib/hooks';
import { listHomeReviews } from '@/lib/services/reviews';
import { Stars } from '../ui/Stars';

/** Real reviews from customers whose orders were delivered. Admin can hide any review (Admin → Reviews). */
export default function HomeReviews() {
  const q = useQuery(() => listHomeReviews(6));
  if (q.loading || q.error || !q.data || q.data.length === 0) return null;
  return (
    <section className="mx-auto max-w-7xl px-4 pt-14">
      <h2 className="text-2xl font-semibold sm:text-3xl">What customers say</h2>
      <p className="mt-1 text-sm text-slate-500">Reviews from people who received their order.</p>
      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {q.data.map((r) => (
          <figure key={r.id} className="card flex flex-col p-5">
            <Quote className="text-marigold" size={22} />
            <blockquote className="mt-2 flex-1 text-sm leading-relaxed text-slate-700">{r.comment}</blockquote>
            <figcaption className="mt-4 border-t border-line pt-3 text-sm">
              <div className="flex items-center justify-between"><span className="font-semibold">{r.customer_name}</span><Stars value={r.rating} size={14} /></div>
              <Link href={`/products/${r.product_id}`} className="mt-0.5 block truncate text-xs text-slate-500 hover:text-indigo-800">on {r.product_name} · {r.shop_name}</Link>
            </figcaption>
          </figure>
        ))}
      </div>
    </section>
  );
}
