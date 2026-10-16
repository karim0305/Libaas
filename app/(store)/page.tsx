'use client';
import { BRAND } from '@/lib/brand';
import Link from 'next/link';
import { ArrowRight, Truck, ShieldCheck, Banknote, RotateCcw } from 'lucide-react';
import { useQuery } from '@/lib/hooks';
import { getHomeSections, resolveSection } from '@/lib/services/homepage';
import { listShops } from '@/lib/services/shops';
import { publicCategories } from '@/lib/services/analytics';
import ProductCard from '@/components/ui/ProductCard';
import ProductImage from '@/components/ui/ProductImage';
import HeroSlider from '@/components/home/HeroSlider';
import HomeReviews from '@/components/home/HomeReviews';
import { ErrorState, ProductGridSkeleton } from '@/components/ui/States';
import type { HomeSection } from '@/lib/types';

const swatches = [['Maroon', 'Mustard'], ['Navy', 'White'], ['Teal', 'Peach'], ['Olive', 'Beige']];

/** One product row. What it shows (hand-picked or automatic, which shop) is set by the admin. */
function ProductSection({ section }: { section: HomeSection }) {
  const q = useQuery(() => resolveSection(section), [JSON.stringify(section)]);
  if (!section.enabled) return null;
  if (!q.loading && !q.error && q.data!.length === 0) return null; // nothing to show, so hide the section
  const sort = section.mode === 'best_selling' ? 'popular' : section.mode === 'latest' ? 'latest' : '';
  const href = `/products?${[sort && `sort=${sort}`, section.shop_id && `shop=${section.shop_id}`].filter(Boolean).join('&')}`;
  return (
    <section className="mx-auto max-w-7xl px-4 pt-14">
      <div className="mb-6 flex items-end justify-between"><h2 className="text-2xl font-semibold sm:text-3xl">{section.title}</h2><Link href={href} className="flex items-center gap-1 text-sm font-semibold text-crimson hover:underline">See all <ArrowRight size={15} /></Link></div>
      {q.loading ? <ProductGridSkeleton n={4} /> : q.error ? <ErrorState message={q.error} retry={q.reload} /> :
        <div className="grid grid-cols-2 gap-3 sm:gap-5 md:grid-cols-4">{q.data!.map((p) => <ProductCard key={p.id} p={p} />)}</div>}
    </section>
  );
}

export default function Home() {
  const sections = useQuery(getHomeSections);
  const shops = useQuery(() => listShops({ activeOnly: true }));
  const cats = useQuery(publicCategories);
  const sec = (k: string) => sections.data?.find((s) => s.key === k);

  return (
    <>
      <HeroSlider />

      <div className="border-b border-line bg-white">
        <ul className="mx-auto grid max-w-7xl grid-cols-2 gap-4 px-4 py-5 text-sm md:grid-cols-4">
          {[[Banknote, 'Cash on delivery', 'Pay when you receive'], [Truck, 'Nationwide delivery', '2–5 working days'], [ShieldCheck, 'Verified shops', `Approved by ${BRAND.name}`], [RotateCcw, '7-day returns', 'On unworn items']].map(([I, t, s]) => {
            const Icon = I as typeof Truck;
            return <li key={t as string} className="flex items-center gap-3"><Icon className="shrink-0 text-crimson" size={24} /><div><p className="font-semibold text-indigo-800">{t as string}</p><p className="text-xs text-slate-500">{s as string}</p></div></li>;
          })}
        </ul>
      </div>

      <section className="mx-auto max-w-7xl px-4 pt-14">
        <h2 className="mb-6 text-2xl font-semibold sm:text-3xl">Shop by category</h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {(cats.data ?? []).map((c, i) => (
            <Link key={c.id} href={`/products?category=${c.id}`} className="group flex items-center gap-3 rounded-xl border border-line p-3 transition-colors hover:border-indigo hover:bg-indigo-50">
              <span className="h-14 w-12 shrink-0 overflow-hidden rounded-lg"><ProductImage colors={swatches[i % 4]} name="" category={c.name} /></span>
              <span className="font-medium text-indigo-800 group-hover:text-crimson">{c.name}</span>
            </Link>
          ))}
        </div>
      </section>

      {sec('featured') && <ProductSection section={sec('featured')!} />}
      {sec('latest') && <ProductSection section={sec('latest')!} />}

      <section className="mt-14 bg-indigo-50 py-14">
        <div className="mx-auto max-w-7xl px-4">
          <div className="mb-6 flex items-end justify-between"><h2 className="text-2xl font-semibold sm:text-3xl">Shops we trust</h2><Link href="/shops" className="flex items-center gap-1 text-sm font-semibold text-crimson hover:underline">All shops <ArrowRight size={15} /></Link></div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {(shops.data ?? []).slice(0, 6).map((s) => (
              <Link key={s.id} href={`/shops/${s.id}`} className="card flex items-center gap-4 p-4 transition-shadow hover:shadow-lg">
                <span className="grid h-14 w-14 shrink-0 place-items-center rounded-xl bg-indigo font-display text-xl font-bold text-marigold">{s.name[0]}</span>
                <span className="min-w-0"><span className="block truncate font-semibold text-indigo-800">{s.name}</span><span className="text-sm text-slate-500">{s.city} · {s.product_count} products</span></span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {sec('popular') && <ProductSection section={sec('popular')!} />}
      <HomeReviews />
    </>
  );
}
