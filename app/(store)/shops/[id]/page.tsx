'use client';

import Link from 'next/link';
import { MapPin } from 'lucide-react';
import { useQuery } from '@/lib/hooks';
import { getShop } from '@/lib/services/shops';
import { listProducts } from '@/lib/services/products';
import ProductCard from '@/components/ui/ProductCard';
import { EmptyState, ErrorState, ProductGridSkeleton } from '@/components/ui/States';

export default function ShopPage({ params }: { params: { id: string } }) {
  const { id } = params;
  const shop = useQuery(() => getShop(id), [id]);
  const prods = useQuery(() => listProducts({ shop: id }), [id]);
  if (shop.error) return <ErrorState message={shop.error} retry={shop.reload} />;
  if (!shop.loading && (!shop.data || shop.data.status !== 'active')) return <EmptyState title="This shop isn’t available" text="It may be waiting for approval or temporarily switched off." action={<Link href="/shops" className="btn btn-primary">See other shops</Link>} />;
  return (
    <div>
      <div className="lattice"><div className="mx-auto max-w-7xl px-4 py-10"><div className="max-w-xl rounded-2xl bg-indigo-800/95 p-6 text-white"><h1 className="font-display text-3xl font-bold !text-white">{shop.data?.name ?? '…'}</h1><p className="mt-1 flex items-center gap-1 text-indigo-200"><MapPin size={15} />{shop.data?.city}</p><p className="mt-3 text-indigo-100">{shop.data?.description}</p></div></div></div>
      <div className="mx-auto max-w-7xl px-4 py-10">
        <h2 className="mb-6 text-2xl font-semibold">Products</h2>
        {prods.loading ? <ProductGridSkeleton n={4} /> : prods.data!.length === 0 ? <EmptyState title="No products yet" text="This shop hasn’t listed anything. Check back soon." /> : <div className="grid grid-cols-2 gap-3 sm:gap-5 md:grid-cols-4">{prods.data!.map((p) => <ProductCard key={p.id} p={p} />)}</div>}
      </div>
    </div>
  );
}
