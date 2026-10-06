'use client';
import { Banknote, Percent, Wallet } from 'lucide-react';
import { useQuery } from '@/lib/hooks';
import { listAllOrders } from '@/lib/services/orders';
import { listShops } from '@/lib/services/shops';
import { dailySeries, summarize } from '@/lib/services/analytics';
import StatCard from '@/components/ui/StatCard';
import CommissionExplainer from '@/components/CommissionExplainer';
import { ChartCard, LineSeries } from '@/components/charts';
import { EmptyState, ErrorState, Skeleton } from '@/components/ui/States';
import { rs, shortDate } from '@/lib/format';

export default function Commissions() {
  const o = useQuery(listAllOrders); const s = useQuery(() => listShops());
  if (o.error) return <ErrorState message={o.error} retry={o.reload} />;
  if (o.loading || s.loading || !o.data || !s.data) return <Skeleton className="h-96" />;
  const t = summarize(o.data);
  const byShop = s.data.map((shop) => { const d = o.data!.filter((x) => x.shop_id === shop.id && x.status === 'delivered'); return { shop, count: d.length, ...summarize(d) }; }).filter((x) => x.count > 0).sort((a, b) => b.commission - a.commission);
  const ledger = o.data.filter((x) => x.status === 'delivered').slice(0, 25);
  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-3"><StatCard label="Delivered sales" value={rs(t.sales)} icon={Banknote} /><StatCard label="Platform commission (5%)" value={rs(t.commission)} icon={Percent} tone="crimson" /><StatCard label="Paid out to shops" value={rs(t.earnings)} icon={Wallet} tone="green" /></div>
      <div className="grid gap-6 lg:grid-cols-[2fr_1fr]"><ChartCard title="Commission over time" sub="Last 30 days"><LineSeries data={dailySeries(o.data)} dataKey="commission" name="Commission" /></ChartCard><CommissionExplainer audience="admin" /></div>
      <div className="card overflow-hidden"><h2 className="border-b border-line p-4 text-base font-semibold">Commission by shop</h2>
        {byShop.length === 0 ? <EmptyState title="No commission yet" text="Commission is recorded when orders are delivered." /> : <div className="overflow-x-auto"><table className="w-full"><thead><tr><th className="th">Shop</th><th className="th text-right">Delivered orders</th><th className="th text-right">Sales</th><th className="th text-right">Commission</th><th className="th text-right">Shop earnings</th></tr></thead><tbody className="divide-y divide-line">{byShop.map((x) => <tr key={x.shop.id}><td className="td font-medium">{x.shop.name}</td><td className="td text-right">{x.count}</td><td className="td text-right">{rs(x.sales)}</td><td className="td text-right font-semibold text-crimson">{rs(x.commission)}</td><td className="td text-right text-green-700">{rs(x.earnings)}</td></tr>)}</tbody></table></div>}</div>
      <div className="card overflow-hidden"><h2 className="border-b border-line p-4 text-base font-semibold">Latest commission entries</h2>
        <div className="overflow-x-auto"><table className="w-full"><thead><tr><th className="th">Order</th><th className="th">Shop</th><th className="th">Date</th><th className="th text-right">Order amount</th><th className="th text-right">Commission</th><th className="th text-right">Shop earning</th></tr></thead><tbody className="divide-y divide-line">{ledger.map((x) => <tr key={x.id}><td className="td font-semibold text-indigo-800">{x.order_no}</td><td className="td">{x.shop_name}</td><td className="td text-slate-500">{shortDate(x.created_at)}</td><td className="td text-right">{rs(x.subtotal)}</td><td className="td text-right text-crimson">{rs(x.commission_amount)}</td><td className="td text-right text-green-700">{rs(x.shop_earning)}</td></tr>)}</tbody></table></div></div>
    </div>
  );
}
