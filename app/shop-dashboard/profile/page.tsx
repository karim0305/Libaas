'use client';
import { useEffect, useState } from 'react';
import { useMyShop } from '@/components/useMyShop';
import { updateShop } from '@/lib/services/shops';
import { useToast } from '@/components/Providers';
import StatusBadge from '@/components/ui/StatusBadge';
import { Skeleton } from '@/components/ui/States';

export default function ShopProfile() {
  const { shop, shopId } = useMyShop(); const toast = useToast();
  const [f, setF] = useState({ name: '', city: '', phone: '', description: '' }); const [busy, setBusy] = useState(false);
  useEffect(() => { if (shop) setF({ name: shop.name, city: shop.city, phone: shop.phone, description: shop.description }); }, [shop?.id]); // eslint-disable-line
  if (!shop) return <Skeleton className="h-80" />;
  const save = async (e: React.FormEvent) => { e.preventDefault(); setBusy(true); await updateShop(shopId, f); setBusy(false); toast('Shop profile saved.'); };
  return (
    <form onSubmit={save} className="card mx-auto max-w-2xl space-y-4 p-6">
      <div className="flex items-center justify-between"><h2 className="text-lg font-semibold">Shop profile</h2><StatusBadge status={shop.status} /></div>
      <div><label className="label" htmlFor="n">Shop name</label><input id="n" className="input" value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} required /></div>
      <div className="grid gap-4 sm:grid-cols-2"><div><label className="label" htmlFor="c">City</label><input id="c" className="input" value={f.city} onChange={(e) => setF({ ...f, city: e.target.value })} /></div><div><label className="label" htmlFor="p">Contact number</label><input id="p" className="input" value={f.phone} onChange={(e) => setF({ ...f, phone: e.target.value })} /></div></div>
      <div><label className="label" htmlFor="d">About your shop</label><textarea id="d" rows={4} className="input" value={f.description} onChange={(e) => setF({ ...f, description: e.target.value })} /></div>
      <button className="btn btn-primary" disabled={busy}>{busy ? 'Saving…' : 'Save changes'}</button>
    </form>
  );
}
