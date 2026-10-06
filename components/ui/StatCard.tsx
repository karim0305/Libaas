import type { LucideIcon } from 'lucide-react';

export default function StatCard({ label, value, hint, icon: Icon, tone = 'indigo' }: { label: string; value: string | number; hint?: string; icon: LucideIcon; tone?: 'indigo' | 'crimson' | 'gold' | 'green' }) {
  const tones = { indigo: 'bg-indigo-50 text-indigo', crimson: 'bg-crimson-50 text-crimson', gold: 'bg-marigold-50 text-marigold-600', green: 'bg-green-50 text-green-700' };
  return (
    <div className="card p-4 sm:p-5">
      <div className="flex items-start justify-between gap-3">
        <p className="text-sm text-slate-500">{label}</p>
        <span className={`grid h-9 w-9 shrink-0 place-items-center rounded-lg ${tones[tone]}`}><Icon size={18} /></span>
      </div>
      <p className="mt-2 font-display text-2xl font-semibold text-indigo-800">{value}</p>
      {hint && <p className="mt-1 text-xs text-slate-500">{hint}</p>}
    </div>
  );
}
