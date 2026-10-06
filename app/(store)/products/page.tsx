'use client';
import { Suspense, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { SlidersHorizontal, X } from 'lucide-react';
import { useQuery } from '@/lib/hooks';
import { listProducts } from '@/lib/services/products';
import { listShops } from '@/lib/services/shops';
import { publicCategories } from '@/lib/services/analytics';
import ProductCard from '@/components/ui/ProductCard';
import { EmptyState, ErrorState, ProductGridSkeleton } from '@/components/ui/States';

const SIZES = ['S', 'M', 'L', 'XL', 'Free', '2-3Y', '4-5Y', '6-7Y'];

function Listing() {
  const sp = useSearchParams();
  const router = useRouter();
  const [drawer, setDrawer] = useState(false);
  const get = (k: string) => sp.get(k) ?? '';
  const set = (k: string, v: string) => { const n = new URLSearchParams(sp.toString()); v ? n.set(k, v) : n.delete(k); router.replace(`/products?${n.toString()}`, { scroll: false }); };

  const filters = { q: get('q'), category: get('category'), shop: get('shop'), size: get('size'), sort: (get('sort') || 'latest') as 'latest', minPrice: get('min') ? +get('min') : undefined, maxPrice: get('max') ? +get('max') : undefined };
  const products = useQuery(() => listProducts(filters), [sp.toString()]);
  const cats = useQuery(publicCategories);
  const shops = useQuery(() => listShops({ activeOnly: true }));

  const panel = (
    <div className="space-y-6">
      <div><p className="label">Category</p><div className="space-y-1.5 text-sm">
        <label className="flex items-center gap-2"><input type="radio" name="cat" checked={!get('category')} onChange={() => set('category', '')} />All categories</label>
        {(cats.data ?? []).map((c) => <label key={c.id} className="flex items-center gap-2"><input type="radio" name="cat" checked={get('category') === c.id} onChange={() => set('category', c.id)} />{c.name}</label>)}</div></div>
      <div><label className="label" htmlFor="shop">Shop</label><select id="shop" className="input" value={get('shop')} onChange={(e) => set('shop', e.target.value)}><option value="">All shops</option>{(shops.data ?? []).map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}</select></div>
      <div><p className="label">Size</p><div className="flex flex-wrap gap-1.5">{SIZES.map((s) => <button key={s} onClick={() => set('size', get('size') === s ? '' : s)} aria-pressed={get('size') === s} className={`rounded-md border px-2.5 py-1 text-xs font-medium ${get('size') === s ? 'border-indigo bg-indigo text-white' : 'border-line hover:border-indigo'}`}>{s}</button>)}</div></div>
      <div><p className="label">Price (Rs.)</p><div className="flex items-center gap-2"><input className="input" inputMode="numeric" placeholder="Min" defaultValue={get('min')} onBlur={(e) => set('min', e.target.value)} aria-label="Minimum price" /><span>–</span><input className="input" inputMode="numeric" placeholder="Max" defaultValue={get('max')} onBlur={(e) => set('max', e.target.value)} aria-label="Maximum price" /></div></div>
      <button className="btn btn-outline w-full" onClick={() => router.replace('/products')}>Clear all filters</button>
    </div>
  );

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div><h1 className="text-2xl font-semibold sm:text-3xl">{get('q') ? `Results for “${get('q')}”` : 'All clothing'}</h1>{products.data && <p className="text-sm text-slate-500">{products.data.length} products</p>}</div>
        <div className="flex items-center gap-2">
          <button className="btn btn-outline lg:hidden" onClick={() => setDrawer(true)}><SlidersHorizontal size={16} />Filters</button>
          <select className="input !w-auto" aria-label="Sort by" value={get('sort') || 'latest'} onChange={(e) => set('sort', e.target.value)}>
            <option value="latest">Newest</option><option value="popular">Most popular</option><option value="price-asc">Price: low to high</option><option value="price-desc">Price: high to low</option>
          </select>
        </div>
      </div>
      <div className="grid gap-8 lg:grid-cols-[250px_1fr]">
        <aside className="hidden lg:block">{panel}</aside>
        <div>
          {products.loading ? <ProductGridSkeleton n={8} /> : products.error ? <ErrorState message={products.error} retry={products.reload} /> :
            products.data!.length === 0 ? <EmptyState title="No products match" text="Try removing a filter or searching for something broader like “kurta” or “lawn”." action={<button className="btn btn-primary" onClick={() => router.replace('/products')}>Clear filters</button>} /> :
            <div className="grid grid-cols-2 gap-3 sm:gap-5 md:grid-cols-3">{products.data!.map((p) => <ProductCard key={p.id} p={p} />)}</div>}
        </div>
      </div>
      {drawer && <div className="fixed inset-0 z-50 lg:hidden"><div className="absolute inset-0 bg-indigo-900/50" onClick={() => setDrawer(false)} /><div className="absolute inset-y-0 right-0 w-80 max-w-full overflow-y-auto bg-white p-5"><div className="mb-5 flex items-center justify-between"><h2 className="text-lg font-semibold">Filters</h2><button aria-label="Close filters" onClick={() => setDrawer(false)}><X /></button></div>{panel}<button className="btn btn-primary mt-6 w-full" onClick={() => setDrawer(false)}>Show results</button></div></div>}
    </div>
  );
}

export default function ProductsPage() { return <Suspense><Listing /></Suspense>; }
