import type { PaymentStatus } from '@/lib/types';

export default function PaymentBadge({ status }: { status: PaymentStatus }) {
  const received = status === 'received';
  return <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ring-inset ${received ? 'bg-green-50 text-green-800 ring-green-200' : 'bg-amber-50 text-amber-800 ring-amber-200'}`}>{received ? 'Received' : 'Not received'}</span>;
}
