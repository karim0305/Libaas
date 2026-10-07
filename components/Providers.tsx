'use client';
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { CheckCircle2, AlertTriangle, Info, X } from 'lucide-react';
import { getSession, logout as doLogout } from '@/lib/services/auth';
import { isSupabaseConfigured } from '@/lib/supabase/client';
import { DEFAULT_COMMISSION_RATE } from '@/lib/commission';
import { getPlatformSettings } from '@/lib/services/settings';
import { subscribe } from '@/lib/store';
import type { CartLine, Profile } from '@/lib/types';

/* ---------- Toasts ---------- */
type ToastKind = 'success' | 'error' | 'info';
interface Toast { id: number; kind: ToastKind; text: string }
const ToastCtx = createContext<(text: string, kind?: ToastKind) => void>(() => {});
export const useToast = () => useContext(ToastCtx);

/* ---------- Confirm dialog ---------- */
interface ConfirmOpts { title: string; message: string; confirmLabel?: string; danger?: boolean }
const ConfirmCtx = createContext<(o: ConfirmOpts) => Promise<boolean>>(async () => false);
export const useConfirm = () => useContext(ConfirmCtx);

/* ---------- Auth ---------- */
interface AuthState { user: Profile | null; ready: boolean; refresh: () => void; logout: () => void }
const AuthCtx = createContext<AuthState>({ user: null, ready: false, refresh: () => {}, logout: () => {} });
export const useAuth = () => useContext(AuthCtx);

/* ---------- Platform settings (commission rate set by the admin) ---------- */
export const formatPct = (rate: number) => `${+(rate * 100).toFixed(2)}%`;
const PlatformCtx = createContext({ rate: DEFAULT_COMMISSION_RATE, pct: formatPct(DEFAULT_COMMISSION_RATE) });
export const usePlatform = () => useContext(PlatformCtx);

/* ---------- Cart ---------- */
interface CartState {
  lines: CartLine[]; count: number;
  add: (l: CartLine) => void; setQty: (key: CartLine, qty: number) => void; remove: (l: CartLine) => void; clear: () => void;
}
const CartCtx = createContext<CartState>({ lines: [], count: 0, add: () => {}, setQty: () => {}, remove: () => {}, clear: () => {} });
export const useCart = () => useContext(CartCtx);
const same = (a: CartLine, b: CartLine) => a.product_id === b.product_id && a.size === b.size && a.color === b.color;

export default function Providers({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const toast = useCallback((text: string, kind: ToastKind = 'success') => {
    const id = Date.now() + Math.random();
    setToasts((t) => [...t, { id, kind, text }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3800);
  }, []);

  const [dialog, setDialog] = useState<(ConfirmOpts & { resolve: (v: boolean) => void }) | null>(null);
  const confirm = useCallback((o: ConfirmOpts) => new Promise<boolean>((resolve) => setDialog({ ...o, resolve })), []);
  const close = (v: boolean) => { dialog?.resolve(v); setDialog(null); };

  const [user, setUser] = useState<Profile | null>(null);
  const [ready, setReady] = useState(false);
  const refresh = useCallback(() => { getSession().then((u) => { setUser(u); setReady(true); }).catch(() => setReady(true)); }, []);
  useEffect(refresh, [refresh]);
  const logout = useCallback(() => { setUser(null); void doLogout(); }, []);

  const [rate, setRate] = useState(DEFAULT_COMMISSION_RATE);
  useEffect(() => {
    const load = () => { getPlatformSettings().then((s) => setRate(s.commission_rate)).catch(() => { /* keep default */ }); };
    load();
    return subscribe(load);
  }, []);
  const platform = useMemo(() => ({ rate, pct: formatPct(rate) }), [rate]);

  const [lines, setLines] = useState<CartLine[]>([]);
  useEffect(() => { try {
    const saved: CartLine[] = JSON.parse(localStorage.getItem('libaas_cart') ?? '[]');
    // sample-data ids (p1, p2…) are not valid once Supabase is on
    setLines(isSupabaseConfigured ? saved.filter((l) => /^[0-9a-f-]{36}$/i.test(l.product_id)) : saved);
  } catch { /* empty */ } }, []);
  const save = (l: CartLine[]) => { setLines(l); localStorage.setItem('libaas_cart', JSON.stringify(l)); };
  const cart = useMemo<CartState>(() => ({
    lines, count: lines.reduce((s, l) => s + l.quantity, 0),
    add: (l) => save(lines.some((x) => same(x, l)) ? lines.map((x) => (same(x, l) ? { ...x, quantity: x.quantity + l.quantity } : x)) : [...lines, l]),
    setQty: (k, q) => save(lines.map((x) => (same(x, k) ? { ...x, quantity: Math.max(1, q) } : x))),
    remove: (k) => save(lines.filter((x) => !same(x, k))),
    clear: () => save([]),
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }), [lines]);

  return (
    <ToastCtx.Provider value={toast}>
      <ConfirmCtx.Provider value={confirm}>
        <AuthCtx.Provider value={{ user, ready, refresh, logout }}>
          <CartCtx.Provider value={cart}>
            <PlatformCtx.Provider value={platform}>{children}</PlatformCtx.Provider>
            <div className="fixed bottom-4 right-4 left-4 sm:left-auto z-[100] flex flex-col gap-2 sm:w-96" aria-live="polite">
              {toasts.map((t) => (
                <div key={t.id} className="toast-in flex items-start gap-3 rounded-lg bg-white border border-line shadow-lg p-3.5 text-sm">
                  {t.kind === 'success' ? <CheckCircle2 className="text-green-600 shrink-0" size={18} /> : t.kind === 'error' ? <AlertTriangle className="text-crimson shrink-0" size={18} /> : <Info className="text-indigo shrink-0" size={18} />}
                  <p className="flex-1 text-slate-800">{t.text}</p>
                  <button aria-label="Dismiss" onClick={() => setToasts((x) => x.filter((y) => y.id !== t.id))} className="text-slate-400 hover:text-slate-700"><X size={16} /></button>
                </div>
              ))}
            </div>
            {dialog && (
              <div className="fixed inset-0 z-[110] grid place-items-center bg-indigo-900/50 p-4" role="dialog" aria-modal="true" onClick={() => close(false)}>
                <div className="w-full max-w-sm rounded-xl bg-white p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
                  <h2 className="font-display text-lg font-semibold">{dialog.title}</h2>
                  <p className="mt-2 text-sm text-slate-600">{dialog.message}</p>
                  <div className="mt-6 flex justify-end gap-2">
                    <button className="btn btn-ghost" onClick={() => close(false)}>Keep it</button>
                    <button autoFocus className={dialog.danger ? 'btn btn-danger' : 'btn btn-primary'} onClick={() => close(true)}>{dialog.confirmLabel ?? 'Confirm'}</button>
                  </div>
                </div>
              </div>
            )}
          </CartCtx.Provider>
        </AuthCtx.Provider>
      </ConfirmCtx.Provider>
    </ToastCtx.Provider>
  );
}
