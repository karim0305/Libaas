import type { OrderStatus, ShopStatus } from '@/lib/types';

const styles: Record<string, string> = {
  pending: 'bg-amber-50 text-amber-800 ring-amber-200',
  referred: 'bg-orange-50 text-orange-800 ring-orange-200',
  confirmed: 'bg-sky-50 text-sky-800 ring-sky-200',
  processing: 'bg-indigo-50 text-indigo-700 ring-indigo-200',
  shipped: 'bg-violet-50 text-violet-800 ring-violet-200',
  delivered: 'bg-green-50 text-green-800 ring-green-200',
  cancelled: 'bg-crimson-50 text-crimson-700 ring-crimson-100',
  active: 'bg-green-50 text-green-800 ring-green-200',
  inactive: 'bg-slate-100 text-slate-600 ring-slate-200',
  rejected: 'bg-crimson-50 text-crimson-700 ring-crimson-100',
};

export default function StatusBadge({ status }: { status: OrderStatus | ShopStatus }) {
  return <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize ring-1 ring-inset ${styles[status]}`}>{status}</span>;
}
