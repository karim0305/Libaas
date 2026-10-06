'use client';
import { Banknote, ShoppingCart, TrendingUp } from 'lucide-react';
import { useQuery } from '@/lib/hooks';
import { useMyShop } from '@/components/useMyShop';
import { listShopOrders } from '@/lib/services/orders';
import { dailySeries, summarize } from '@/lib/services/analytics';
import { AreaSeries, ChartCard, CountBars, RankBars } from '@/components/charts';
import StatCard from '@/components/ui/StatCard';
import { ErrorState, Skeleton } from '@/components/ui/States';
import { rs } from '@/lib/format';

export default function ShopSales() {
  const { shopId } = useMyShop();
  const q = useQuery(() => listShopOrders(shopId), [shopId]);
  if (q.loading) return <Skeleton className="h-96" />;
  if (q.error) return <ErrorState message={q.error} retry={q.reload} />;
  const s = summarize(q.data!); const series = dailySeries(q.data!);
  const byProduct = new Map<string, number>();
  q.data!.filter((o) => o.status === 'delivered').forEach((o) => o.items.forEach((i) => byProduct.set(i.name, (byProduct.get(i.name) ?? 0) + i.unit_price * i.quantity)));
  const top = [...byProduct].map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value).slice(0, 6);
  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-3"><StatCard label="Total sales" value={rs(s.sales)} icon={Banknote} hint="Delivered orders" /><StatCard label="Delivered orders" value={s.delivered} icon={ShoppingCart} tone="green" /><StatCard label="Average order" value={rs(s.delivered ? s.sales / s.delivered : 0)} icon={TrendingUp} tone="gold" /></div>
      <div className="grid gap-6 lg:grid-cols-2"><ChartCard title="Sales over time" sub="Last 30 days"><AreaSeries data={series} keys={[{ key: 'sales', name: 'Sales' }]} /></ChartCard><ChartCard title="Orders over time" sub="Last 30 days"><CountBars data={series} /></ChartCard></div>
      <ChartCard title="Best-selling products" sub="By delivered sales value"><RankBars data={top} /></ChartCard>
    </div>
  );
}
