'use client';
import { useMemo, useState } from 'react';
import { ArrowDown, ArrowUp, Search, X } from 'lucide-react';
import { useQuery } from '@/lib/hooks';
import { listAllProducts } from '@/lib/services/products';
import { isValidLink } from '@/lib/homeThemes';
import { rs } from '@/lib/format';
import type { Category, ProductView, Shop } from '@/lib/types';

export const toDay = (iso: string | null) => (iso ? new Date(iso).toLocaleDateString('en-CA') : '');
export const dayStart = (d: string) => (d ? new Date(`${d}T00:00:00`).toISOString() : null);
export const dayEnd = (d: string) => (d ? new Date(`${d}T23:59:59`).toISOString() : null);

/** Choose where a button or announcement goes: a ready-made page, a shop, a category, or a custom link. */
export function LinkPicker({ value, onChange, shops, cats, id }: { value: string; onChange: (v: string) => void; shops: Shop[]; cats: Category[]; id: string }) {
  const presets: [string, string][] = [['', 'No link'], ['/products', 'All products'], ['/shops', 'All shops'],
    ...cats.map((c): [string, string] => [`/products?category=${c.id}`, `Category: ${c.name}`]), ...shops.map((s): [string, string] => [`/shops/${s.id}`, `Shop page: ${s.name}`])];
  const isPreset = presets.some(([v]) => v === value);
  const [custom, setCustom] = useState(!isPreset);
  return (
    <div className="space-y-2">
      <select id={id} className="input" value={custom ? '__custom' : value} onChange={(e) => { if (e.target.value === '__custom') { setCustom(true); onChange(''); } else { setCustom(false); onChange(e.target.value); } }}>
        {presets.map(([v, l]) => <option key={v || 'none'} value={v}>{l}</option>)}
        <option value="__custom">Custom link…</option>
      </select>
      {custom && <input className="input" placeholder="/products?sort=latest  or  https://…" value={value} onChange={(e) => onChange(e.target.value)} aria-label="Custom link" aria-invalid={!isValidLink(value)} />}
      {!isValidLink(value) && <p className="text-xs text-crimson">Use a path like /products or a full address starting with https://</p>}
    </div>
  );
}

export function ScheduleFields({ start, end, active, onStart, onEnd, onActive }: { start: string; end: string; active: boolean; onStart: (v: string) => void; onEnd: (v: string) => void; onActive: (v: boolean) => void }) {
  return (
    <div className="grid gap-4 sm:grid-cols-3">
      <div><label className="label" htmlFor="st">Show from <span className="font-normal text-slate-400">(optional)</span></label><input id="st" type="date" className="input" value={start} max={end || undefined} onChange={(e) => onStart(e.target.value)} /></div>
      <div><label className="label" htmlFor="en">Hide after <span className="font-normal text-slate-400">(optional)</span></label><input id="en" type="date" className="input" value={end} min={start || undefined} onChange={(e) => onEnd(e.target.value)} /></div>
      <label className="flex items-end gap-2 pb-2.5 text-sm"><input type="checkbox" className="h-4 w-4 accent-[#1E2A5A]" checked={active} onChange={(e) => onActive(e.target.checked)} />Active (visible to customers)</label>
    </div>
  );
}

/** Search all products and pick them in order. */
export function ProductPicker({ value, onChange, max }: { value: string[]; onChange: (ids: string[]) => void; max: number }) {
  const all = useQuery(listAllProducts);
  const [q, setQ] = useState('');
  const byId = useMemo(() => new Map((all.data ?? []).map((p) => [p.id, p])), [all.data]);
  const results = useMemo(() => {
    const t = q.trim().toLowerCase();
    return (all.data ?? []).filter((p) => !value.includes(p.id) && (!t || `${p.name} ${p.shop_name}`.toLowerCase().includes(t))).slice(0, 8);
  }, [all.data, q, value]);
  const move = (i: number, d: number) => { const a = [...value]; const j = i + d; if (j < 0 || j >= a.length) return; [a[i], a[j]] = [a[j], a[i]]; onChange(a); };
  const full = value.length >= max;
  return (
    <div className="space-y-3">
      {value.length === 0 ? <p className="rounded-lg border border-dashed border-line p-3 text-sm text-slate-500">No products picked yet.</p> : (
        <ul className="divide-y divide-line rounded-lg border border-line">
          {value.map((id, i) => { const p: ProductView | undefined = byId.get(id); return (
            <li key={id} className="flex items-center gap-2 px-3 py-2 text-sm">
              <span className="w-5 text-xs text-slate-400">{i + 1}</span>
              <span className="min-w-0 flex-1"><span className="block truncate font-medium">{p ? p.name : 'Deleted product'}</span>{p && <span className="text-xs text-slate-500">{p.shop_name} · {rs(p.final_price)}</span>}</span>
              <button type="button" aria-label="Move up" className="btn btn-ghost btn-sm !p-1.5" onClick={() => move(i, -1)} disabled={i === 0}><ArrowUp size={14} /></button>
              <button type="button" aria-label="Move down" className="btn btn-ghost btn-sm !p-1.5" onClick={() => move(i, 1)} disabled={i === value.length - 1}><ArrowDown size={14} /></button>
              <button type="button" aria-label="Remove" className="btn btn-ghost btn-sm !p-1.5 !text-crimson" onClick={() => onChange(value.filter((x) => x !== id))}><X size={14} /></button>
            </li>); })}
        </ul>
      )}
      {full ? <p className="text-xs text-slate-500">You can pick up to {max} products here.</p> : (
        <div>
          <div className="relative"><Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" /><input className="input !pl-9" placeholder="Search product or shop to add…" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Search products to add" /></div>
          <ul className="mt-1 max-h-56 overflow-y-auto rounded-lg border border-line bg-white">
            {all.loading ? <li className="p-3 text-sm text-slate-500">Loading products…</li> : results.length === 0 ? <li className="p-3 text-sm text-slate-500">No matching products.</li> :
              results.map((p) => <li key={p.id}><button type="button" onClick={() => onChange([...value, p.id])} className="flex w-full items-center justify-between gap-3 px-3 py-2 text-left text-sm hover:bg-surface"><span className="min-w-0"><span className="block truncate">{p.name}</span><span className="text-xs text-slate-500">{p.shop_name}</span></span><span className="shrink-0 text-xs font-semibold text-indigo-800">+ Add · {rs(p.final_price)}</span></button></li>)}
          </ul>
        </div>
      )}
    </div>
  );
}
