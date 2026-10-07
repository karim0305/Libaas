'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ImagePlus, X } from 'lucide-react';
import { useQuery } from '@/lib/hooks';
import { publicCategories } from '@/lib/services/analytics';
import { saveProduct } from '@/lib/services/products';
import { usePlatform, useToast } from './Providers';
import { COLOR_HEX } from '@/lib/seed';
import { rs, finalPrice } from '@/lib/format';
import type { Product } from '@/lib/types';

const SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'Free', '2-3Y', '4-5Y', '6-7Y', '8-9Y'];

export default function ProductForm({ shopId, initial }: { shopId: string; initial?: Product }) {
  const router = useRouter(); const toast = useToast();
  const cats = useQuery(publicCategories);
  const { rate, pct } = usePlatform();
  const [f, setF] = useState({
    name: initial?.name ?? '', category_id: initial?.category_id ?? '', description: initial?.description ?? '', price: String(initial?.price ?? ''),
    discount_percent: String(initial?.discount_percent ?? 0), stock: String(initial?.stock ?? ''), sizes: initial?.sizes ?? [] as string[],
    colors: initial?.colors ?? [] as string[], images: initial?.images ?? [] as string[],
  });
  const [err, setErr] = useState<Record<string, string>>({}); const [busy, setBusy] = useState(false);
  const toggle = (k: 'sizes' | 'colors', v: string) => setF({ ...f, [k]: f[k].includes(v) ? f[k].filter((x) => x !== v) : [...f[k], v] });

  /* In production: upload each file to Supabase Storage bucket "product-images" and store the public URL. */
  const addImages = (files: FileList | null) => {
    Array.from(files ?? []).slice(0, 5 - f.images.length).forEach((file) => {
      if (file.size > 1_000_000) { toast(`${file.name} is over 1 MB. Choose a smaller photo.`, 'error'); return; }
      const r = new FileReader(); r.onload = () => setF((x) => ({ ...x, images: [...x.images, r.result as string] })); r.readAsDataURL(file);
    });
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const er: Record<string, string> = {};
    if (f.name.trim().length < 3) er.name = 'Give the product a name.';
    if (!f.category_id) er.category_id = 'Pick a category.';
    if (!(+f.price > 0)) er.price = 'Enter a price above Rs. 0.';
    if (+f.discount_percent < 0 || +f.discount_percent > 90) er.discount_percent = 'Discount must be between 0 and 90.';
    if (!(+f.stock >= 0) || f.stock === '') er.stock = 'Enter stock quantity.';
    if (!f.sizes.length) er.sizes = 'Select at least one size.';
    if (!f.colors.length) er.colors = 'Select at least one colour.';
    setErr(er);
    if (Object.keys(er).length) return;
    setBusy(true);
    await saveProduct({ id: initial?.id, shop_id: shopId, name: f.name.trim(), category_id: f.category_id, description: f.description, price: +f.price, discount_percent: +f.discount_percent, stock: +f.stock, sizes: f.sizes, colors: f.colors, images: f.images, featured: initial?.featured ?? false });
    toast(initial ? 'Product updated.' : 'Product published.');
    router.push('/shop-dashboard/products');
  };
  const Err = ({ k }: { k: string }) => (err[k] ? <p className="mt-1 text-xs text-crimson">{err[k]}</p> : null);

  return (
    <form onSubmit={submit} noValidate className="grid gap-6 lg:grid-cols-[1fr_340px]">
      <div className="card space-y-5 p-5">
        <div><label className="label" htmlFor="n">Product name</label><input id="n" className="input" value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} /><Err k="name" /></div>
        <div><label className="label" htmlFor="d">Description</label><textarea id="d" rows={4} className="input" value={f.description} onChange={(e) => setF({ ...f, description: e.target.value })} placeholder="Fabric, fit, care instructions" /></div>
        <div><p className="label">Sizes</p><div className="flex flex-wrap gap-1.5">{SIZES.map((s) => <button type="button" key={s} aria-pressed={f.sizes.includes(s)} onClick={() => toggle('sizes', s)} className={`rounded-md border px-3 py-1.5 text-sm ${f.sizes.includes(s) ? 'border-indigo bg-indigo text-white' : 'border-line'}`}>{s}</button>)}</div><Err k="sizes" /></div>
        <div><p className="label">Colours</p><div className="flex flex-wrap gap-2">{Object.entries(COLOR_HEX).map(([n, h]) => <button type="button" key={n} aria-pressed={f.colors.includes(n)} onClick={() => toggle('colors', n)} className={`flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs ${f.colors.includes(n) ? 'border-indigo bg-indigo-50 font-semibold' : 'border-line'}`}><span className="h-3.5 w-3.5 rounded-full ring-1 ring-slate-300" style={{ background: h }} />{n}</button>)}</div><Err k="colors" /></div>
        <div>
          <p className="label">Photos <span className="font-normal text-slate-400">(up to 5, 1 MB each)</span></p>
          <div className="flex flex-wrap gap-3">
            {f.images.map((src, i) => <div key={i} className="relative h-24 w-20 overflow-hidden rounded-lg"><img src={src} alt="" className="h-full w-full object-cover" /><button type="button" aria-label="Remove photo" onClick={() => setF({ ...f, images: f.images.filter((_, j) => j !== i) })} className="absolute right-1 top-1 rounded-full bg-white p-0.5 shadow"><X size={12} /></button></div>)}
            {f.images.length < 5 && <label className="grid h-24 w-20 cursor-pointer place-items-center rounded-lg border-2 border-dashed border-line text-slate-400 hover:border-indigo hover:text-indigo"><ImagePlus /><input type="file" accept="image/*" multiple className="sr-only" onChange={(e) => addImages(e.target.files)} /></label>}
          </div>
        </div>
      </div>
      <aside className="card h-fit space-y-4 p-5">
        <div><label className="label" htmlFor="c">Category</label><select id="c" className="input" value={f.category_id} onChange={(e) => setF({ ...f, category_id: e.target.value })}><option value="">Select…</option>{(cats.data ?? []).map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select><Err k="category_id" /></div>
        <div><label className="label" htmlFor="p">Price (Rs.)</label><input id="p" inputMode="numeric" className="input" value={f.price} onChange={(e) => setF({ ...f, price: e.target.value })} /><Err k="price" /></div>
        <div><label className="label" htmlFor="di">Discount (%)</label><input id="di" inputMode="numeric" className="input" value={f.discount_percent} onChange={(e) => setF({ ...f, discount_percent: e.target.value })} /><Err k="discount_percent" /></div>
        <div><label className="label" htmlFor="s">Stock quantity</label><input id="s" inputMode="numeric" className="input" value={f.stock} onChange={(e) => setF({ ...f, stock: e.target.value })} /><Err k="stock" /></div>
        {+f.price > 0 && <p className="rounded-lg bg-indigo-50 p-3 text-xs text-slate-700">Customers pay <b>{rs(finalPrice(+f.price, +f.discount_percent || 0))}</b>. If delivered you keep <b>{rs(finalPrice(+f.price, +f.discount_percent || 0) * (1 - rate))}</b> after {pct} commission.</p>}
        <button className="btn btn-primary w-full py-3" disabled={busy}>{busy ? 'Saving…' : initial ? 'Save changes' : 'Publish product'}</button>
      </aside>
    </form>
  );
}
