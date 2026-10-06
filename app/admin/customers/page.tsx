'use client';
import { useQuery } from '@/lib/hooks';
import { listCustomers } from '@/lib/services/analytics';
import { EmptyState, ErrorState, TableSkeleton } from '@/components/ui/States';
import { rs } from '@/lib/format';

export default function AdminCustomers() {
  const q = useQuery(listCustomers);
  return (
    <div className="card overflow-hidden"><h2 className="border-b border-line p-4 text-base font-semibold">Customers</h2>
      {q.loading ? <TableSkeleton /> : q.error ? <ErrorState message={q.error} retry={q.reload} /> : q.data!.length === 0 ? <EmptyState title="No customers yet" /> : (
        <div className="overflow-x-auto"><table className="w-full"><thead><tr><th className="th">Name</th><th className="th">Email</th><th className="th">Mobile</th><th className="th text-right">Orders</th><th className="th text-right">Delivered spend</th></tr></thead>
          <tbody className="divide-y divide-line">{q.data!.map((c) => <tr key={c.id}><td className="td font-medium">{c.name}</td><td className="td">{c.email}</td><td className="td">{c.phone}</td><td className="td text-right">{c.orders}</td><td className="td text-right">{rs(c.spent)}</td></tr>)}</tbody></table></div>)}
    </div>
  );
}
