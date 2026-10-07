'use client';
import { Banknote, CheckCircle2, Clock, Package, Percent, ShoppingCart, Wallet } from 'lucide-react';
import { useQuery } from '@/lib/hooks';
import { useMyShop } from '@/components/useMyShop';
import { listShopOrders } from '@/lib/services/orders';
import { listShopProducts } from '@/lib/services/products';
import { dailySeries, summarize } from '@/lib/services/analytics';
import StatCard from '@/components/ui/StatCard';
import OrdersTable from '@/components/OrdersTable';
import CommissionExplainer from '@/components/CommissionExplainer';
import { AreaSeries, ChartCard } from '@/components/charts';
import { ErrorState, Skeleton } from '@/components/ui/States';
import { rs } from '@/lib/format';
import { usePlatform } from '@/components/Providers';

export default function ShopHome() {
  const { shopId } = useMyShop();
  const { pct } = usePlatform();
  const o = useQuery(() => listShopOrders(shopId), [shopId]);
  const p = useQuery(() => listShopProducts(shopId), [shopId]);
  if (o.error) return <ErrorState message={o.error} retry={o.reload} />;
  if (o.loading || p.loading || !o.data || !p.data) return <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{Array.from({ length: 7 }, (_, i) => <Skeleton key={i} className="h-28" />)}</div>;
  const s = summarize(o.data);
  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Total products" value={p.data.length} icon={Package} />
        <StatCard label="Total orders" value={s.totalOrders} icon={ShoppingCart} />
        <StatCard label="Pending orders" hint="Referred, not yet delivered" value={s.pending} icon={Clock} tone="gold" />
        <StatCard label="Delivered orders" value={s.delivered} icon={CheckCircle2} tone="green" />
        <StatCard label="Total sales" value={rs(s.sales)} hint="Delivered orders only" icon={Banknote} />
        <StatCard label="Platform commission" value={rs(s.commission)} hint={`${pct} of delivered sales`} icon={Percent} tone="crimson" />
        <StatCard label="Net earnings" value={rs(s.earnings)} hint="Sales minus commission" icon={Wallet} tone="green" />
      </div>
      <div className="grid gap-6 xl:grid-cols-[2fr_1fr]">
        <ChartCard title="Sales and earnings" sub="Last 30 days, delivered orders"><AreaSeries data={dailySeries(o.data)} keys={[{ key: 'sales', name: 'Sales' }, { key: 'earnings', name: 'Net earnings', color: '#2F6B4F' }]} /></ChartCard>
        <CommissionExplainer audience="shop" />
      </div>
      <OrdersTable orders={o.data.slice(0, 10)} title="Recent orders" />
    </div>
  );
}
