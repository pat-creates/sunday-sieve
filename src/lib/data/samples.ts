// Sample data for building the customer pages before they're wired to the database.
// Content follows the Sunday Sieve canvas; dates are relative to now, so deadlines and
// countdowns always look real.
import { formatBakeDate, formatDateTime, formatWindow } from '@/lib/format';
import type { BakeDayView, LandingData, OrderPageData, PaymentMethodView, ProductView } from './types';

const HOUR = 3_600_000;
const DAY = 24 * HOUR;

export const LANDING_SCENARIOS = ['open', 'almost', 'soldout', 'closed', 'none'] as const;
export type LandingScenario = (typeof LANDING_SCENARIOS)[number];

export const ORDER_SCENARIOS = [
  'awaiting', 'short', 'rejected', 'verifying', 'confirmed', 'baking', 'ready', 'completed', 'cancelled',
] as const;
export type OrderScenario = (typeof ORDER_SCENARIOS)[number];

export const SAMPLE_ORDER_NUMBER = 'ET-7K3M-9QP2';

const products: ProductView[] = [
  { id: 'p-snack', name: 'The Sunday Snack', subtitle: 'Box of 4', tartCount: 4, priceCentavos: 22000 },
  { id: 'p-picnic', name: 'The Picnic Pack', subtitle: 'Box of 6', tartCount: 6, priceCentavos: 31500 },
  { id: 'p-brunch', name: 'The Family Brunch', subtitle: 'Box of 12', tartCount: 12, priceCentavos: 60000 },
];

// QR images are uploaded in admin later; until then the cards show a placeholder.
const paymentMethods: PaymentMethodView[] = [
  { provider: 'GCash', accountName: 'PA*****A N.', accountHint: '099• ••••507' },
  { provider: 'BDO', accountName: 'Pat', accountHint: '•••• 2714' },
  { provider: 'BPI', accountName: 'Pat', accountHint: '•••• 839' },
  { provider: 'SeaBank', accountName: 'Patricia Navarro', accountHint: '•••• 2038' },
];

const settings = { maxTartsPerOrder: 24, autoCancelHours: 24, verificationSlaText: 'by the evening of the next day' };
const pickupArea = 'Cainta, Rizal';

/** A Manila wall-clock time on a YYYY-MM-DD date. */
const manila = (date: string, time: string) => new Date(`${date}T${time}:00+08:00`);
const manilaDate = (d: Date) => new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Manila' }).format(d);

/** The bake date for samples: the Saturday at least two days away, so orders are still open. */
function sampleBakeDate(now: Date): string {
  for (let i = 2; i < 9; i++) {
    const d = new Date(now.getTime() + i * DAY);
    if (new Intl.DateTimeFormat('en-US', { timeZone: 'Asia/Manila', weekday: 'short' }).format(d) === 'Sat') return manilaDate(d);
  }
  return manilaDate(new Date(now.getTime() + 2 * DAY));
}

function sampleBakeDay(scenario: Exclude<LandingScenario, 'none'>, now: Date): BakeDayView {
  // Closed: cut-off passed two hours ago, pickup tomorrow. Otherwise: pickup on the coming Saturday.
  const bakeDate = scenario === 'closed' ? manilaDate(new Date(now.getTime() + DAY)) : sampleBakeDate(now);
  const pickupStartsAt = manila(bakeDate, '15:00');
  const pickupEndsAt = manila(bakeDate, '19:00');
  // Closed: cut-off on the hour, an hour or two ago. Otherwise Friday 6:00 PM.
  const cutoffAt = scenario === 'closed'
    ? new Date(Math.floor(now.getTime() / HOUR) * HOUR - HOUR)
    : new Date(pickupStartsAt.getTime() - 21 * HOUR);
  const remaining = { open: 36, almost: 12, soldout: 0, closed: 40 }[scenario];
  return {
    id: 'bd-sample',
    state: scenario === 'almost' ? 'open' : scenario,
    bakeDateLabel: formatBakeDate(bakeDate),
    pickupWindowLabel: formatWindow(pickupStartsAt, pickupEndsAt),
    cutoffLabel: formatDateTime(cutoffAt),
    cutoffAt: cutoffAt.toISOString(),
    pickupStartsAt: pickupStartsAt.toISOString(),
    capacityTarts: 96,
    remainingTarts: remaining,
    publicNote: scenario === 'open' ? 'Adding ube tarts this week!' : undefined,
  };
}

export function sampleLanding(scenario: LandingScenario, now = new Date()): LandingData {
  return {
    bakeDay: scenario === 'none' ? null : sampleBakeDay(scenario, now),
    products,
    pickupArea,
    settings,
  };
}

export function sampleOrder(scenario: OrderScenario, now = new Date()): OrderPageData {
  const bakeDay = sampleBakeDay('open', now);
  const status = ({
    awaiting: 'AWAITING_PAYMENT', short: 'AWAITING_PAYMENT', rejected: 'AWAITING_PAYMENT',
    verifying: 'PAYMENT_UNDER_REVIEW', confirmed: 'CONFIRMED', baking: 'BAKING',
    ready: 'READY_FOR_PICKUP', completed: 'COMPLETED', cancelled: 'CANCELLED',
  } as const)[scenario];
  const total = 63000;
  const placedAt = new Date(now.getTime() - 50 * 60_000);
  // Deadline: 24h from ordering, or the regrace after a rejected receipt (TDD §9.6).
  const deadline = scenario === 'short' || scenario === 'rejected'
    ? new Date(now.getTime() + 11 * HOUR + 20 * 60_000)
    : scenario === 'cancelled' ? new Date(now.getTime() - 3 * HOUR) : new Date(placedAt.getTime() + 24 * HOUR);
  const paid = !['awaiting', 'short', 'rejected', 'cancelled'].includes(scenario);
  const received = scenario === 'short' ? 53000 : paid ? total : 0;
  const proofAt = new Date(now.getTime() - 25 * 60_000).toISOString();

  return {
    orderNumber: SAMPLE_ORDER_NUMBER,
    status,
    customerFirstName: 'Maria',
    items: [{ name: 'The Picnic Pack (Box of 6)', quantity: 2, lineTotalCentavos: total }],
    totalTarts: 12,
    totalCentavos: total,
    amountDueCentavos: total - received,
    paymentDeadlineAt: deadline.toISOString(),
    bakeDateLabel: bakeDay.bakeDateLabel,
    pickupWindowLabel: bakeDay.pickupWindowLabel,
    pickupArea,
    pickupAddress: scenario === 'ready'
      ? { fullAddress: '[House no.] [Street], [Barangay], Cainta, Rizal', mapUrl: 'https://maps.google.com/?q=Cainta+Rizal',
          instructions: 'Ring the bell at the green gate. Parking on the street.', contactNumber: '0917 123 4567' }
      : undefined,
    paymentMethods,
    latestProof: scenario === 'awaiting' || scenario === 'cancelled' ? undefined : {
      referenceNumber: '7012345678901',
      submittedAt: proofAt,
      verdict: scenario === 'verifying' ? 'pending' : scenario === 'rejected' ? 'rejected' : 'accepted',
    },
    rejectReason: scenario === 'short'
      ? 'Received ₱530 of ₱630 — please send the remaining ₱100 and upload that receipt.'
      : scenario === 'rejected'
        ? 'We couldn’t find reference number 7012 345 678901 in our GCash history. Please check the number on your receipt and upload it again.'
        : undefined,
    cancellation: scenario === 'cancelled' ? { reason: 'unpaid_timeout' } : undefined,
    verificationSlaText: settings.verificationSlaText,
  };
}
