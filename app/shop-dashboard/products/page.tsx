'use client';
import Link from 'next/link';
import { Pencil, Plus, Trash2 } from 'lucide-react';
import { useQuery } from '@/lib/hooks';
import { useMyShop } from '@/components/useMyShop';
import { deleteProduct, listShopProducts } from '@/lib/services/products';
import { useConfirm, useToast } from '@/components/Providers';
import ProductImage from '@/components/ui/ProductImage';
import { EmptyState, ErrorState, TableSkeleton } from '@/components/ui/States';
import { rs } from '@/lib/format';

export default function ShopProducts() {
  const { shopId } = useMyShop(); const confirm = useConfirm(); const toast = useToast();
  const q = useQuery(() => listShopProducts(shopId), [shopId]);
  const del = async (id: string, name: string) => { if (await confirm({ title: 'Delete this product?', message: `“${name}” will be removed from the marketplace. Past orders keep their details.`, confirmLabel: 'Delete product', danger: true })) { await deleteProduct(id); toast('Product deleted.', 'info'); } };
  return (
    <div className="card overflow-hidden">
      <div className="flex items-center justify-between border-b border-line p-4"><h2 className="text-base font-semibold">Your products</h2><Link href="/shop-dashboard/products/new" className="btn btn-primary btn-sm"><Plus size={15} />Add product</Link></div>
      {q.loading ? <TableSkeleton /> : q.error ? <ErrorState message={q.error} retry={q.reload} /> : q.data!.length === 0 ? <EmptyState title="No products yet" text="Add your first product to start receiving orders." action={<Link href="/shop-dashboard/products/new" className="btn btn-primary">Add product</Link>} /> : (
        <div className="overflow-x-auto"><table className="w-full"><thead><tr><th className="th">Product</th><th className="th">Category</th><th className="th text-right">Price</th><th className="th text-right">Stock</th><th className="th text-right">Sold</th><th className="th">Actions</th></tr></thead>
          <tbody className="divide-y divide-line">{q.data!.map((p) => (
            <tr key={p.id}><td className="td"><div className="flex items-center gap-3"><span className="h-12 w-10 shrink-0 overflow-hidden rounded-md"><ProductImage src={p.images[0]} colors={p.colors} name={p.name} category={p.category_name} /></span><span className="max-w-[240px] truncate font-medium">{p.name}</span></div></td>
              <td className="td">{p.category_name}</td><td className="td text-right">{rs(p.final_price)}{p.discount_percent > 0 && <span className="ml-1 text-xs text-crimson">-{p.discount_percent}%</span>}</td>
              <td className={`td text-right ${p.stock <= 5 ? 'font-semibold text-crimson' : ''}`}>{p.stock}</td><td className="td text-right">{p.sold}</td>
              <td className="td"><div className="flex gap-1.5"><Link href={`/shop-dashboard/products/${p.id}`} className="btn btn-outline btn-sm"><Pencil size={13} />Edit</Link><button className="btn btn-outline btn-sm !text-crimson" onClick={() => del(p.id, p.name)} aria-label={`Delete ${p.name}`}><Trash2 size={13} /></button></div></td></tr>))}</tbody></table></div>
      )}
    </div>
  );
}
