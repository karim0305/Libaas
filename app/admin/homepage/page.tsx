'use client';
import { useState } from 'react';
import AnnouncementsAdmin from '@/components/admin/AnnouncementsAdmin';
import BannersAdmin from '@/components/admin/BannersAdmin';
import SectionsAdmin from '@/components/admin/SectionsAdmin';

const TABS = [['announcements', 'Announcement bar'], ['banners', 'Hero slider'], ['sections', 'Product rows']] as const;

export default function AdminHomepage() {
  const [tab, setTab] = useState<(typeof TABS)[number][0]>('announcements');
  return (
    <div className="space-y-5">
      <div className="flex gap-1 overflow-x-auto rounded-xl border border-line bg-white p-1" role="tablist">
        {TABS.map(([k, l]) => <button key={k} role="tab" aria-selected={tab === k} onClick={() => setTab(k)} className={`whitespace-nowrap rounded-lg px-4 py-2 text-sm font-semibold ${tab === k ? 'bg-indigo text-white' : 'text-slate-600 hover:bg-surface'}`}>{l}</button>)}
      </div>
      {tab === 'announcements' && <AnnouncementsAdmin />}
      {tab === 'banners' && <BannersAdmin />}
      {tab === 'sections' && <SectionsAdmin />}
    </div>
  );
}
