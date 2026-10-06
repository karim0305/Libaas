import { isSupabaseConfigured } from '../supabase/client';
import * as mock from './mock/shops';
import * as live from './supabase/shops';
const s = isSupabaseConfigured ? live : mock;
export const listShops = s.listShops;
export const getShop = s.getShop;
export const setShopStatus = s.setShopStatus;
export const updateShop = s.updateShop;
export const registerShop = s.registerShop;
