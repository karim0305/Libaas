'use client';
import { Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { CheckCircle2 } from 'lucide-react';

function Inner() {
  const nos = (useSearchParams().get('no') ?? '').split(',').filter(Boolean);
  return (
    <div className="mx-auto max-w-xl px-4 py-16 text-center">
      <CheckCircle2 className="mx-auto text-green-600" size={64} />
      <h1 className="mt-5 text-3xl font-semibold">Order placed successfully</h1>
      <p className="mt-2 text-slate-600">{nos.length > 1 ? 'Your items come from different shops, so we created one order per shop.' : 'The shop will confirm it shortly.'}</p>
      <div className="mt-6 space-y-2">{nos.map((n) => <p key={n} className="rounded-xl border border-dashed border-indigo bg-indigo-50 py-4 text-sm text-slate-600">Order number <span className="block font-display text-2xl font-bold tracking-wide text-indigo-800">{n}</span></p>)}</div>
      <p className="mt-4 text-sm text-slate-500">Keep your cash ready. You’ll pay the rider when it arrives.</p>
      <div className="mt-8 flex justify-center gap-3"><Link href="/orders" className="btn btn-primary">View my orders</Link><Link href="/products" className="btn btn-outline">Continue shopping</Link></div>
    </div>
  );
}
export default function Success() { return <Suspense><Inner /></Suspense>; }
