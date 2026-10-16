import { db, delay, ensureHydrated, mutate, uid } from '../../store';
import type { Announcement, Banner, HomeSection } from '../../types';

const byOrder = <T extends { sort_order: number }>(a: T[]) => [...a].sort((x, y) => x.sort_order - y.sort_order);

export async function listAnnouncements(): Promise<Announcement[]> { await delay(60); ensureHydrated(); return byOrder(db.announcements); }
export async function saveAnnouncement(a: Omit<Announcement, 'id' | 'sort_order'> & { id?: string }): Promise<void> {
  await delay();
  mutate(() => {
    const i = a.id ? db.announcements.findIndex((x) => x.id === a.id) : -1;
    if (i >= 0) db.announcements[i] = { ...db.announcements[i], ...a } as Announcement;
    else db.announcements.push({ ...a, id: uid('an'), sort_order: db.announcements.length } as Announcement);
  });
}
export async function deleteAnnouncement(id: string): Promise<void> { await delay(); mutate(() => { db.announcements = db.announcements.filter((x) => x.id !== id); }); }
export async function reorderAnnouncements(ids: string[]): Promise<void> { mutate(() => { ids.forEach((id, i) => { const x = db.announcements.find((y) => y.id === id); if (x) x.sort_order = i; }); }); }

export async function listBanners(): Promise<Banner[]> { await delay(60); ensureHydrated(); return byOrder(db.banners); }
export async function saveBanner(b: Omit<Banner, 'id' | 'sort_order'> & { id?: string }): Promise<void> {
  await delay();
  mutate(() => {
    const i = b.id ? db.banners.findIndex((x) => x.id === b.id) : -1;
    if (i >= 0) db.banners[i] = { ...db.banners[i], ...b } as Banner;
    else db.banners.push({ ...b, id: uid('b'), sort_order: db.banners.length } as Banner);
  });
}
export async function deleteBanner(id: string): Promise<void> { await delay(); mutate(() => { db.banners = db.banners.filter((x) => x.id !== id); }); }
export async function reorderBanners(ids: string[]): Promise<void> { mutate(() => { ids.forEach((id, i) => { const x = db.banners.find((y) => y.id === id); if (x) x.sort_order = i; }); }); }

export async function listSections(): Promise<HomeSection[]> { await delay(60); ensureHydrated(); return db.sections; }
export async function saveSection(s: HomeSection): Promise<void> {
  await delay();
  mutate(() => { const i = db.sections.findIndex((x) => x.key === s.key); if (i >= 0) db.sections[i] = s; else db.sections.push(s); });
}

/** Sample mode keeps the image in the browser as a data URL. */
export async function uploadSiteImage(file: File): Promise<string> {
  return new Promise((res, rej) => { const r = new FileReader(); r.onload = () => res(r.result as string); r.onerror = () => rej(new Error('Could not read the image.')); r.readAsDataURL(file); });
}
