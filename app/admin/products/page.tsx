'use client';
import { Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Trash2 } from 'lucide-react';
import { useQuery } from '@/lib/hooks';
import { deleteProduct, listAllProducts } from '@/lib/services/products';
import { useConfirm, useToast } from '@/components/Providers';
import ProductImage from '@/components/ui/ProductImage';
import { EmptyState, ErrorState, TableSkeleton } from '@/components/ui/States';
import { rs } from '@/lib/format';

function Inner() {
  const shop = useSearchParams().get('shop');
  const q = useQuery(listAllProducts);
  const confirm = useConfirm(); const toast = useToast();
  const rows = (q.data ?? []).filter((p) => !shop || p.shop_id === shop);
  const del = async (id: string, name: string) => { if (await confirm({ title: 'Remove this product?', message: `“${name}” will be deleted from the marketplace for everyone.`, confirmLabel: 'Delete product', danger: true })) { await deleteProduct(id); toast('Product deleted.', 'info'); } };
  return (
    <div className="card overflow-hidden">
      <div className="flex items-center justify-between border-b border-line p-4"><h2 className="text-base font-semibold">Products {shop && <span className="font-normal text-slate-500">(one shop)</span>}</h2>{shop && <Link href="/admin/products" className="btn btn-outline btn-sm">Show all</Link>}</div>
      {q.loading ? <TableSkeleton /> : q.error ? <ErrorState message={q.error} retry={q.reload} /> : rows.length === 0 ? <EmptyState title="No products" /> : (
        <div className="overflow-x-auto"><table className="w-full"><thead><tr><th className="th">Product</th><th className="th">Shop</th><th className="th">Category</th><th className="th text-right">Price</th><th className="th text-right">Stock</th><th className="th text-right">Sold</th><th className="th" /></tr></thead>
          <tbody className="divide-y divide-line">{rows.map((p) => <tr key={p.id}><td className="td"><div className="flex items-center gap-3"><span className="h-10 w-8 shrink-0 overflow-hidden rounded"><ProductImage src={p.images[0]} colors={p.colors} name={p.name} category={p.category_name} /></span><span className="max-w-[240px] truncate">{p.name}</span></div></td><td className="td">{p.shop_name}</td><td className="td">{p.category_name}</td><td className="td text-right">{rs(p.final_price)}</td><td className="td text-right">{p.stock}</td><td className="td text-right">{p.sold}</td><td className="td"><button aria-label={`Delete ${p.name}`} className="btn btn-ghost btn-sm !text-crimson" onClick={() => del(p.id, p.name)}><Trash2 size={15} /></button></td></tr>)}</tbody></table></div>)}
    </div>
  );
}
export default function AdminProducts() { return <Suspense><Inner /></Suspense>; }
