'use client';
import { rs } from '@/lib/format';
import { usePlatform } from './Providers';

/** Worked example shown on shop + admin dashboards. The rate comes from the admin's settings. */
export default function CommissionExplainer({ audience }: { audience: 'shop' | 'admin' }) {
  const { rate, pct } = usePlatform();
  const price = 5000; const fee = Math.round(price * rate);
  return (
    <div className="card border-marigold bg-marigold-50 p-4 sm:p-5">
      <h3 className="text-base font-semibold">How the {pct} commission works</h3>
      <p className="mt-1 text-sm text-slate-700">{audience === 'shop' ? 'Commission is taken on the product value, only when an order is marked delivered. Orders that are pending, shipped or cancelled cost you nothing, and delivery charges are yours.' : 'Platform revenue counts delivered orders only, on the product value (delivery charges belong to the shop). Cancelled and in-progress orders are excluded.'}</p>
      <dl className="mt-3 grid gap-2 text-sm sm:grid-cols-3">
        <div className="rounded-lg bg-white p-3"><dt className="text-slate-500">Order value</dt><dd className="font-display text-lg font-semibold">{rs(price)}</dd></div>
        <div className="rounded-lg bg-white p-3"><dt className="text-slate-500">Platform commission</dt><dd className="font-display text-lg font-semibold text-crimson">− {rs(fee)}</dd></div>
        <div className="rounded-lg bg-white p-3"><dt className="text-slate-500">Shop earning</dt><dd className="font-display text-lg font-semibold text-green-700">{rs(price - fee)}</dd></div>
      </dl>
    </div>
  );
}
