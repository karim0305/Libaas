import { db, delay, ensureHydrated, mutate } from '../../store';

export async function getPlatformSettings() { await delay(10); ensureHydrated(); return { commission_rate: db.settings.commission_rate }; }
export async function updateCommissionRate(rate: number): Promise<void> { await delay(); mutate(() => { db.settings.commission_rate = rate; }); }
