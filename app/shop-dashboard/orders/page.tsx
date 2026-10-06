'use client';
import { useQuery } from '@/lib/hooks';
import { useMyShop } from '@/components/useMyShop';
import { listShopOrders } from '@/lib/services/orders';
import OrdersTable from '@/components/OrdersTable';
import { ErrorState, TableSkeleton } from '@/components/ui/States';

export default function ShopOrders() {
  const { shopId } = useMyShop();
  const q = useQuery(() => listShopOrders(shopId), [shopId]);
  if (q.loading) return <div className="card"><TableSkeleton /></div>;
  if (q.error) return <ErrorState message={q.error} retry={q.reload} />;
  return <OrdersTable orders={q.data!} title="Incoming orders" />;
}
