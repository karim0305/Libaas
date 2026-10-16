'use client';
import { useEffect, useState } from 'react';
import { useQuery } from '@/lib/hooks';
import { getHomeSections, saveSection } from '@/lib/services/homepage';
import { listShops } from '@/lib/services/shops';
import { useToast } from '../Providers';
import { ProductPicker } from './fields';
import { Skeleton } from '../ui/States';
import type { HomeSection, SectionMode, Shop } from '@/lib/types';

const INFO: Record<string, { name: string; hint: string }> = {
  featured: { name: 'Featured this week', hint: 'Your hand-picked favourites. Good for new arrivals, offers or a shop you want to push.' },
  popular: { name: 'Popular right now', hint: 'Usually automatic: the best-selling products. You can limit it to one shop or hand-pick instead.' },
  latest: { name: 'Just added', hint: 'Newest products. Automatic, and can be limited to one shop.' },
};

function Card({ section, shops }: { section: HomeSection; shops: Shop[] }) {
  const toast = useToast();
  const [s, setS] = useState(section); const [busy, setBusy] = useState(false);
  useEffect(() => setS(section), [JSON.stringify(section)]); // eslint-disable-line
  const dirty = JSON.stringify(s) !== JSON.stringify(section);
  const save = async () => {
    if (!s.title.trim()) { toast('Give the section a title.', 'error'); return; }
    setBusy(true);
    try { await saveSection({ ...s, title: s.title.trim(), shop_id: s.mode === 'manual' ? null : s.shop_id }); toast(`“${s.title}” saved.`); }
    catch (x) { toast((x as Error).message, 'error'); }
    setBusy(false);
  };
  const info = INFO[s.key];
  return (
    <section className="card space-y-4 p-5">
      <div className="flex flex-wrap items-start justify-between gap-3"><div><h3 className="text-base font-semibold">{info.name}</h3><p className="mt-0.5 max-w-xl text-sm text-slate-600">{info.hint}</p></div>
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" className="h-4 w-4 accent-[#1E2A5A]" checked={s.enabled} onChange={(e) => setS({ ...s, enabled: e.target.checked })} />Show on homepage</label></div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div><label className="label" htmlFor={`t-${s.key}`}>Heading</label><input id={`t-${s.key}`} maxLength={60} className="input" value={s.title} onChange={(e) => setS({ ...s, title: e.target.value })} /></div>
        <div><label className="label" htmlFor={`m-${s.key}`}>Which products?</label><select id={`m-${s.key}`} className="input" value={s.mode} onChange={(e) => setS({ ...s, mode: e.target.value as SectionMode })}>
          <option value="manual">I pick them by hand</option><option value="best_selling">Best sellers (automatic)</option><option value="latest">Newest (automatic)</option></select></div>
      </div>
      {s.mode === 'manual' ? (
        <div><p className="label">Products, in the order they appear</p><ProductPicker value={s.product_ids} onChange={(ids) => setS({ ...s, product_ids: ids })} max={12} />{s.product_ids.length === 0 && <p className="mt-2 text-xs text-crimson">Nothing picked, so this section is hidden until you add products.</p>}</div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          <div><label className="label" htmlFor={`s-${s.key}`}>From which shop?</label><select id={`s-${s.key}`} className="input" value={s.shop_id ?? ''} onChange={(e) => setS({ ...s, shop_id: e.target.value || null })}><option value="">All shops</option>{shops.map((x) => <option key={x.id} value={x.id}>{x.name}</option>)}</select></div>
          <div><label className="label" htmlFor={`n-${s.key}`}>How many?</label><select id={`n-${s.key}`} className="input" value={s.item_limit} onChange={(e) => setS({ ...s, item_limit: +e.target.value })}>{[4, 8, 12].map((n) => <option key={n} value={n}>{n} products</option>)}</select></div>
        </div>
      )}
      <div className="flex items-center gap-3"><button className="btn btn-primary" disabled={busy || !dirty} onClick={save}>{busy ? 'Saving…' : 'Save changes'}</button>{!dirty && <span className="text-xs text-slate-400">No unsaved changes</span>}</div>
    </section>
  );
}

export default function SectionsAdmin() {
  const q = useQuery(getHomeSections); const shops = useQuery(() => listShops({ activeOnly: true }));
  if (q.loading) return <div className="space-y-4"><Skeleton className="h-56" /><Skeleton className="h-56" /></div>;
  return (
    <div className="space-y-4">
      <p className="max-w-2xl text-sm text-slate-600">Choose what appears in each product row on the homepage. Products from deactivated shops are hidden automatically.</p>
      {(q.data ?? []).map((s) => <Card key={s.key} section={s} shops={shops.data ?? []} />)}
    </div>
  );
}
