'use client';
import { useEffect, useState } from 'react';
import { useMyShop } from './useMyShop';
import { useToast } from './Providers';
import { updateShop } from '@/lib/services/shops';
import { rs } from '@/lib/format';

/** Shop owner: set the delivery charge customers pay on this shop's orders. */
export default function DeliverySettings() {
  const { shop, shopId } = useMyShop(); const toast = useToast();
  const [charge, setCharge] = useState(''); const [free, setFree] = useState(''); const [busy, setBusy] = useState(false);
  useEffect(() => {
    if (shop) { setCharge(String(shop.delivery_charge)); setFree(shop.free_delivery_above == null ? '' : String(shop.free_delivery_above)); }
  }, [shop?.id, shop?.delivery_charge, shop?.free_delivery_above]); // eslint-disable-line

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    const c = Number(charge); const f = free.trim() === '' ? null : Number(free);
    if (charge.trim() === '' || !(c >= 0)) { toast('Enter a delivery charge of Rs. 0 or more.', 'error'); return; }
    if (f !== null && !(f > 0)) { toast('Free-delivery amount must be above Rs. 0, or leave it empty.', 'error'); return; }
    setBusy(true);
    try { await updateShop(shopId, { delivery_charge: Math.round(c), free_delivery_above: f === null ? null : Math.round(f) }); toast('Delivery settings saved.'); }
    catch (x) { toast((x as Error).message, 'error'); }
    setBusy(false);
  };
  return (
    <form onSubmit={save} className="card space-y-4 p-6">
      <div><h2 className="text-lg font-semibold">Delivery charges</h2><p className="mt-1 text-sm text-slate-600">Added to every order from your shop. You collect it with the cash on delivery. Libaas takes no commission on delivery charges.</p></div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div><label className="label" htmlFor="dc">Delivery charge (Rs.)</label><input id="dc" inputMode="numeric" className="input" value={charge} onChange={(e) => setCharge(e.target.value)} /></div>
        <div><label className="label" htmlFor="fd">Free delivery above (Rs.)</label><input id="fd" inputMode="numeric" className="input" placeholder="Empty = never free" value={free} onChange={(e) => setFree(e.target.value)} /></div>
      </div>
      <p className="rounded-lg bg-indigo-50 p-3 text-sm text-slate-700">Customers pay <b>{charge.trim() !== '' && Number(charge) >= 0 ? (Number(charge) ? rs(Number(charge)) : 'no') : '—'}</b> delivery{free.trim() !== '' && Number(free) > 0 ? <>, free on orders of {rs(Number(free))} or more.</> : '. Delivery is never free.'}</p>
      <button className="btn btn-primary" disabled={busy || !shop}>{busy ? 'Saving…' : 'Save delivery settings'}</button>
    </form>
  );
}
