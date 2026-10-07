import { isSupabaseConfigured } from '../supabase/client';
import * as mock from './mock/settings';
import * as live from './supabase/settings';
const s = isSupabaseConfigured ? live : mock;
export const getPlatformSettings = s.getPlatformSettings;
export const updateCommissionRate = s.updateCommissionRate;
