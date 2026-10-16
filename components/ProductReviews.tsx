import { Stars } from './ui/Stars';
import { Skeleton } from './ui/States';
import { shortDate } from '@/lib/format';
import type { ReviewView } from '@/lib/types';

export const averageRating = (r: { rating: number }[]) => (r.length ? r.reduce((s, x) => s + x.rating, 0) / r.length : 0);

export default function ProductReviews({ reviews, loading }: { reviews: ReviewView[]; loading: boolean }) {
  const avg = averageRating(reviews);
  return (
    <section id="reviews" className="mt-14 scroll-mt-24">
      <h2 className="text-2xl font-semibold">Customer reviews</h2>
      {loading ? <Skeleton className="mt-4 h-24" /> : reviews.length === 0 ? <p className="mt-3 rounded-xl border border-dashed border-line p-5 text-sm text-slate-500">No reviews yet. Customers can review this product after their order is delivered.</p> : (
        <div className="mt-5 grid gap-6 md:grid-cols-[220px_1fr]">
          <div className="card h-fit p-5 text-center">
            <p className="font-display text-4xl font-bold text-indigo-800">{avg.toFixed(1)}</p>
            <div className="mt-1 flex justify-center"><Stars value={avg} size={18} /></div>
            <p className="mt-1 text-xs text-slate-500">{reviews.length} review{reviews.length > 1 ? 's' : ''}</p>
            <ul className="mt-4 space-y-1 text-xs">{[5, 4, 3, 2, 1].map((n) => { const c = reviews.filter((r) => r.rating === n).length; return <li key={n} className="flex items-center gap-2"><span className="w-3 text-right">{n}</span><span className="h-1.5 flex-1 overflow-hidden rounded-full bg-slate-200"><span className="block h-full bg-marigold" style={{ width: `${(c / reviews.length) * 100}%` }} /></span><span className="w-4 text-slate-500">{c}</span></li>; })}</ul>
          </div>
          <ul className="space-y-4">
            {reviews.map((r) => (
              <li key={r.id} className="card p-4">
                <div className="flex flex-wrap items-center justify-between gap-2"><span className="flex items-center gap-2"><Stars value={r.rating} /><span className="text-sm font-semibold">{r.customer_name}</span></span><span className="text-xs text-slate-500">{shortDate(r.created_at)} · Verified purchase</span></div>
                {r.comment && <p className="mt-2 text-sm leading-relaxed text-slate-700">{r.comment}</p>}
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}
