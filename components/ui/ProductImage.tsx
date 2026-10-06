import { COLOR_HEX } from '@/lib/seed';

/** Real image when uploaded; otherwise a tinted garment silhouette so cards never look empty. */
export default function ProductImage({ src, colors, name, category, className = '' }: { src?: string; colors: string[]; name: string; category?: string; className?: string }) {
  if (src) return <img src={src} alt={name} className={`h-full w-full object-cover ${className}`} loading="lazy" />;
  const base = COLOR_HEX[colors[0]] ?? '#1F2A5C';
  const trim = COLOR_HEX[colors[1] ?? 'Mustard'] ?? '#D9A21B';
  const isShawl = category === 'Winter Shawls' || category === 'Abayas & Hijabs';
  return (
    <div role="img" aria-label={name} className={`grid h-full w-full place-items-center ${className}`} style={{ background: `linear-gradient(160deg, ${base}22, ${base}44)` }}>
      <svg viewBox="0 0 100 120" className="h-[78%] drop-shadow-sm">
        {isShawl ? (
          <>
            <path d="M12 20 Q50 4 88 20 L82 104 Q50 116 18 104 Z" fill={base} />
            <path d="M16 90 Q50 100 84 90 M17 98 Q50 108 83 98" stroke={trim} strokeWidth="3" fill="none" />
          </>
        ) : (
          <>
            <path d="M30 10 L42 6 Q50 16 58 6 L70 10 L92 34 L80 44 L72 36 L72 112 L28 112 L28 36 L20 44 L8 34 Z" fill={base} />
            <path d="M42 6 Q50 16 58 6 L56 34 L50 38 L44 34 Z" fill={trim} opacity=".85" />
            <path d="M50 38 V70" stroke={trim} strokeWidth="2" strokeDasharray="3 3" />
            <path d="M28 104 H72" stroke={trim} strokeWidth="3" />
          </>
        )}
      </svg>
    </div>
  );
}
