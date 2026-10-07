/**
 * The live commission rate is stored in the database (platform_settings.commission_rate) and edited by the admin
 * under Admin → Settings. Components read it with usePlatform(). This default is only a first-paint fallback.
 * The database trigger `generate_commission` is the source of truth for real amounts.
 */
export const DEFAULT_COMMISSION_RATE = 0.05;

export function previewCommission(subtotal: number, rate: number) {
  const commission = Math.round(subtotal * rate);
  return { commission, shopEarning: subtotal - commission };
}
