import { isSupabaseConfigured } from '../supabase/client';
import * as mock from './mock/payments';
import * as live from './supabase/payments';
const s = isSupabaseConfigured ? live : mock;
export const listShopPayments = s.listShopPayments;
export const listAllPayments = s.listAllPayments;
export const submitPayment = s.submitPayment;
export const updatePayment = s.updatePayment;
export const receivePayment = s.receivePayment;
