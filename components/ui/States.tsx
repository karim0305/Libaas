import { AlertTriangle, PackageOpen } from 'lucide-react';
import type { ReactNode } from 'react';

export const Skeleton = ({ className = '' }: { className?: string }) => <div className={`skeleton ${className}`} />;

export function ProductGridSkeleton({ n = 8 }: { n?: number }) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:gap-5 md:grid-cols-3 lg:grid-cols-4">
      {Array.from({ length: n }, (_, i) => (
        <div key={i}><Skeleton className="aspect-[4/5] w-full" /><Skeleton className="mt-3 h-4 w-3/4" /><Skeleton className="mt-2 h-4 w-1/2" /></div>
      ))}
    </div>
  );
}

export function TableSkeleton({ rows = 6 }: { rows?: number }) {
  return <div className="space-y-2 p-4">{Array.from({ length: rows }, (_, i) => <Skeleton key={i} className="h-10 w-full" />)}</div>;
}

export function EmptyState({ title, text, action }: { title: string; text?: string; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center px-6 py-14 text-center">
      <div className="grid h-14 w-14 place-items-center rounded-full bg-indigo-50 text-indigo"><PackageOpen size={26} /></div>
      <h3 className="mt-4 text-lg font-semibold">{title}</h3>
      {text && <p className="mt-1 max-w-sm text-sm text-slate-500">{text}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

export function ErrorState({ message, retry }: { message: string; retry?: () => void }) {
  return (
    <div className="flex flex-col items-center px-6 py-14 text-center" role="alert">
      <div className="grid h-14 w-14 place-items-center rounded-full bg-crimson-50 text-crimson"><AlertTriangle size={26} /></div>
      <h3 className="mt-4 text-lg font-semibold">We couldn’t load this</h3>
      <p className="mt-1 max-w-sm text-sm text-slate-500">{message}</p>
      {retry && <button className="btn btn-outline mt-5" onClick={retry}>Try again</button>}
    </div>
  );
}
