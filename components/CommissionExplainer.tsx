import { rs } from '@/lib/format';
import { COMMISSION_RATE } from '@/lib/commission';

/** Worked example shown on shop + admin dashboards so the 5% rule is obvious. */
export default function CommissionExplainer({ audience }: { audience: 'shop' | 'admin' }) {
  const price = 5000; const fee = price * COMMISSION_RATE;
  return (
    <div className="card border-marigold bg-marigold-50 p-4 sm:p-5">
      <h3 className="text-base font-semibold">How the {COMMISSION_RATE * 100}% commission works</h3>
      <p className="mt-1 text-sm text-slate-700">{audience === 'shop' ? 'Commission is taken only when an order is marked delivered. Pending, shipped and cancelled orders cost you nothing.' : 'Platform revenue counts delivered orders only. Cancelled and in-progress orders are excluded.'}</p>
      <dl className="mt-3 grid gap-2 text-sm sm:grid-cols-3">
        <div className="rounded-lg bg-white p-3"><dt className="text-slate-500">Order value</dt><dd className="font-display text-lg font-semibold">{rs(price)}</dd></div>
        <div className="rounded-lg bg-white p-3"><dt className="text-slate-500">Platform commission</dt><dd className="font-display text-lg font-semibold text-crimson">− {rs(fee)}</dd></div>
        <div className="rounded-lg bg-white p-3"><dt className="text-slate-500">Shop earning</dt><dd className="font-display text-lg font-semibold text-green-700">{rs(price - fee)}</dd></div>
      </dl>
    </div>
  );
}
