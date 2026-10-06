import { isSupabaseConfigured } from '../supabase/client';
import * as mock from './mock/auth';
import * as live from './supabase/auth';
const s = isSupabaseConfigured ? live : mock;
export const getSession = s.getSession;
export const login = s.login;
export const registerCustomer = s.registerCustomer;
export const logout = s.logout;
