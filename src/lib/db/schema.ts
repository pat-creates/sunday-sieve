// Drizzle table definitions mirroring db/migrations (the SQL files are the source of truth;
// triggers, RLS and the transitions seed live only there — TDD §14).
import {
  pgTable, pgEnum, uuid, text, integer, boolean, timestamp, date, jsonb, customType,
} from 'drizzle-orm/pg-core';

const citext = customType<{ data: string }>({ dataType: () => 'citext' });

export const orderStatus = pgEnum('order_status', [
  'AWAITING_PAYMENT', 'PAYMENT_UNDER_REVIEW', 'CONFIRMED', 'BAKING',
  'READY_FOR_PICKUP', 'COMPLETED', 'CANCELLED',
]);
export const bakeDayStatus = pgEnum('bake_day_status', ['draft', 'open', 'closed', 'baking', 'completed', 'cancelled']);
export const cancellationReason = pgEnum('cancellation_reason', [
  'unpaid_timeout', 'customer_request', 'owner_cancelled', 'payment_not_received', 'no_show',
]);
export const cancelledBy = pgEnum('cancelled_by', ['customer', 'system', 'admin']);
export const notificationType = pgEnum('notification_type', [
  'order_received', 'payment_reminder', 'proof_rejected', 'confirmed', 'pickup_reminder',
  'pickup_changed', 'ready_for_pickup', 'cancelled', 'order_reinstated', 'owner_payment_to_verify',
]);
export const notificationStatus = pgEnum('notification_status', ['queued', 'sent', 'failed']);
export const proofVerdict = pgEnum('proof_verdict', ['pending', 'accepted', 'rejected']);
export const refundStatus = pgEnum('refund_status', ['owed', 'refunded']);
export const refundReason = pgEnum('refund_reason', ['order_cancelled', 'overpayment']);

const ts = (name: string) => timestamp(name, { withTimezone: true, mode: 'date' });

export const settings = pgTable('settings', {
  id: boolean('id').primaryKey().default(true),
  autoCancelHours: integer('auto_cancel_hours').notNull(),
  rejectRegraceHours: integer('reject_regrace_hours').notNull(),
  reuploadBufferHours: integer('reupload_buffer_hours').notNull(),
  uploadGraceMinutes: integer('upload_grace_minutes').notNull(),
  customerCancelHours: integer('customer_cancel_hours').notNull(),
  maxTartsPerOrder: integer('max_tarts_per_order').notNull(),
  defaultCapacityTarts: integer('default_capacity_tarts').notNull(),
  verificationSlaText: text('verification_sla_text').notNull(),
  ownerAlertEmail: text('owner_alert_email').notNull(),
  updatedAt: ts('updated_at').notNull(),
});

export const pickupLocations = pgTable('pickup_locations', {
  id: uuid('id').primaryKey().defaultRandom(),
  label: text('label').notNull(),
  publicBlurb: text('public_blurb').notNull(),
  fullAddress: text('full_address').notNull(),
  mapUrl: text('map_url'),
  instructions: text('instructions'),
  contactNumber: text('contact_number').notNull(),
  isActive: boolean('is_active').notNull().default(true),
});

export const bakeDays = pgTable('bake_days', {
  id: uuid('id').primaryKey().defaultRandom(),
  bakeDate: date('bake_date').notNull(),
  status: bakeDayStatus('status').notNull(),
  capacityTarts: integer('capacity_tarts').notNull(),
  orderOpensAt: ts('order_opens_at').notNull(),
  orderCutoffAt: ts('order_cutoff_at').notNull(),
  pickupStartsAt: ts('pickup_starts_at').notNull(),
  pickupEndsAt: ts('pickup_ends_at').notNull(),
  pickupLocationId: uuid('pickup_location_id'),
  publicNote: text('public_note'),
  createdAt: ts('created_at').notNull().defaultNow(),
  updatedAt: ts('updated_at').notNull().defaultNow(),
});

export const products = pgTable('products', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  subtitle: text('subtitle').notNull(),
  tartCount: integer('tart_count').notNull(),
  priceCentavos: integer('price_centavos').notNull(),
  isActive: boolean('is_active').notNull().default(true),
  sortOrder: integer('sort_order').notNull().default(0),
});

export const orders = pgTable('orders', {
  id: uuid('id').primaryKey().defaultRandom(),
  orderNumber: text('order_number').notNull(),
  accessTokenHash: text('access_token_hash').notNull(),
  bakeDayId: uuid('bake_day_id').notNull(),
  customerName: text('customer_name').notNull(),
  customerEmail: citext('customer_email').notNull(),
  customerPhone: text('customer_phone').notNull(),
  status: orderStatus('status').notNull(),
  totalTarts: integer('total_tarts').notNull(),
  totalCentavos: integer('total_centavos').notNull(),
  customerNote: text('customer_note'),
  adminNote: text('admin_note'),
  paymentDeadlineAt: ts('payment_deadline_at').notNull(),
  confirmedAt: ts('confirmed_at'),
  bakingAt: ts('baking_at'),
  readyAt: ts('ready_at'),
  completedAt: ts('completed_at'),
  cancelledAt: ts('cancelled_at'),
  cancellationReason: cancellationReason('cancellation_reason'),
  cancellationNote: text('cancellation_note'),
  cancelledBy: cancelledBy('cancelled_by'),
  createdAt: ts('created_at').notNull().defaultNow(),
  updatedAt: ts('updated_at').notNull().defaultNow(),
});

export const orderItems = pgTable('order_items', {
  id: uuid('id').primaryKey().defaultRandom(),
  orderId: uuid('order_id').notNull(),
  productId: uuid('product_id').notNull(),
  productNameSnapshot: text('product_name_snapshot').notNull(),
  tartCountSnapshot: integer('tart_count_snapshot').notNull(),
  unitPriceCentavosSnapshot: integer('unit_price_centavos_snapshot').notNull(),
  quantity: integer('quantity').notNull(),
  lineTotalCentavos: integer('line_total_centavos').notNull(),
});

export const paymentProofs = pgTable('payment_proofs', {
  id: uuid('id').primaryKey().defaultRandom(),
  orderId: uuid('order_id').notNull(),
  storagePath: text('storage_path').notNull(),
  mimeType: text('mime_type').notNull(),
  sizeBytes: integer('size_bytes').notNull(),
  referenceNumber: text('reference_number').notNull(),
  amountCentavos: integer('amount_centavos'),
  verdict: proofVerdict('verdict').notNull().default('pending'),
  rejectReason: text('reject_reason'),
  submittedAt: ts('submitted_at').notNull().defaultNow(),
  reviewedAt: ts('reviewed_at'),
});

export const refunds = pgTable('refunds', {
  id: uuid('id').primaryKey().defaultRandom(),
  orderId: uuid('order_id').notNull(),
  amountCentavos: integer('amount_centavos').notNull(),
  reason: refundReason('reason').notNull(),
  status: refundStatus('status').notNull().default('owed'),
  refundedAt: ts('refunded_at'),
  note: text('note'),
  createdAt: ts('created_at').notNull().defaultNow(),
});

export const paymentQrCodes = pgTable('payment_qr_codes', {
  id: uuid('id').primaryKey().defaultRandom(),
  provider: text('provider').notNull(),
  storagePath: text('storage_path'),
  accountName: text('account_name').notNull(),
  accountHint: text('account_hint'),
  isActive: boolean('is_active').notNull().default(true),
  sortOrder: integer('sort_order').notNull().default(0),
});

export const notifications = pgTable('notifications', {
  id: uuid('id').primaryKey().defaultRandom(),
  orderId: uuid('order_id').notNull(),
  type: notificationType('type').notNull(),
  dedupeKey: text('dedupe_key').notNull(),
  recipientEmail: text('recipient_email').notNull(),
  providerMessageId: text('provider_message_id'),
  status: notificationStatus('status').notNull().default('queued'),
  error: text('error'),
  attempts: integer('attempts').notNull().default(0),
  nextAttemptAt: ts('next_attempt_at').notNull().defaultNow(),
  payload: jsonb('payload').$type<Record<string, unknown>>().notNull(),
  sentAt: ts('sent_at'),
  createdAt: ts('created_at').notNull().defaultNow(),
});

export const auditLog = pgTable('audit_log', {
  id: uuid('id').primaryKey().defaultRandom(),
  actor: text('actor').notNull(),
  action: text('action').notNull(),
  entityType: text('entity_type').notNull(),
  entityId: uuid('entity_id').notNull(),
  before: jsonb('before'),
  after: jsonb('after'),
  ip: text('ip'),
  createdAt: ts('created_at').notNull().defaultNow(),
});

export type OrderStatus = (typeof orderStatus.enumValues)[number];
export type BakeDay = typeof bakeDays.$inferSelect;
export type Product = typeof products.$inferSelect;
export type Order = typeof orders.$inferSelect;
export type Settings = typeof settings.$inferSelect;
