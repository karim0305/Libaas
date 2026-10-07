'use client';
import { Banknote, Percent, Wallet } from 'lucide-react';
import { useQuery } from '@/lib/hooks';
import { useMyShop } from '@/components/useMyShop';
import { listShopOrders } from '@/lib/services/orders';
import { summarize } from '@/lib/services/analytics';
import CommissionExplainer from '@/components/CommissionExplainer';
import StatCard from '@/components/ui/StatCard';
import { EmptyState, ErrorState, Skeleton } from '@/components/ui/States';
import { rs, shortDate } from '@/lib/format';
import { usePlatform } from '@/components/Providers';

export default function Earnings() {
  const { shopId } = useMyShop();
  const { pct } = usePlatform();
  const q = useQuery(() => listShopOrders(shopId), [shopId]);
  if (q.loading) return <Skeleton className="h-96" />;
  if (q.error) return <ErrorState message={q.error} retry={q.reload} />;
  const s = summarize(q.data!);
  const delivered = q.data!.filter((o) => o.status === 'delivered');
  const upcoming = q.data!.filter((o) => ['referred', 'confirmed', 'processing', 'shipped'].includes(o.status)).reduce((a, o) => a + o.subtotal, 0);
  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-3"><StatCard label="Gross sales" value={rs(s.sales)} icon={Banknote} /><StatCard label="Commission deducted" value={`− ${rs(s.commission)}`} icon={Percent} tone="crimson" hint={`${pct} of each delivered order`} /><StatCard label="Net earnings" value={rs(s.earnings)} icon={Wallet} tone="green" hint={`Plus ${rs(upcoming)} still in progress`} /></div>
      <CommissionExplainer audience="shop" />
      <div className="card overflow-hidden"><h2 className="border-b border-line p-4 text-base font-semibold">Delivered orders breakdown</h2>
        {delivered.length === 0 ? <EmptyState title="No earnings yet" text="Earnings appear here once an order is delivered." /> : (
          <div className="overflow-x-auto"><table className="w-full"><thead><tr><th className="th">Order</th><th className="th">Date</th><th className="th text-right">Order amount</th><th className="th text-right">Commission</th><th className="th text-right">You earn</th></tr></thead>
            <tbody className="divide-y divide-line">{delivered.map((o) => <tr key={o.id}><td className="td font-semibold text-indigo-800">{o.order_no}</td><td className="td text-slate-500">{shortDate(o.created_at)}</td><td className="td text-right">{rs(o.subtotal)}</td><td className="td text-right text-crimson">− {rs(o.commission_amount)}</td><td className="td text-right font-semibold text-green-700">{rs(o.shop_earning)}</td></tr>)}</tbody>
            <tfoot><tr className="bg-surface font-semibold"><td className="td" colSpan={2}>Total</td><td className="td text-right">{rs(s.sales)}</td><td className="td text-right text-crimson">− {rs(s.commission)}</td><td className="td text-right text-green-700">{rs(s.earnings)}</td></tr></tfoot></table></div>)}
      </div>
    </div>
  );
}
