'use client';
import Link from 'next/link';
import ProductForm from '@/components/ProductForm';
import { useMyShop } from '@/components/useMyShop';
import { useQuery } from '@/lib/hooks';
import { getProduct } from '@/lib/services/products';
import { EmptyState, Skeleton } from '@/components/ui/States';

export default function EditProduct({ params }: { params: { id: string } }) {
  const { shopId } = useMyShop();
  const q = useQuery(() => getProduct(params.id), [params.id]);
  if (q.loading) return <Skeleton className="h-96" />;
  if (!q.data || q.data.shop_id !== shopId) return <EmptyState title="Product not found" text="It doesn’t exist or belongs to another shop." action={<Link href="/shop-dashboard/products" className="btn btn-primary">Back to products</Link>} />;
  return <ProductForm shopId={shopId} initial={q.data} />;
}
