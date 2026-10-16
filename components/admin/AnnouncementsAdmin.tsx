'use client';
import { BRAND } from '@/lib/brand';
import { useState } from 'react';
import { ArrowDown, ArrowUp, Pencil, Plus, Trash2 } from 'lucide-react';
import { useQuery } from '@/lib/hooks';
import { deleteAnnouncement, listAnnouncements, reorderAnnouncements, saveAnnouncement } from '@/lib/services/homepage';
import { listShops } from '@/lib/services/shops';
import { publicCategories } from '@/lib/services/analytics';
import { useConfirm, useToast } from '../Providers';
import { ANNOUNCE_THEMES, isLive, isValidLink } from '@/lib/homeThemes';
import { LinkPicker, ScheduleFields, dayEnd, dayStart, toDay } from './fields';
import { EmptyState, TableSkeleton } from '../ui/States';
import { shortDate } from '@/lib/format';
import type { Announcement, AnnounceTheme } from '@/lib/types';

const IDEAS = [
  'Eid sale: up to 30% off lawn',
  'New shop joined: welcome Zubair Tailors',
  'Free delivery on orders above Rs. 5,000 from Khaddar House',
  'Delivery may take 1–2 extra days during the holidays',
  'New arrivals every Friday',
];

function Form({ initial, onDone }: { initial?: Announcement; onDone: () => void }) {
  const toast = useToast();
  const shops = useQuery(() => listShops({ activeOnly: true })); const cats = useQuery(publicCategories);
  const [f, setF] = useState({ text: initial?.text ?? '', link: initial?.link ?? '', link_label: initial?.link_label ?? '', shop_id: initial?.shop_id ?? '', theme: (initial?.theme ?? 'indigo') as AnnounceTheme, start: toDay(initial?.starts_at ?? null), end: toDay(initial?.ends_at ?? null), active: initial?.is_active ?? true });
  const [busy, setBusy] = useState(false);
  const th = ANNOUNCE_THEMES[f.theme];

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!f.text.trim()) { toast('Write the announcement text.', 'error'); return; }
    if (f.text.length > 160) { toast('Keep the text under 160 characters.', 'error'); return; }
    if (!isValidLink(f.link)) { toast('That link isn’t valid.', 'error'); return; }
    setBusy(true);
    try {
      await saveAnnouncement({ id: initial?.id, text: f.text.trim(), link: f.link, link_label: f.link_label.trim(), shop_id: f.shop_id || null, theme: f.theme, is_active: f.active, starts_at: dayStart(f.start), ends_at: dayEnd(f.end) });
      toast(initial ? 'Announcement updated.' : 'Announcement added.'); onDone();
    } catch (x) { toast((x as Error).message, 'error'); setBusy(false); }
  };
  return (
    <form onSubmit={submit} className="card space-y-4 border-indigo p-5">
      <h3 className="text-base font-semibold">{initial ? 'Edit announcement' : 'New announcement'}</h3>
      <div className={`${th.cls} rounded-lg px-3 py-2 text-center text-sm`} aria-label="Preview">{f.shop_id && <b className="mr-2 rounded-full bg-black/15 px-2 py-0.5 text-[11px]">{shops.data?.find((s) => s.id === f.shop_id)?.name}</b>}{f.text || 'Your message appears here'}{(f.link || f.shop_id) && <u className="ml-2 font-semibold">{f.link_label || 'Shop now'}</u>}</div>
      <div><label className="label" htmlFor="at">Message <span className="font-normal text-slate-400">({f.text.length}/160)</span></label><input id="at" className="input" maxLength={160} value={f.text} onChange={(e) => setF({ ...f, text: e.target.value })} />
        <div className="mt-2 flex flex-wrap gap-1.5">{IDEAS.map((i) => <button type="button" key={i} onClick={() => setF({ ...f, text: i })} className="rounded-full border border-line px-2.5 py-1 text-xs text-slate-600 hover:border-indigo hover:text-indigo-800">{i}</button>)}</div></div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div><label className="label" htmlFor="al">Link <span className="font-normal text-slate-400">(optional)</span></label><LinkPicker id="al" value={f.link} onChange={(v) => setF({ ...f, link: v })} shops={shops.data ?? []} cats={cats.data ?? []} /></div>
        <div><label className="label" htmlFor="ll">Link text</label><input id="ll" className="input" placeholder="Shop now" value={f.link_label} onChange={(e) => setF({ ...f, link_label: e.target.value })} /></div>
        <div><label className="label" htmlFor="as">From a shop <span className="font-normal text-slate-400">(optional)</span></label><select id="as" className="input" value={f.shop_id} onChange={(e) => setF({ ...f, shop_id: e.target.value })}><option value="">Platform announcement ({BRAND.name})</option>{(shops.data ?? []).map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}</select><p className="mt-1 text-xs text-slate-500">Shows the shop name as a badge and links to its page.</p></div>
        <div><label className="label" htmlFor="ath">Colour</label><select id="ath" className="input" value={f.theme} onChange={(e) => setF({ ...f, theme: e.target.value as AnnounceTheme })}>{(Object.keys(ANNOUNCE_THEMES) as AnnounceTheme[]).map((k) => <option key={k} value={k}>{ANNOUNCE_THEMES[k].label}</option>)}</select></div>
      </div>
      <ScheduleFields start={f.start} end={f.end} active={f.active} onStart={(v) => setF({ ...f, start: v })} onEnd={(v) => setF({ ...f, end: v })} onActive={(v) => setF({ ...f, active: v })} />
      <div className="flex gap-2"><button className="btn btn-primary" disabled={busy}>{busy ? 'Saving…' : 'Save announcement'}</button><button type="button" className="btn btn-ghost" onClick={onDone}>Cancel</button></div>
    </form>
  );
}

export default function AnnouncementsAdmin() {
  const q = useQuery(listAnnouncements); const shops = useQuery(() => listShops());
  const confirm = useConfirm(); const toast = useToast();
  const [editing, setEditing] = useState<Announcement | 'new' | null>(null);
  const list = q.data ?? [];
  const move = async (i: number, d: number) => { const ids = list.map((x) => x.id); const j = i + d; if (j < 0 || j >= ids.length) return; [ids[i], ids[j]] = [ids[j], ids[i]]; await reorderAnnouncements(ids); };
  const toggle = async (a: Announcement) => { const { id, sort_order, ...rest } = a; void sort_order; await saveAnnouncement({ ...rest, id, is_active: !a.is_active }); toast(a.is_active ? 'Announcement hidden.' : 'Announcement is live.', 'info'); };
  const del = async (a: Announcement) => { if (await confirm({ title: 'Delete this announcement?', message: 'It disappears from the top of the website.', confirmLabel: 'Delete', danger: true })) { await deleteAnnouncement(a.id); toast('Announcement deleted.', 'info'); } };
  const status = (a: Announcement) => !a.is_active ? ['Hidden', 'bg-slate-100 text-slate-600'] : isLive(a) ? ['Live', 'bg-green-50 text-green-800'] : a.starts_at && new Date(a.starts_at) > new Date() ? ['Scheduled', 'bg-sky-50 text-sky-800'] : ['Expired', 'bg-crimson-50 text-crimson-700'];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3"><p className="max-w-xl text-sm text-slate-600">The strip above the header. With several live announcements they rotate every few seconds. Set dates and they switch on and off by themselves.</p>{!editing && <button className="btn btn-primary btn-sm" onClick={() => setEditing('new')}><Plus size={15} />New announcement</button>}</div>
      {editing && <Form key={editing === 'new' ? 'new' : editing.id} initial={editing === 'new' ? undefined : editing} onDone={() => setEditing(null)} />}
      <div className="card overflow-hidden">
        {q.loading ? <TableSkeleton rows={3} /> : list.length === 0 ? <EmptyState title="No announcements" text="Add one and it shows above the header. With none live, the strip is hidden." /> : (
          <ul className="divide-y divide-line">
            {list.map((a, i) => { const [label, cls] = status(a); return (
              <li key={a.id} className="flex flex-wrap items-center gap-3 p-4">
                <span className={`h-8 w-8 shrink-0 rounded-lg ${ANNOUNCE_THEMES[a.theme].cls}`} aria-hidden />
                <div className="min-w-0 flex-1"><p className="truncate text-sm font-medium">{a.text}</p><p className="text-xs text-slate-500">{a.shop_id ? shops.data?.find((s) => s.id === a.shop_id)?.name ?? 'Shop' : `${BRAND.name}`}{a.starts_at ? ` · from ${shortDate(a.starts_at)}` : ''}{a.ends_at ? ` · until ${shortDate(a.ends_at)}` : ''}</p></div>
                <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${cls}`}>{label}</span>
                <div className="flex items-center gap-1">
                  <button aria-label="Move up" className="btn btn-ghost btn-sm !p-1.5" disabled={i === 0} onClick={() => move(i, -1)}><ArrowUp size={14} /></button>
                  <button aria-label="Move down" className="btn btn-ghost btn-sm !p-1.5" disabled={i === list.length - 1} onClick={() => move(i, 1)}><ArrowDown size={14} /></button>
                  <button className="btn btn-outline btn-sm" onClick={() => toggle(a)}>{a.is_active ? 'Hide' : 'Show'}</button>
                  <button className="btn btn-outline btn-sm" onClick={() => setEditing(a)}><Pencil size={13} />Edit</button>
                  <button aria-label="Delete" className="btn btn-outline btn-sm !text-crimson" onClick={() => del(a)}><Trash2 size={13} /></button>
                </div>
              </li>); })}
          </ul>)}
      </div>
    </div>
  );
}
