'use client';
import { useQuery } from '@/lib/hooks';
import { listAllReviews, setReviewHidden } from '@/lib/services/reviews';
import { useConfirm, useToast } from '@/components/Providers';
import { Stars } from '@/components/ui/Stars';
import { EmptyState, ErrorState, TableSkeleton } from '@/components/ui/States';
import { shortDate } from '@/lib/format';
import type { ReviewView } from '@/lib/types';

export default function AdminReviews() {
  const q = useQuery(listAllReviews); const confirm = useConfirm(); const toast = useToast();
  const toggle = async (r: ReviewView) => {
    if (!r.is_hidden && !(await confirm({ title: 'Hide this review?', message: 'It disappears from the product page, the shop and the homepage. You can show it again later.', confirmLabel: 'Hide review', danger: true }))) return;
    await setReviewHidden(r.id, !r.is_hidden); toast(r.is_hidden ? 'Review is visible again.' : 'Review hidden.', 'info');
  };
  return (
    <div className="card overflow-hidden"><div className="border-b border-line p-4"><h2 className="text-base font-semibold">Reviews</h2><p className="text-xs text-slate-500">Only customers whose order was delivered can review. Hide anything abusive or fake. Good reviews (4–5 stars with a comment) appear on the homepage.</p></div>
      {q.loading ? <TableSkeleton /> : q.error ? <ErrorState message={q.error} retry={q.reload} /> : q.data!.length === 0 ? <EmptyState title="No reviews yet" text="They appear here once customers review delivered orders." /> : (
        <div className="overflow-x-auto"><table className="w-full"><thead><tr><th className="th">Product</th><th className="th">Shop</th><th className="th">Rating</th><th className="th">Review</th><th className="th">Customer</th><th className="th">Date</th><th className="th" /></tr></thead>
          <tbody className="divide-y divide-line">{q.data!.map((r) => (
            <tr key={r.id} className={r.is_hidden ? 'bg-slate-50 opacity-70' : ''}><td className="td max-w-[200px] truncate" title={r.product_name}>{r.product_name}<span className="block font-mono text-xs text-slate-500">{r.product_code}</span></td><td className="td">{r.shop_name}</td><td className="td"><Stars value={r.rating} size={14} /></td><td className="td max-w-[320px] whitespace-normal text-slate-700">{r.comment || <span className="text-slate-400">No comment</span>}</td><td className="td">{r.customer_name}</td><td className="td text-slate-500">{shortDate(r.created_at)}</td><td className="td"><button className={`btn btn-sm ${r.is_hidden ? 'btn-outline' : 'btn-outline !text-crimson'}`} onClick={() => toggle(r)}>{r.is_hidden ? 'Show' : 'Hide'}</button></td></tr>))}</tbody></table></div>)}
    </div>
  );
}
