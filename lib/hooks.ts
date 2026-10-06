'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
import { subscribe } from './store';

/** Tiny data hook: loads, tracks loading/error, and refetches whenever the store changes. */
export function useQuery<T>(fn: () => Promise<T>, deps: unknown[] = []) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const fnRef = useRef(fn);
  fnRef.current = fn;

  const run = useCallback((silent = false) => {
    if (!silent) setLoading(true);
    setError(null);
    fnRef.current()
      .then((d) => setData(d))
      .catch((e) => setError(e?.message ?? 'Something went wrong'))
      .finally(() => setLoading(false));
  }, []);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { run(); }, deps);
  useEffect(() => subscribe(() => run(true)), [run]);
  return { data, loading, error, reload: () => run() };
}
