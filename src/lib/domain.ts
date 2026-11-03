// Pure business rules, kept free of I/O so they can be unit tested (TDD §14 "Unit").
import { createHash, randomBytes, randomInt, timingSafeEqual } from 'node:crypto';
import type { OrderStatus } from './db/schema';

const HOUR = 3_600_000;

/** Statuses that hold capacity (TDD §5.1): everything except CANCELLED. */
export const CAPACITY_HOLDING: OrderStatus[] = [
  'AWAITING_PAYMENT', 'PAYMENT_UNDER_REVIEW', 'CONFIRMED', 'BAKING', 'READY_FOR_PICKUP', 'COMPLETED',
];
/** Non-terminal statuses, for the "max 2 active orders per email" rule (TDD §5.3). */
export const ACTIVE: OrderStatus[] = ['AWAITING_PAYMENT', 'PAYMENT_UNDER_REVIEW', 'CONFIRMED', 'BAKING', 'READY_FOR_PICKUP'];
export const MAX_ACTIVE_ORDERS_PER_EMAIL = 2;

/** payment_deadline_at = MIN(created_at + auto_cancel_hours, order_cutoff_at)  (TDD §9.6) */
export function paymentDeadline(createdAt: Date, autoCancelHours: number, orderCutoffAt: Date): Date {
  return new Date(Math.min(createdAt.getTime() + autoCancelHours * HOUR, orderCutoffAt.getTime()));
}

/** Re-upload rule after a rejected proof or a reinstate (TDD §9.6). Ignores the order cutoff on purpose. */
export function reuploadDeadline(now: Date, rejectRegraceHours: number, pickupStartsAt: Date, reuploadBufferHours: number): Date {
  return new Date(Math.min(now.getTime() + rejectRegraceHours * HOUR, pickupStartsAt.getTime() - reuploadBufferHours * HOUR));
}

export function remainingTarts(capacity: number, reserved: number): number {
  return Math.max(0, capacity - reserved);
}

/** Crockford base32 without I, L, O, U, so it reads unambiguously over the phone (TDD §7.1). */
const CROCKFORD = '0123456789ABCDEFGHJKMNPQRSTVWXYZ';
export function generateOrderNumber(): string {
  const block = () => Array.from({ length: 4 }, () => CROCKFORD[randomInt(CROCKFORD.length)]).join('');
  return `ET-${block()}-${block()}`;
}
export const ORDER_NUMBER_RE = /^ET-[0-9A-HJKMNP-TV-Z]{4}-[0-9A-HJKMNP-TV-Z]{4}$/;

/** 32 random bytes; only the SHA-256 is stored (TDD §7.2). */
export function generateAccessToken(): { token: string; hash: string } {
  const token = randomBytes(32).toString('base64url');
  return { token, hash: hashToken(token) };
}
export function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}
export function tokenMatches(token: string | undefined | null, storedHash: string): boolean {
  if (!token) return false;
  const a = Buffer.from(hashToken(token), 'hex');
  const b = Buffer.from(storedHash, 'hex');
  return a.length === b.length && timingSafeEqual(a, b);
}

/** Amount received = sum of amount_centavos over accepted proofs (TDD §6 payment_proofs). */
export function amountReceived(proofs: { verdict: string; amountCentavos: number | null }[]): number {
  return proofs.reduce((sum, p) => sum + (p.verdict === 'accepted' ? (p.amountCentavos ?? 0) : 0), 0);
}

/** Philippine mobile: 09XXXXXXXXX, 639XXXXXXXXX or +639XXXXXXXXX, spaces and dashes allowed. Returns +639XXXXXXXXX. */
export function normalizePhMobile(input: string): string | null {
  const digits = input.replace(/[\s\-().]/g, '');
  const m = /^(?:\+?63|0)(9\d{9})$/.exec(digits);
  return m ? `+63${m[1]}` : null;
}

/** Reference numbers are typed with spaces as printed on receipts; store letters and digits only. */
export function normalizeReference(input: string): string | null {
  const ref = input.replace(/[\s-]/g, '');
  return /^[A-Za-z0-9]{6,30}$/.test(ref) ? ref.toUpperCase() : null;
}
