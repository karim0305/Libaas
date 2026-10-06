'use client';
import Link from 'next/link';
import { ArrowRight, Truck, ShieldCheck, Banknote, RotateCcw } from 'lucide-react';
import { useQuery } from '@/lib/hooks';
import { listProducts } from '@/lib/services/products';
import { listShops } from '@/lib/services/shops';
import { publicCategories } from '@/lib/services/analytics';
import ProductCard from '@/components/ui/ProductCard';
import ProductImage from '@/components/ui/ProductImage';
import { ErrorState, ProductGridSkeleton } from '@/components/ui/States';
import { COLOR_HEX } from '@/lib/seed';

function Section({ title, href, children }: { title: string; href?: string; children: React.ReactNode }) {
  return (
    <section className="mx-auto max-w-7xl px-4 pt-14">
      <div className="mb-6 flex items-end justify-between"><h2 className="text-2xl font-semibold sm:text-3xl">{title}</h2>{href && <Link href={href} className="flex items-center gap-1 text-sm font-semibold text-crimson hover:underline">See all <ArrowRight size={15} /></Link>}</div>
      {children}
    </section>
  );
}

function Grid({ q }: { q: ReturnType<typeof useQuery<import('@/lib/types').ProductView[]>> }) {
  if (q.loading) return <ProductGridSkeleton n={4} />;
  if (q.error) return <ErrorState message={q.error} retry={q.reload} />;
  return <div className="grid grid-cols-2 gap-3 sm:gap-5 md:grid-cols-4">{q.data!.map((p) => <ProductCard key={p.id} p={p} />)}</div>;
}

export default function Home() {
  const featured = useQuery(() => listProducts({ featured: true, limit: 4 }));
  const latest = useQuery(() => listProducts({ sort: 'latest', limit: 4 }));
  const popular = useQuery(() => listProducts({ sort: 'popular', limit: 4 }));
  const shops = useQuery(() => listShops({ activeOnly: true }));
  const cats = useQuery(publicCategories);
  const swatches = [['Maroon', 'Mustard'], ['Navy', 'White'], ['Teal', 'Peach'], ['Olive', 'Beige']];

  return (
    <>
      <section className="lattice relative overflow-hidden">
        <div className="mx-auto grid max-w-7xl items-center gap-10 px-4 py-14 md:grid-cols-2 md:py-20">
          <div className="rounded-2xl bg-indigo-800/95 p-7 sm:p-10">
            <h1 className="font-display text-4xl font-bold leading-[1.05] text-white sm:text-5xl lg:text-6xl">Eid ki shopping, ek hi jagah.</h1>
            <p className="mt-5 max-w-md text-base text-indigo-100 sm:text-lg">Lawn from Faisalabad, kurtas from Karachi, waistcoats from Islamabad. Order from verified shops and pay cash when it reaches your door.</p>
            <div className="mt-8 flex flex-wrap gap-3"><Link href="/products" className="btn btn-gold px-6 py-3">Shop all clothing</Link><Link href="/shops" className="btn border border-indigo-400 px-6 py-3 text-white hover:bg-indigo-700">Meet the shops</Link></div>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:gap-4" aria-hidden>
            {swatches.map((c, i) => (
              <div key={i} className={`overflow-hidden rounded-2xl border-4 border-marigold bg-white ${i % 2 ? 'mt-6' : ''}`} style={{ aspectRatio: '4/5' }}>
                <ProductImage colors={c.map((x) => (COLOR_HEX[x] ? x : 'Navy'))} name="" category={i === 3 ? 'Winter Shawls' : undefined} />
              </div>
            ))}
          </div>
        </div>
      </section>

      <div className="border-b border-line bg-white">
        <ul className="mx-auto grid max-w-7xl grid-cols-2 gap-4 px-4 py-5 text-sm md:grid-cols-4">
          {[[Banknote, 'Cash on delivery', 'Pay when you receive'], [Truck, 'Nationwide delivery', '2–5 working days'], [ShieldCheck, 'Verified shops', 'Approved by Libaas'], [RotateCcw, '7-day returns', 'On unworn items']].map(([I, t, s]) => {
            const Icon = I as typeof Truck;
            return <li key={t as string} className="flex items-center gap-3"><Icon className="shrink-0 text-crimson" size={24} /><div><p className="font-semibold text-indigo-800">{t as string}</p><p className="text-xs text-slate-500">{s as string}</p></div></li>;
          })}
        </ul>
      </div>

      <Section title="Shop by category">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {(cats.data ?? []).map((c, i) => (
            <Link key={c.id} href={`/products?category=${c.id}`} className="group flex items-center gap-3 rounded-xl border border-line p-3 transition-colors hover:border-indigo hover:bg-indigo-50">
              <span className="h-14 w-12 shrink-0 overflow-hidden rounded-lg"><ProductImage colors={swatches[i % 4]} name="" category={c.name} /></span>
              <span className="font-medium text-indigo-800 group-hover:text-crimson">{c.name}</span>
            </Link>
          ))}
        </div>
      </Section>

      <Section title="Featured this week" href="/products?sort=popular"><Grid q={featured} /></Section>
      <Section title="Just added" href="/products?sort=latest"><Grid q={latest} /></Section>

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

      <Section title="Popular right now" href="/products?sort=popular"><Grid q={popular} /></Section>
    </>
  );
}
