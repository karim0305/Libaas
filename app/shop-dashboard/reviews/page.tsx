'use client';
import { useQuery } from '@/lib/hooks';
import { useMyShop } from '@/components/useMyShop';
import { listShopReviews } from '@/lib/services/reviews';
import { Stars } from '@/components/ui/Stars';
import { averageRating } from '@/components/ProductReviews';
import { EmptyState, ErrorState, Skeleton } from '@/components/ui/States';
import { shortDate } from '@/lib/format';

export default function ShopReviews() {
  const { shopId } = useMyShop();
  const q = useQuery(() => listShopReviews(shopId), [shopId]);
  if (q.loading) return <Skeleton className="h-64" />;
  if (q.error) return <ErrorState message={q.error} retry={q.reload} />;
  const list = q.data!; const avg = averageRating(list);
  return (
    <div className="space-y-4">
      <div className="card flex flex-wrap items-center gap-4 p-5"><p className="font-display text-4xl font-bold text-indigo-800">{list.length ? avg.toFixed(1) : '–'}</p><div><Stars value={avg} size={20} /><p className="mt-0.5 text-sm text-slate-500">{list.length} review{list.length === 1 ? '' : 's'} from customers whose orders were delivered</p></div></div>
      {list.length === 0 ? <div className="card"><EmptyState title="No reviews yet" text="Customers can review your products after their order is delivered." /></div> : (
        <ul className="space-y-3">{list.map((r) => (
          <li key={r.id} className="card p-4"><div className="flex flex-wrap items-center justify-between gap-2"><span className="flex items-center gap-2"><Stars value={r.rating} /><b className="text-sm">{r.customer_name}</b></span><span className="text-xs text-slate-500">{shortDate(r.created_at)}</span></div>
            <p className="mt-1 text-xs text-slate-500">{r.product_name} · <span className="font-mono">{r.product_code}</span></p>{r.comment && <p className="mt-2 text-sm text-slate-700">{r.comment}</p>}</li>))}</ul>)}
    </div>
  );
}
