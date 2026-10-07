'use client';
import Link from 'next/link';
import { usePlatform } from './Providers';

const CUSTOMER = [
  'Libaas is an advertising platform. Products are sold and delivered by the shops, not by Libaas.',
  'If you receive a wrong, damaged or faulty item, contact the shop directly. Libaas is not responsible for product quality, delivery or refunds.',
  'Orders are cash on delivery. If you refuse an order or don’t pay, the shop or its delivery company deals with you directly, and your account may be blocked.',
];

export default function TermsCheckbox({ checked, onChange, kind }: { checked: boolean; onChange: (v: boolean) => void; kind: 'customer' | 'shop' }) {
  const { pct } = usePlatform();
  const points = kind === 'customer' ? CUSTOMER : [
    'Libaas only advertises your products. You are responsible for everything you list and send: genuine, legal and as described.',
    'If you send a wrong or faulty product, you deal with the customer. Libaas is not liable.',
    'If a customer doesn’t pay, you or your delivery company bear the loss. Libaas does not pay shops for unpaid orders.',
    `Libaas charges ${pct} commission on the product value of delivered orders, and you must pay it as Libaas communicates.`,
    'Illegal, counterfeit or prohibited items mean suspension, and Libaas may report them to the authorities.',
  ];
  return (
    <div className="rounded-lg border border-line bg-surface p-3.5 text-sm sm:col-span-2">
      <p className="font-medium text-indigo-800">Key points</p>
      <ul className="mt-1.5 list-disc space-y-1 pl-5 text-xs leading-relaxed text-slate-600">{points.map((p) => <li key={p}>{p}</li>)}</ul>
      <label className="mt-3 flex cursor-pointer items-start gap-2.5">
        <input type="checkbox" required checked={checked} onChange={(e) => onChange(e.target.checked)} className="mt-0.5 h-4 w-4 shrink-0 accent-[#1E2A5A]" />
        <span>I have read and agree to the <Link href="/terms" target="_blank" className="font-semibold text-crimson underline">Terms &amp; Conditions</Link>.</span>
      </label>
    </div>
  );
}
