import { notify } from '../../store';
import { must, sb } from './_client';
import type { Announcement, Banner, HomeSection } from '../../types';

/* eslint-disable @typescript-eslint/no-explicit-any */
const orderBy = async <T,>(table: string): Promise<T[]> => must<T[]>(await sb().from(table).select('*').order('sort_order'));

export const listAnnouncements = () => orderBy<Announcement>('announcements');
export const listBanners = () => orderBy<Banner>('banners');

async function save(table: string, row: any) {
  const { id, ...fields } = row;
  if (id) must(await sb().from(table).update(fields).eq('id', id));
  else { const n = (await sb().from(table).select('id', { count: 'exact', head: true })).count ?? 0; must(await sb().from(table).insert({ ...fields, sort_order: n })); }
  notify();
}
async function remove(table: string, id: string) { must(await sb().from(table).delete().eq('id', id)); notify(); }
async function reorder(table: string, ids: string[]) {
  await Promise.all(ids.map((id, i) => sb().from(table).update({ sort_order: i }).eq('id', id)));
  notify();
}
export const saveAnnouncement = (a: Omit<Announcement, 'id' | 'sort_order'> & { id?: string }) => save('announcements', a);
export const deleteAnnouncement = (id: string) => remove('announcements', id);
export const reorderAnnouncements = (ids: string[]) => reorder('announcements', ids);
export const saveBanner = (b: Omit<Banner, 'id' | 'sort_order'> & { id?: string }) => save('banners', b);
export const deleteBanner = (id: string) => remove('banners', id);
export const reorderBanners = (ids: string[]) => reorder('banners', ids);

export async function listSections(): Promise<HomeSection[]> { return orderBy<HomeSection>('home_sections').catch(async () => must<HomeSection[]>(await sb().from('home_sections').select('*'))); }
export async function saveSection(s: HomeSection): Promise<void> { must(await sb().from('home_sections').upsert(s, { onConflict: 'key' })); notify(); }

/** Admin-only bucket "site-images" (see migration 009). */
export async function uploadSiteImage(file: File): Promise<string> {
  const path = `banners/${crypto.randomUUID()}.${file.type.split('/')[1] || 'jpg'}`;
  const up = await sb().storage.from('site-images').upload(path, file, { contentType: file.type });
  if (up.error) throw new Error(`Image upload failed: ${up.error.message}`);
  return sb().storage.from('site-images').getPublicUrl(path).data.publicUrl;
}
