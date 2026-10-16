import { Star } from 'lucide-react';

export function Stars({ value, size = 16 }: { value: number; size?: number }) {
  const r = Math.round(value);
  return (
    <span className="inline-flex gap-0.5 text-marigold" role="img" aria-label={`${value.toFixed(1)} out of 5 stars`}>
      {[1, 2, 3, 4, 5].map((i) => <Star key={i} size={size} fill={i <= r ? 'currentColor' : 'none'} className={i <= r ? '' : 'text-slate-300'} />)}
    </span>
  );
}

export function StarInput({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  return (
    <div className="inline-flex gap-1" role="radiogroup" aria-label="Rating">
      {[1, 2, 3, 4, 5].map((i) => (
        <button key={i} type="button" role="radio" aria-checked={value === i} aria-label={`${i} star${i > 1 ? 's' : ''}`} onClick={() => onChange(i)} className="rounded p-0.5 text-marigold hover:scale-110">
          <Star size={26} fill={i <= value ? 'currentColor' : 'none'} className={i <= value ? '' : 'text-slate-300'} />
        </button>
      ))}
    </div>
  );
}
