// Data for the customer pages. For now every function returns sample data; each will switch to
// Postgres when the ordering code is wired up, without the pages changing.
import {
  LANDING_SCENARIOS, ORDER_SCENARIOS, SAMPLE_ORDER_NUMBER, sampleLanding, sampleOrder,
  type LandingScenario, type OrderScenario,
} from './samples';
import type { LandingData, OrderPageData } from './types';

export type * from './types';
export { LANDING_SCENARIOS, ORDER_SCENARIOS, SAMPLE_ORDER_NUMBER, type LandingScenario, type OrderScenario };

/**
 * Sample states can be picked with ?state= locally and on Vercel previews. The live site never
 * shows them: it always gets "no batch scheduled" and no sample orders.
 */
export const previewsEnabled = process.env.VERCEL_ENV !== 'production';

function pick<T extends string>(options: readonly T[], value: string | string[] | undefined, fallback: T): T {
  return typeof value === 'string' && (options as readonly string[]).includes(value) ? (value as T) : fallback;
}

export async function getLandingData(state?: string | string[]): Promise<LandingData> {
  if (!previewsEnabled) return sampleLanding('none');
  return sampleLanding(pick(LANDING_SCENARIOS, state, 'open'));
}

/** Order form data, or null when the bake day isn't taking orders. */
export async function getOrderFormData(state?: string | string[]): Promise<LandingData | null> {
  const data = await getLandingData(state);
  return data.bakeDay?.state === 'open' && data.bakeDay.remainingTarts > 0 ? data : null;
}

/**
 * An order for its tracking page. Access needs the order number and the token from the
 * emailed link (TDD §7.2); for samples, only the sample order number exists.
 */
export async function getOrderPageData(orderNumber: string, _token: string | undefined, state?: string | string[]): Promise<OrderPageData | null> {
  if (!previewsEnabled || orderNumber !== SAMPLE_ORDER_NUMBER) return null;
  return sampleOrder(pick(ORDER_SCENARIOS, state, 'awaiting'));
}
