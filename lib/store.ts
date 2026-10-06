/**
 * In-browser sample store used until Supabase is connected.
 * Services in lib/services/* are the ONLY consumers — swap their bodies for supabase queries
 * and nothing in the UI changes.
 */
import { categories, orders, products, profiles, shops } from './seed';
import type { Category, Order, Product, Profile, Shop } from './types';

interface DB { shops: Shop[]; products: Product[]; categories: Category[]; profiles: Profile[]; orders: Order[] }

const KEY = 'libaas_db_v1';
export const db: DB = {
  shops: structuredClone(shops), products: structuredClone(products), categories: structuredClone(categories),
  profiles: structuredClone(profiles), orders: structuredClone(orders),
};

let hydrated = false;
let version = 0;
const listeners = new Set<() => void>();

export function ensureHydrated() {
  if (hydrated || typeof window === 'undefined') return;
  hydrated = true;
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) Object.assign(db, JSON.parse(raw));
  } catch { /* ignore corrupt cache */ }
}

export function mutate(fn: () => void) {
  ensureHydrated();
  fn();
  try { localStorage.setItem(KEY, JSON.stringify(db)); } catch { /* storage full */ }
  version++;
  listeners.forEach((l) => l());
}

export const subscribe = (l: () => void) => { listeners.add(l); return () => { listeners.delete(l); }; };
export const getVersion = () => version;
export const resetSampleData = () => { localStorage.removeItem(KEY); location.reload(); };
export const delay = (ms = 220) => new Promise((r) => setTimeout(r, ms));
export const uid = (p: string) => `${p}${Date.now().toString(36)}${Math.floor(Math.random() * 1e4)}`;

/** Tell all useQuery hooks to refetch (used after live Supabase writes). */
export function notify() { version++; listeners.forEach((l) => l()); }
