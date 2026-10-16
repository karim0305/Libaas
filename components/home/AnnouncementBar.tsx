'use client';
import { useEffect, useState } from 'react';
import { useQuery } from '@/lib/hooks';
import { getLiveAnnouncements } from '@/lib/services/homepage';
import { ANNOUNCE_THEMES } from '@/lib/homeThemes';
import SmartLink from '../SmartLink';

/** Top strip. Messages, links, colours and dates are all set by the admin (Admin → Homepage). */
export default function AnnouncementBar() {
  const q = useQuery(getLiveAnnouncements);
  const [i, setI] = useState(0);
  const items = q.data ?? [];
  useEffect(() => {
    if (items.length < 2 || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const t = setInterval(() => setI((x) => (x + 1) % items.length), 5500);
    return () => clearInterval(t);
  }, [items.length]);

  if (q.loading) return <div className="h-8 bg-indigo-800" aria-hidden />;
  if (!items.length) return null;
  const a = items[i % items.length];
  const link = a.link || (a.shop_id ? `/shops/${a.shop_id}` : '');
  const label = a.link_label || (a.shop_id ? 'Visit shop' : 'Shop now');
  return (
    <div className={`${ANNOUNCE_THEMES[a.theme].cls} py-2 text-xs sm:text-sm`} role="region" aria-label="Announcements">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-center gap-x-2.5 gap-y-1 px-4 text-center">
        {a.shop_name && <span className="rounded-full bg-black/15 px-2 py-0.5 text-[11px] font-semibold">{a.shop_name}</span>}
        <span key={a.id} className="slide-in">{a.text}</span>
        {link && <SmartLink href={link} className="font-semibold underline underline-offset-2 hover:opacity-80">{label}</SmartLink>}
        {items.length > 1 && <span className="flex gap-1" aria-hidden>{items.map((x, k) => <span key={x.id} className={`h-1.5 w-1.5 rounded-full bg-current ${k === i % items.length ? 'opacity-90' : 'opacity-30'}`} />)}</span>}
      </div>
    </div>
  );
}
