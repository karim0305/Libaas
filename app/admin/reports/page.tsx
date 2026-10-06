'use client';
import { Download } from 'lucide-react';
import { useQuery } from '@/lib/hooks';
import { listAllOrders } from '@/lib/services/orders';
import { dailySeries, summarize } from '@/lib/services/analytics';
import { AreaSeries, ChartCard, RankBars } from '@/components/charts';
import { ErrorState, Skeleton } from '@/components/ui/States';
import { useToast } from '@/components/Providers';
import { rs } from '@/lib/format';
import { ORDER_STATUSES } from '@/lib/types';

export default function Reports() {
  const q = useQuery(listAllOrders); const toast = useToast();
  if (q.error) return <ErrorState message={q.error} retry={q.reload} />;
  if (q.loading || !q.data) return <Skeleton className="h-96" />;
  const orders = q.data; const t = summarize(orders);
  const csv = () => {
    const head = 'Order,Shop,Customer,City,Status,Amount,Commission,ShopEarning,Date';
    const body = orders.map((o) => [o.order_no, `"${o.shop_name}"`, `"${o.customer_name}"`, o.city, o.status, o.subtotal, o.commission_amount, o.shop_earning, o.created_at.slice(0, 10)].join(','));
    const url = URL.createObjectURL(new Blob([[head, ...body].join('\n')], { type: 'text/csv' }));
    const a = document.createElement('a'); a.href = url; a.download = 'libaas-orders-report.csv'; a.click(); URL.revokeObjectURL(url); toast('Report downloaded.');
  };
  const byCity = Object.entries(orders.reduce<Record<string, number>>((m, o) => ({ ...m, [o.city]: (m[o.city] ?? 0) + 1 }), {})).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value).slice(0, 6);
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between"><p className="text-sm text-slate-500">Summary of every order on the platform.</p><button className="btn btn-primary btn-sm" onClick={csv}><Download size={15} />Download CSV</button></div>
      <div className="card overflow-hidden"><h2 className="border-b border-line p-4 text-base font-semibold">Orders by status</h2><div className="overflow-x-auto"><table className="w-full"><thead><tr><th className="th">Status</th><th className="th text-right">Orders</th><th className="th text-right">Value</th></tr></thead><tbody className="divide-y divide-line">{ORDER_STATUSES.map((s) => { const r = orders.filter((o) => o.status === s); return <tr key={s}><td className="td capitalize">{s}</td><td className="td text-right">{r.length}</td><td className="td text-right">{rs(r.reduce((a, o) => a + o.subtotal, 0))}</td></tr>; })}</tbody><tfoot><tr className="bg-surface font-semibold"><td className="td">Commission earned (delivered only)</td><td className="td text-right">{t.delivered}</td><td className="td text-right text-crimson">{rs(t.commission)}</td></tr></tfoot></table></div></div>
      <div className="grid gap-6 lg:grid-cols-2"><ChartCard title="Sales vs commission" sub="Last 30 days"><AreaSeries data={dailySeries(orders)} keys={[{ key: 'sales', name: 'Sales' }, { key: 'commission', name: 'Commission' }]} /></ChartCard><ChartCard title="Orders by city" sub="All statuses"><RankBars data={byCity} money={false} color="#F0A202" /></ChartCard></div>
    </div>
  );
}
