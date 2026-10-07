'use client';
import { useMemo, useState } from 'react';
import { Banknote, Percent, Wallet } from 'lucide-react';
import { useQuery } from '@/lib/hooks';
import { listAllOrders } from '@/lib/services/orders';
import { listShops } from '@/lib/services/shops';
import { dailySeries, summarize } from '@/lib/services/analytics';
import { usePlatform } from '@/components/Providers';
import StatCard from '@/components/ui/StatCard';
import CommissionExplainer from '@/components/CommissionExplainer';
import { ChartCard, LineSeries } from '@/components/charts';
import { EmptyState, ErrorState, Skeleton } from '@/components/ui/States';
import { rs, shortDate } from '@/lib/format';
import type { Order } from '@/lib/types';

const localDay = (d: Date | string) => new Date(d).toLocaleDateString('en-CA'); // YYYY-MM-DD in the viewer's timezone
const daysBack = (n: number) => localDay(new Date(Date.now() - n * 86400000));

/** Groups delivered orders by shop. */
function byShop(orders: Order[]) {
  const m = new Map<string, { shop_id: string; name: string; count: number; sales: number; commission: number; earnings: number }>();
  for (const o of orders) {
    if (o.status !== 'delivered') continue;
    const e = m.get(o.shop_id) ?? { shop_id: o.shop_id, name: o.shop_name, count: 0, sales: 0, commission: 0, earnings: 0 };
    e.count++; e.sales += o.subtotal; e.commission += o.commission_amount; e.earnings += o.shop_earning;
    m.set(o.shop_id, e);
  }
  return [...m.values()].sort((a, b) => b.commission - a.commission);
}

function ShopTable({ rows, empty }: { rows: ReturnType<typeof byShop>; empty: string }) {
  const t = rows.reduce((a, r) => ({ count: a.count + r.count, sales: a.sales + r.sales, commission: a.commission + r.commission, earnings: a.earnings + r.earnings }), { count: 0, sales: 0, commission: 0, earnings: 0 });
  if (rows.length === 0) return <EmptyState title="No commission here" text={empty} />;
  return (
    <div className="overflow-x-auto"><table className="w-full"><thead><tr><th className="th">Shop</th><th className="th text-right">Delivered orders</th><th className="th text-right">Sales</th><th className="th text-right">Commission</th><th className="th text-right">Shop earnings</th></tr></thead>
      <tbody className="divide-y divide-line">{rows.map((x) => <tr key={x.shop_id}><td className="td font-medium">{x.name}</td><td className="td text-right">{x.count}</td><td className="td text-right">{rs(x.sales)}</td><td className="td text-right font-semibold text-crimson">{rs(x.commission)}</td><td className="td text-right text-green-700">{rs(x.earnings)}</td></tr>)}</tbody>
      <tfoot><tr className="bg-surface font-semibold"><td className="td">Total</td><td className="td text-right">{t.count}</td><td className="td text-right">{rs(t.sales)}</td><td className="td text-right text-crimson">{rs(t.commission)}</td><td className="td text-right text-green-700">{rs(t.earnings)}</td></tr></tfoot></table></div>
  );
}

export default function Commissions() {
  const o = useQuery(listAllOrders); const s = useQuery(() => listShops());
  const { pct } = usePlatform();
  const [from, setFrom] = useState(daysBack(30)); const [to, setTo] = useState(localDay(new Date()));
  const orders = o.data ?? [];

  // range is applied to the day the order was delivered (when commission was earned)
  const inRange = useMemo(() => orders.filter((x) => {
    if (x.status !== 'delivered') return false;
    const day = localDay(x.delivered_at ?? x.created_at);
    return (!from || day >= from) && (!to || day <= to);
  }), [orders, from, to]);

  if (o.error) return <ErrorState message={o.error} retry={o.reload} />;
  if (o.loading || s.loading || !o.data || !s.data) return <Skeleton className="h-96" />;
  const t = summarize(o.data);
  const ledger = o.data.filter((x) => x.status === 'delivered').slice(0, 25);
  const rangeTotals = summarize(inRange);
  const bad = !!from && !!to && from > to;
  const presets: [string, () => void][] = [
    ['Last 7 days', () => { setFrom(daysBack(7)); setTo(localDay(new Date())); }],
    ['Last 30 days', () => { setFrom(daysBack(30)); setTo(localDay(new Date())); }],
    ['This month', () => { const d = new Date(); setFrom(localDay(new Date(d.getFullYear(), d.getMonth(), 1))); setTo(localDay(d)); }],
    ['All time', () => { setFrom(''); setTo(''); }],
  ];

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-3"><StatCard label="Delivered sales" value={rs(t.sales)} icon={Banknote} /><StatCard label={`Platform commission (${pct})`} value={rs(t.commission)} icon={Percent} tone="crimson" /><StatCard label="Paid out to shops" value={rs(t.earnings)} icon={Wallet} tone="green" /></div>
      <div className="grid gap-6 lg:grid-cols-[2fr_1fr]"><ChartCard title="Commission over time" sub="Last 30 days"><LineSeries data={dailySeries(o.data)} dataKey="commission" name="Commission" /></ChartCard><CommissionExplainer audience="admin" /></div>

      <div className="card overflow-hidden"><h2 className="border-b border-line p-4 text-base font-semibold">Commission by shop (all time)</h2><ShopTable rows={byShop(o.data)} empty="Commission is recorded when orders are delivered." /></div>

      <div className="card overflow-hidden">
        <div className="border-b border-line p-4">
          <h2 className="text-base font-semibold">Commission by shop (date range)</h2>
          <p className="mt-0.5 text-xs text-slate-500">Counts orders by the day they were delivered.</p>
          <div className="mt-3 flex flex-wrap items-end gap-3">
            <div><label className="label" htmlFor="from">From</label><input id="from" type="date" className="input !w-auto" value={from} max={to || undefined} onChange={(e) => setFrom(e.target.value)} /></div>
            <div><label className="label" htmlFor="to">To</label><input id="to" type="date" className="input !w-auto" value={to} min={from || undefined} onChange={(e) => setTo(e.target.value)} /></div>
            <div className="flex flex-wrap gap-1.5">{presets.map(([l, fn]) => <button key={l} className="btn btn-outline btn-sm" onClick={fn}>{l}</button>)}</div>
          </div>
          {bad && <p role="alert" className="mt-2 text-sm text-crimson">“From” date must be before “To” date.</p>}
          {!bad && <p className="mt-3 text-sm text-slate-600">{from || to ? `${from ? shortDate(from) : 'Start'} to ${to ? shortDate(to) : 'today'}` : 'All time'}: <b>{rangeTotals.delivered}</b> delivered orders, <b>{rs(rangeTotals.sales)}</b> sales, <b className="text-crimson">{rs(rangeTotals.commission)}</b> commission.</p>}
        </div>
        {!bad && <ShopTable rows={byShop(inRange)} empty="No orders were delivered in this date range. Try a wider range." />}
      </div>

      <div className="card overflow-hidden"><h2 className="border-b border-line p-4 text-base font-semibold">Latest commission entries</h2>
        <div className="overflow-x-auto"><table className="w-full"><thead><tr><th className="th">Order</th><th className="th">Shop</th><th className="th">Delivered</th><th className="th text-right">Order amount</th><th className="th text-right">Commission</th><th className="th text-right">Shop earning</th></tr></thead><tbody className="divide-y divide-line">{ledger.map((x) => <tr key={x.id}><td className="td font-semibold text-indigo-800">{x.order_no}</td><td className="td">{x.shop_name}</td><td className="td text-slate-500">{shortDate(x.delivered_at ?? x.created_at)}</td><td className="td text-right">{rs(x.subtotal)}</td><td className="td text-right text-crimson">{rs(x.commission_amount)}</td><td className="td text-right text-green-700">{rs(x.shop_earning)}</td></tr>)}</tbody></table></div></div>
    </div>
  );
}
