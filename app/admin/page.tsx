'use client';
import Link from 'next/link';
import { Banknote, CheckCircle2, Clock, Package, Percent, ShoppingCart, Store, StoreIcon, Users } from 'lucide-react';
import { useQuery } from '@/lib/hooks';
import { adminOverview } from '@/lib/services/analytics';
import StatCard from '@/components/ui/StatCard';
import CommissionExplainer from '@/components/CommissionExplainer';
import { AreaSeries, ChartCard, CountBars, LineSeries, RankBars } from '@/components/charts';
import { ErrorState, Skeleton } from '@/components/ui/States';
import { rs } from '@/lib/format';
import { usePlatform } from '@/components/Providers';

export default function AdminHome() {
  const q = useQuery(adminOverview);
  const { pct } = usePlatform();
  if (q.error) return <ErrorState message={q.error} retry={q.reload} />;
  if (q.loading || !q.data) return <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">{Array.from({ length: 9 }, (_, i) => <Skeleton key={i} className="h-28" />)}</div>;
  const d = q.data;
  return (
    <div className="space-y-6">
      {d.toRefer > 0 && <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-crimson/30 bg-crimson-50 p-4 text-sm"><span><b>{d.toRefer}</b> new order{d.toRefer > 1 ? 's are' : ' is'} waiting to be referred to a shop.</span><Link href="/admin/orders" className="btn btn-danger btn-sm">Open orders</Link></div>}
      {d.pendingShops > 0 && <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-marigold bg-marigold-50 p-4 text-sm"><span><b>{d.pendingShops}</b> shop{d.pendingShops > 1 ? 's are' : ' is'} waiting for approval.</span><Link href="/admin/shops" className="btn btn-gold btn-sm">Review shops</Link></div>}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <StatCard label="Total shops" value={d.shops} icon={Store} />
        <StatCard label="Active shops" value={d.activeShops} icon={StoreIcon} tone="green" />
        <StatCard label="Pending shops" value={d.pendingShops} icon={Clock} tone="gold" />
        <StatCard label="Total customers" value={d.customers} icon={Users} />
        <StatCard label="Total products" value={d.products} icon={Package} />
        <StatCard label="Total orders" value={d.totalOrders} icon={ShoppingCart} />
        <StatCard label="Delivered orders" value={d.delivered} icon={CheckCircle2} tone="green" />
        <StatCard label="Total sales" value={rs(d.sales)} hint="Delivered orders only" icon={Banknote} />
        <StatCard label={`Platform revenue (${pct})`} value={rs(d.commission)} hint="Commission on delivered orders" icon={Percent} tone="crimson" />
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        <ChartCard title="Sales over time" sub="Last 30 days"><AreaSeries data={d.series} keys={[{ key: 'sales', name: 'Sales' }]} /></ChartCard>
        <ChartCard title="Orders over time" sub="Last 30 days, all statuses"><CountBars data={d.series} /></ChartCard>
        <ChartCard title="Top shops" sub="By delivered sales"><RankBars data={d.topShops.map((s) => ({ name: s.name, value: s.sales }))} /></ChartCard>
        <ChartCard title="Top products" sub="By delivered sales"><RankBars color="#A3162F" data={d.topProducts.map((s) => ({ name: s.name, value: s.sales }))} /></ChartCard>
        <ChartCard title="Platform commission" sub="Daily, last 30 days"><LineSeries data={d.series} dataKey="commission" name="Commission" /></ChartCard>
        <CommissionExplainer audience="admin" />
      </div>
    </div>
  );
}
