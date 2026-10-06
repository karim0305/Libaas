'use client';
import Link from 'next/link';
import { MapPin } from 'lucide-react';
import { useQuery } from '@/lib/hooks';
import { listShops } from '@/lib/services/shops';
import { EmptyState, ErrorState, Skeleton } from '@/components/ui/States';

export default function ShopsPage() {
  const q = useQuery(() => listShops({ activeOnly: true }));
  return (
    <div className="mx-auto max-w-7xl px-4 py-10">
      <h1 className="text-3xl font-semibold">Shops on Libaas</h1>
      <p className="mt-1 text-slate-500">Every shop is reviewed before it can sell.</p>
      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {q.loading ? Array.from({ length: 6 }, (_, i) => <Skeleton key={i} className="h-36" />) : q.error ? <div className="col-span-full"><ErrorState message={q.error} retry={q.reload} /></div> :
          q.data!.length === 0 ? <div className="col-span-full"><EmptyState title="No shops yet" /></div> :
          q.data!.map((s) => (
            <Link key={s.id} href={`/shops/${s.id}`} className="card p-5 transition-shadow hover:shadow-lg">
              <div className="flex items-center gap-3"><span className="grid h-12 w-12 place-items-center rounded-xl bg-indigo font-display text-lg font-bold text-marigold">{s.name[0]}</span><div><h2 className="font-semibold">{s.name}</h2><p className="flex items-center gap-1 text-sm text-slate-500"><MapPin size={13} />{s.city}</p></div></div>
              <p className="mt-3 line-clamp-2 text-sm text-slate-600">{s.description}</p>
              <p className="mt-3 text-sm font-semibold text-crimson">{s.product_count} products</p>
            </Link>
          ))}
      </div>
    </div>
  );
}
