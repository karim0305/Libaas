import { createClient } from '../../supabase/client';

let client: ReturnType<typeof createClient> | null = null;
export const sb = () => (client ??= createClient());

/** Throw a readable Error if a Supabase call failed, otherwise return its data. */
export function must<T>(res: { data: T | null; error: { message: string } | null }): T {
  if (res.error) throw new Error(res.error.message);
  return res.data as T;
}
export const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
