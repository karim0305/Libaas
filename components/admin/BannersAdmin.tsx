'use client';
import { useState } from 'react';
import { ArrowDown, ArrowUp, ImagePlus, Pencil, Plus, Trash2, X } from 'lucide-react';
import { useQuery } from '@/lib/hooks';
import { deleteBanner, listBanners, reorderBanners, saveBanner, uploadSiteImage } from '@/lib/services/homepage';
import { listShops } from '@/lib/services/shops';
import { publicCategories } from '@/lib/services/analytics';
import { useConfirm, useToast } from '../Providers';
import { BANNER_THEMES, isLive, isValidLink } from '@/lib/homeThemes';
import { LinkPicker, ProductPicker, ScheduleFields, dayEnd, dayStart, toDay } from './fields';
import { EmptyState, TableSkeleton } from '../ui/States';
import { shortDate } from '@/lib/format';
import type { Banner, BannerTheme } from '@/lib/types';

type Visual = 'decor' | 'shop' | 'products';

function Form({ initial, onDone }: { initial?: Banner; onDone: () => void }) {
  const toast = useToast();
  const shops = useQuery(() => listShops({ activeOnly: true })); const cats = useQuery(publicCategories);
  const [f, setF] = useState({
    title: initial?.title ?? '', subtitle: initial?.subtitle ?? '', b1l: initial?.btn1_label ?? '', b1u: initial?.btn1_link ?? '', b2l: initial?.btn2_label ?? '', b2u: initial?.btn2_link ?? '',
    theme: (initial?.theme ?? 'indigo') as BannerTheme, image: initial?.image_url ?? '', shop_id: initial?.shop_id ?? '', ids: initial?.product_ids ?? [] as string[],
    visual: (initial?.product_ids.length ? 'products' : initial?.shop_id ? 'shop' : 'decor') as Visual,
    start: toDay(initial?.starts_at ?? null), end: toDay(initial?.ends_at ?? null), active: initial?.is_active ?? true,
  });
  const [busy, setBusy] = useState(false); const [up, setUp] = useState(false);
  const t = BANNER_THEMES[f.theme];

  const pickImage = async (file?: File) => {
    if (!file) return;
    if (file.size > 1_500_000) { toast('Image is over 1.5 MB. Use a smaller one (about 1600×700 works well).', 'error'); return; }
    setUp(true);
    try { setF((x) => ({ ...x, image: '' })); const url = await uploadSiteImage(file); setF((x) => ({ ...x, image: url })); } catch (x) { toast((x as Error).message, 'error'); }
    setUp(false);
  };
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!f.title.trim()) { toast('Write a headline.', 'error'); return; }
    if (!isValidLink(f.b1u) || !isValidLink(f.b2u)) { toast('One of the button links isn’t valid.', 'error'); return; }
    if (f.visual === 'shop' && !f.shop_id) { toast('Choose which shop’s products to show.', 'error'); return; }
    if (f.visual === 'products' && f.ids.length === 0) { toast('Pick at least one product, or choose another option.', 'error'); return; }
    setBusy(true);
    try {
      await saveBanner({ id: initial?.id, title: f.title.trim(), subtitle: f.subtitle.trim(), btn1_label: f.b1l.trim(), btn1_link: f.b1u, btn2_label: f.b2l.trim(), btn2_link: f.b2u, theme: f.theme,
        image_url: f.image || null, shop_id: f.visual === 'shop' ? f.shop_id : null, product_ids: f.visual === 'products' ? f.ids.slice(0, 4) : [], is_active: f.active, starts_at: dayStart(f.start), ends_at: dayEnd(f.end) });
      toast(initial ? 'Banner updated.' : 'Banner added.'); onDone();
    } catch (x) { toast((x as Error).message, 'error'); setBusy(false); }
  };
  const shopList = shops.data ?? []; const catList = cats.data ?? [];
  return (
    <form onSubmit={submit} className="card space-y-5 border-indigo p-5">
      <h3 className="text-base font-semibold">{initial ? 'Edit banner' : 'New banner'}</h3>
      <div className="overflow-hidden rounded-lg" style={f.image ? { backgroundImage: `linear-gradient(90deg, ${t.bg}f2, ${t.bg}66), url("${f.image}")`, backgroundSize: 'cover', backgroundPosition: 'center' } : { backgroundColor: t.bg }}>
        <div className="p-5 text-white"><p className="text-xs opacity-70">Preview</p><p className="font-display text-xl font-bold leading-tight">{f.title || 'Your headline'}</p>{f.subtitle && <p className="mt-1 line-clamp-2 text-sm opacity-80">{f.subtitle}</p>}<div className="mt-3 flex gap-2 text-xs font-semibold">{f.b1l && <span className="rounded-md bg-marigold px-3 py-1.5 text-indigo-900">{f.b1l}</span>}{f.b2l && <span className="rounded-md border border-white/40 px-3 py-1.5">{f.b2l}</span>}</div></div>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2"><label className="label" htmlFor="bt">Headline</label><input id="bt" maxLength={100} className="input" value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} placeholder="Eid ki shopping, ek hi jagah." /></div>
        <div className="sm:col-span-2"><label className="label" htmlFor="bs">Text under the headline</label><textarea id="bs" rows={2} maxLength={300} className="input" value={f.subtitle} onChange={(e) => setF({ ...f, subtitle: e.target.value })} /></div>
        <div><label className="label" htmlFor="b1l">Button 1 text</label><input id="b1l" className="input" value={f.b1l} onChange={(e) => setF({ ...f, b1l: e.target.value })} placeholder="Shop all clothing" /></div>
        <div><label className="label" htmlFor="b1u">Button 1 goes to</label><LinkPicker id="b1u" value={f.b1u} onChange={(v) => setF({ ...f, b1u: v })} shops={shopList} cats={catList} /></div>
        <div><label className="label" htmlFor="b2l">Button 2 text <span className="font-normal text-slate-400">(optional)</span></label><input id="b2l" className="input" value={f.b2l} onChange={(e) => setF({ ...f, b2l: e.target.value })} placeholder="Meet the shops" /></div>
        <div><label className="label" htmlFor="b2u">Button 2 goes to</label><LinkPicker id="b2u" value={f.b2u} onChange={(v) => setF({ ...f, b2u: v })} shops={shopList} cats={catList} /></div>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div><label className="label" htmlFor="th">Colour</label><select id="th" className="input" value={f.theme} onChange={(e) => setF({ ...f, theme: e.target.value as BannerTheme })}>{(Object.keys(BANNER_THEMES) as BannerTheme[]).map((k) => <option key={k} value={k}>{BANNER_THEMES[k].label}</option>)}</select></div>
        <div><p className="label">Background photo <span className="font-normal text-slate-400">(optional)</span></p>
          {f.image ? <div className="flex items-center gap-3"><img src={f.image} alt="" className="h-12 w-20 rounded-md object-cover" /><button type="button" className="btn btn-outline btn-sm" onClick={() => setF({ ...f, image: '' })}><X size={13} />Remove</button></div>
            : <label className="btn btn-outline cursor-pointer"><ImagePlus size={16} />{up ? 'Uploading…' : 'Upload photo'}<input type="file" accept="image/*" className="sr-only" disabled={up} onChange={(e) => pickImage(e.target.files?.[0])} /></label>}</div>
      </div>
      <fieldset className="space-y-3"><legend className="label">Pictures on the right side</legend>
        <div className="flex flex-wrap gap-2">{([['decor', 'Plain decoration'], ['shop', 'One shop’s best sellers'], ['products', 'Hand-picked products (up to 4)']] as [Visual, string][]).map(([v, l]) => <label key={v} className={`cursor-pointer rounded-full border px-3 py-1.5 text-sm ${f.visual === v ? 'border-indigo bg-indigo-50 font-semibold text-indigo-800' : 'border-line'}`}><input type="radio" name="vis" className="sr-only" checked={f.visual === v} onChange={() => setF({ ...f, visual: v })} />{l}</label>)}</div>
        {f.visual === 'shop' && <div><select aria-label="Shop" className="input max-w-sm" value={f.shop_id} onChange={(e) => setF({ ...f, shop_id: e.target.value })}><option value="">Choose a shop…</option>{shopList.map((s) => <option key={s.id} value={s.id}>{s.name} ({s.product_count} products)</option>)}</select><p className="mt-1 text-xs text-slate-500">Shows the shop’s name on the banner and its 4 best-selling products.</p></div>}
        {f.visual === 'products' && <ProductPicker value={f.ids} onChange={(ids) => setF({ ...f, ids })} max={4} />}
      </fieldset>
      <ScheduleFields start={f.start} end={f.end} active={f.active} onStart={(v) => setF({ ...f, start: v })} onEnd={(v) => setF({ ...f, end: v })} onActive={(v) => setF({ ...f, active: v })} />
      <div className="flex gap-2"><button className="btn btn-primary" disabled={busy || up}>{busy ? 'Saving…' : 'Save banner'}</button><button type="button" className="btn btn-ghost" onClick={onDone}>Cancel</button></div>
    </form>
  );
}

export default function BannersAdmin() {
  const q = useQuery(listBanners); const shops = useQuery(() => listShops());
  const confirm = useConfirm(); const toast = useToast();
  const [editing, setEditing] = useState<Banner | 'new' | null>(null);
  const list = q.data ?? [];
  const move = async (i: number, d: number) => { const ids = list.map((x) => x.id); const j = i + d; if (j < 0 || j >= ids.length) return; [ids[i], ids[j]] = [ids[j], ids[i]]; await reorderBanners(ids); };
  const toggle = async (b: Banner) => { const { id, sort_order, ...rest } = b; void sort_order; await saveBanner({ ...rest, id, is_active: !b.is_active }); toast(b.is_active ? 'Banner hidden.' : 'Banner is live.', 'info'); };
  const del = async (b: Banner) => { if (await confirm({ title: 'Delete this banner?', message: `“${b.title}” is removed from the homepage slider.`, confirmLabel: 'Delete', danger: true })) { await deleteBanner(b.id); toast('Banner deleted.', 'info'); } };
  const status = (b: Banner) => !b.is_active ? ['Hidden', 'bg-slate-100 text-slate-600'] : isLive(b) ? ['Live', 'bg-green-50 text-green-800'] : b.starts_at && new Date(b.starts_at) > new Date() ? ['Scheduled', 'bg-sky-50 text-sky-800'] : ['Expired', 'bg-crimson-50 text-crimson-700'];
  const visual = (b: Banner) => b.product_ids.length ? `${b.product_ids.length} hand-picked products` : b.shop_id ? `Best sellers of ${shops.data?.find((s) => s.id === b.shop_id)?.name ?? 'a shop'}` : 'Decoration';

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3"><p className="max-w-xl text-sm text-slate-600">The big slider at the top of the homepage. Live banners play in this order. With none live, a default banner is shown.</p><div className="flex gap-2"><a href="/" target="_blank" rel="noopener noreferrer" className="btn btn-outline btn-sm">View homepage</a>{!editing && <button className="btn btn-primary btn-sm" onClick={() => setEditing('new')}><Plus size={15} />New banner</button>}</div></div>
      {editing && <Form key={editing === 'new' ? 'new' : editing.id} initial={editing === 'new' ? undefined : editing} onDone={() => setEditing(null)} />}
      <div className="card overflow-hidden">
        {q.loading ? <TableSkeleton rows={3} /> : list.length === 0 ? <EmptyState title="No banners" text="Add a banner for your Eid sale, a shop spotlight or a new collection." /> : (
          <ul className="divide-y divide-line">
            {list.map((b, i) => { const [label, cls] = status(b); return (
              <li key={b.id} className="flex flex-wrap items-center gap-3 p-4">
                <span className="h-12 w-20 shrink-0 rounded-md" style={b.image_url ? { backgroundImage: `url("${b.image_url}")`, backgroundSize: 'cover', backgroundPosition: 'center' } : { backgroundColor: BANNER_THEMES[b.theme].bg }} aria-hidden />
                <div className="min-w-0 flex-1"><p className="truncate text-sm font-semibold">{b.title}</p><p className="text-xs text-slate-500">{visual(b)}{b.starts_at ? ` · from ${shortDate(b.starts_at)}` : ''}{b.ends_at ? ` · until ${shortDate(b.ends_at)}` : ''}</p></div>
                <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${cls}`}>{label}</span>
                <div className="flex items-center gap-1">
                  <button aria-label="Move up" className="btn btn-ghost btn-sm !p-1.5" disabled={i === 0} onClick={() => move(i, -1)}><ArrowUp size={14} /></button>
                  <button aria-label="Move down" className="btn btn-ghost btn-sm !p-1.5" disabled={i === list.length - 1} onClick={() => move(i, 1)}><ArrowDown size={14} /></button>
                  <button className="btn btn-outline btn-sm" onClick={() => toggle(b)}>{b.is_active ? 'Hide' : 'Show'}</button>
                  <button className="btn btn-outline btn-sm" onClick={() => setEditing(b)}><Pencil size={13} />Edit</button>
                  <button aria-label="Delete" className="btn btn-outline btn-sm !text-crimson" onClick={() => del(b)}><Trash2 size={13} /></button>
                </div>
              </li>); })}
          </ul>)}
      </div>
    </div>
  );
}
