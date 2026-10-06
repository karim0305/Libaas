'use client';
import Link from 'next/link';
import { useQuery } from '@/lib/hooks';
import { listShops, setShopStatus } from '@/lib/services/shops';
import { useConfirm, useToast } from '@/components/Providers';
import StatusBadge from '@/components/ui/StatusBadge';
import { ErrorState, TableSkeleton } from '@/components/ui/States';
import { shortDate } from '@/lib/format';
import type { ShopStatus } from '@/lib/types';

export default function AdminShops() {
  const q = useQuery(() => listShops());
  const confirm = useConfirm(); const toast = useToast();
  const act = async (id: string, name: string, status: ShopStatus, verb: string) => {
    const ok = await confirm({ title: `${verb} ${name}?`, message: status === 'active' ? 'The shop and its products become visible to customers.' : status === 'rejected' ? 'The owner is told the registration was rejected.' : 'Its products disappear from the marketplace. Existing orders stay open.', confirmLabel: verb, danger: status !== 'active' });
    if (ok) { await setShopStatus(id, status); toast(`${name}: ${verb.toLowerCase()} done.`); }
  };
  const rows = q.data ?? [];
  const ordered = [...rows].sort((a, b) => (a.status === 'pending' ? -1 : 0) - (b.status === 'pending' ? -1 : 0));
  return (
    <div className="card overflow-hidden">
      <h2 className="border-b border-line p-4 text-base font-semibold">All shops</h2>
      {q.loading ? <TableSkeleton /> : q.error ? <ErrorState message={q.error} retry={q.reload} /> : (
        <div className="overflow-x-auto"><table className="w-full"><thead><tr><th className="th">Shop</th><th className="th">City</th><th className="th">Phone</th><th className="th text-right">Products</th><th className="th">Joined</th><th className="th">Status</th><th className="th">Actions</th></tr></thead>
          <tbody className="divide-y divide-line">{ordered.map((s) => (
            <tr key={s.id}><td className="td font-medium">{s.name}</td><td className="td">{s.city}</td><td className="td">{s.phone}</td><td className="td text-right">{s.product_count}</td><td className="td text-slate-500">{shortDate(s.created_at)}</td><td className="td"><StatusBadge status={s.status} /></td>
              <td className="td"><div className="flex flex-wrap gap-1.5">
                {s.status === 'pending' && <><button className="btn btn-primary btn-sm" onClick={() => act(s.id, s.name, 'active', 'Approve')}>Approve</button><button className="btn btn-outline btn-sm !text-crimson" onClick={() => act(s.id, s.name, 'rejected', 'Reject')}>Reject</button></>}
                {s.status === 'active' && <button className="btn btn-outline btn-sm" onClick={() => act(s.id, s.name, 'inactive', 'Deactivate')}>Deactivate</button>}
                {(s.status === 'inactive' || s.status === 'rejected') && <button className="btn btn-outline btn-sm" onClick={() => act(s.id, s.name, 'active', 'Activate')}>Activate</button>}
                <Link href={`/admin/orders?shop=${s.id}`} className="btn btn-ghost btn-sm">Orders</Link><Link href={`/admin/products?shop=${s.id}`} className="btn btn-ghost btn-sm">Products</Link></div></td></tr>))}</tbody></table></div>)}
    </div>
  );
}
