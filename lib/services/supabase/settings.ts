import { notify } from '../../store';
import { must, sb } from './_client';

/* eslint-disable @typescript-eslint/no-explicit-any */
export async function getPlatformSettings() {
  const r = must<any>(await sb().from('platform_settings').select('commission_rate').eq('id', 1).maybeSingle());
  return { commission_rate: Number(r?.commission_rate ?? 0.05) };
}
export async function updateCommissionRate(rate: number): Promise<void> {
  must(await sb().from('platform_settings').update({ commission_rate: rate }).eq('id', 1));
  notify();
}
