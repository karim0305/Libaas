import type { Role } from './types';

/** Only customer accounts can order or review. Shop owners and the admin must log in from the customer panel (a customer account). */
export const CUSTOMER_ONLY = 'Please log in from the Customer Panel to place an order.';
const who = (r: Role) => (r === 'shop' ? 'a shop owner' : r === 'admin' ? 'the admin' : 'a customer');
export const blockedMessage = (r: Role) => `You are logged in as ${who(r)}. ${CUSTOMER_ONLY}`;
