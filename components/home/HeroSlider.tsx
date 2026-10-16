'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ChevronLeft, ChevronRight, MapPin } from 'lucide-react';
import { useQuery } from '@/lib/hooks';
import { getLiveSlides } from '@/lib/services/homepage';
import { BANNER_THEMES } from '@/lib/homeThemes';
import ProductImage from '../ui/ProductImage';
import { Skeleton } from '../ui/States';
import SmartLink from '../SmartLink';
import { rs } from '@/lib/format';
import type { HeroSlide } from '@/lib/types';

const DECOR: string[][] = [['Maroon', 'Mustard'], ['Navy', 'White'], ['Teal', 'Peach'], ['Olive', 'Beige']];

/** Shown only if the admin has no live banners, so the homepage is never empty. */
const FALLBACK: HeroSlide = {
  id: 'fallback', title: 'Eid ki shopping, ek hi jagah.', subtitle: 'Lawn from Faisalabad, kurtas from Karachi, waistcoats from Islamabad. Order from verified shops and pay cash when it reaches your door.',
  btn1_label: 'Shop all clothing', btn1_link: '/products', btn2_label: 'Meet the shops', btn2_link: '/shops', theme: 'indigo', image_url: null, shop_id: null,
  product_ids: [], sort_order: 0, is_active: true, starts_at: null, ends_at: null, shop: null, products: [],
};

function Slide({ s }: { s: HeroSlide }) {
  const t = BANNER_THEMES[s.theme] ?? BANNER_THEMES.indigo;
  const style = (s.image_url
    ? { backgroundColor: t.bg, backgroundImage: `linear-gradient(90deg, ${t.bg}f2 0%, ${t.bg}99 55%, ${t.bg}55 100%), url("${s.image_url}")`, backgroundSize: 'cover', backgroundPosition: 'center' }
    : { '--lat-bg': t.bg, '--lat-a': t.a, '--lat-b': t.b }) as React.CSSProperties;
  const tiles = s.products.slice(0, 4);
  return (
    <div className={`${s.image_url ? '' : 'lattice'} slide-in`} style={style}>
      <div className="mx-auto grid max-w-7xl items-center gap-8 px-4 py-12 pb-16 md:min-h-[500px] md:grid-cols-2 md:gap-10 md:py-16">
        <div className="rounded-2xl p-7 sm:p-10" style={{ backgroundColor: `${t.panel}ee` }}>
          {s.shop && <p className="mb-4 inline-flex items-center gap-1.5 rounded-full bg-marigold px-3 py-1 text-xs font-semibold text-indigo-900"><MapPin size={12} />From {s.shop.name} · {s.shop.city}</p>}
          <h1 className="font-display text-4xl font-bold leading-[1.05] !text-white sm:text-5xl lg:text-6xl">{s.title}</h1>
          {s.subtitle && <p className="mt-5 max-w-md text-base text-white/80 sm:text-lg">{s.subtitle}</p>}
          <div className="mt-8 flex flex-wrap gap-3">
            {s.btn1_label && s.btn1_link && <SmartLink href={s.btn1_link} className="btn btn-gold px-6 py-3">{s.btn1_label}</SmartLink>}
            {s.btn2_label && s.btn2_link && <SmartLink href={s.btn2_link} className="btn border border-white/40 px-6 py-3 text-white hover:bg-white/10">{s.btn2_label}</SmartLink>}
          </div>
        </div>
        {tiles.length > 0 ? (
          <div className="grid grid-cols-2 gap-3 sm:gap-4">
            {tiles.map((p, i) => (
              <Link key={p.id} href={`/products/${p.id}`} className={`group relative overflow-hidden rounded-2xl border-4 border-marigold bg-white ${i % 2 ? 'mt-6' : ''}`} style={{ aspectRatio: '4/5' }}>
                <div className="h-full w-full transition-transform duration-500 group-hover:scale-105"><ProductImage src={p.images[0]} colors={p.colors} name={p.name} category={p.category_name} /></div>
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-indigo-900/90 to-transparent p-2.5 pt-8 text-white"><p className="line-clamp-1 text-xs font-medium">{p.name}</p><p className="text-sm font-bold">{rs(p.final_price)}</p></div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:gap-4" aria-hidden>
            {DECOR.map((c, i) => <div key={i} className={`overflow-hidden rounded-2xl border-4 border-marigold bg-white ${i % 2 ? 'mt-6' : ''}`} style={{ aspectRatio: '4/5' }}><ProductImage colors={c} name="" category={i === 3 ? 'Winter Shawls' : undefined} /></div>)}
          </div>
        )}
      </div>
    </div>
  );
}

export default function HeroSlider() {
  const q = useQuery(getLiveSlides);
  const [i, setI] = useState(0);
  const [paused, setPaused] = useState(false);
  const slides = q.data && q.data.length ? q.data : [FALLBACK];
  const n = slides.length;
  useEffect(() => { if (i >= n) setI(0); }, [n, i]);
  useEffect(() => {
    if (n < 2 || paused || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const t = setInterval(() => setI((x) => (x + 1) % n), 6500);
    return () => clearInterval(t);
  }, [n, paused]);

  if (q.loading) return <Skeleton className="h-[520px] w-full !rounded-none" />;
  const cur = slides[i % n];
  return (
    <section className="relative" aria-roledescription="carousel" aria-label="Featured offers" onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)} onFocus={() => setPaused(true)} onBlur={() => setPaused(false)}>
      <Slide key={cur.id} s={cur} />
      {n > 1 && (
        <>
          <button aria-label="Previous slide" onClick={() => setI((i - 1 + n) % n)} className="absolute left-2 top-1/2 hidden -translate-y-1/2 rounded-full bg-white/20 p-2 text-white backdrop-blur hover:bg-white/35 md:block"><ChevronLeft /></button>
          <button aria-label="Next slide" onClick={() => setI((i + 1) % n)} className="absolute right-2 top-1/2 hidden -translate-y-1/2 rounded-full bg-white/20 p-2 text-white backdrop-blur hover:bg-white/35 md:block"><ChevronRight /></button>
          <div className="absolute inset-x-0 bottom-4 flex justify-center gap-2" role="tablist" aria-label="Choose slide">
            {slides.map((s, k) => <button key={s.id} role="tab" aria-selected={k === i % n} aria-label={`Slide ${k + 1}`} onClick={() => setI(k)} className={`h-2.5 rounded-full transition-all ${k === i % n ? 'w-7 bg-marigold' : 'w-2.5 bg-white/50 hover:bg-white/80'}`} />)}
          </div>
        </>
      )}
    </section>
  );
}
