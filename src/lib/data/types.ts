// What the customer pages need, already shaped for display. The pages never see database rows:
// today these come from sample data, later from Postgres, and the pages don't change.
import type { OrderStatus } from '@/lib/db/schema';

export type BakeDayState = 'open' | 'closed' | 'soldout' | 'none';

export interface BakeDayView {
  id: string;
  state: Exclude<BakeDayState, 'none'>;
  /** "Saturday, 29 November" */
  bakeDateLabel: string;
  /** "3:00–7:00 PM" */
  pickupWindowLabel: string;
  /** "Friday, 28 November at 6:00 PM" */
  cutoffLabel: string;
  /** Short forms for the phone bake day bar: "Sat 5 Dec", "Fri 6 PM". */
  bakeDateShort: string;
  cutoffShort: string;
  /** "Friday": the cutoff's weekday, for "Pre-order by Friday". */
  cutoffWeekday: string;
  /** ISO timestamps, for deadline arithmetic in the browser. */
  cutoffAt: string;
  pickupStartsAt: string;
  capacityTarts: number;
  remainingTarts: number;
  publicNote?: string;
}

export interface ProductView {
  id: string;
  name: string;
  subtitle: string;
  tartCount: number;
  priceCentavos: number;
}

export interface PublicSettings {
  maxTartsPerOrder: number;
  autoCancelHours: number;
  /** "by the evening of the next day" */
  verificationSlaText: string;
}

export interface LandingData {
  /** The earliest bake day that's taking orders or about to, or null when none is scheduled. */
  bakeDay: BakeDayView | null;
  products: ProductView[];
  /** pickup_locations.public_blurb: city and landmark, never the street address. */
  pickupArea: string;
  settings: PublicSettings;
}

export interface PaymentMethodView {
  provider: string;
  qrSrc?: string;
  accountName: string;
  accountHint?: string;
}

export interface OrderPageData {
  orderNumber: string;
  status: OrderStatus;
  customerFirstName: string;
  items: { name: string; quantity: number; lineTotalCentavos: number }[];
  totalTarts: number;
  totalCentavos: number;
  /** Total minus what accepted receipts covered (TDD §9.4). */
  amountDueCentavos: number;
  paymentDeadlineAt: string;
  bakeDateLabel: string;
  pickupWindowLabel: string;
  pickupArea: string;
  /** Present only at READY_FOR_PICKUP: the server leaves it out before then (TDD §7.4). */
  pickupAddress?: { fullAddress: string; mapUrl?: string; instructions?: string; contactNumber: string };
  paymentMethods: PaymentMethodView[];
  /** The most recent receipt, if any. */
  latestProof?: { referenceNumber: string; submittedAt: string; verdict: 'pending' | 'accepted' | 'rejected' };
  /** Set when the owner sent the order back to awaiting payment. */
  rejectReason?: string;
  cancellation?: { reason: 'unpaid_timeout' | 'customer_request' | 'owner_cancelled' | 'payment_not_received' | 'no_show'; note?: string };
  verificationSlaText: string;
}
