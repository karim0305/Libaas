'use client';
import { Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useQuery } from '@/lib/hooks';
import { listAllOrders } from '@/lib/services/orders';
import OrdersTable from '@/components/OrdersTable';
import { ErrorState, TableSkeleton } from '@/components/ui/States';

function Inner() {
  const shop = useSearchParams().get('shop');
  const q = useQuery(listAllOrders);
  if (q.loading) return <div className="card"><TableSkeleton /></div>;
  if (q.error) return <ErrorState message={q.error} retry={q.reload} />;
  const rows = q.data!.filter((o) => !shop || o.shop_id === shop);
  return <div className="space-y-3">{shop && <div className="flex items-center gap-3 text-sm"><span>Showing orders for <b>{rows[0]?.shop_name ?? 'this shop'}</b></span><Link href="/admin/orders" className="btn btn-outline btn-sm">Show all shops</Link></div>}<OrdersTable orders={rows} showShop role="admin" title="All orders" /></div>;
}
export default function AdminOrders() { return <Suspense><Inner /></Suspense>; }
