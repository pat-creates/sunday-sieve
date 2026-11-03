-- Egg tart pre-order system: initial schema (TDD §6).
-- Money in centavos (int). Timestamps timestamptz, stored UTC, shown in Asia/Manila.

CREATE EXTENSION IF NOT EXISTS citext;

-- Enums (TDD Appendix A)
CREATE TYPE order_status AS ENUM (
  'AWAITING_PAYMENT', 'PAYMENT_UNDER_REVIEW', 'CONFIRMED', 'BAKING',
  'READY_FOR_PICKUP', 'COMPLETED', 'CANCELLED'
);
CREATE TYPE bake_day_status AS ENUM ('draft', 'open', 'closed', 'baking', 'completed', 'cancelled');
CREATE TYPE cancellation_reason AS ENUM (
  'unpaid_timeout', 'customer_request', 'owner_cancelled', 'payment_not_received', 'no_show'
);
CREATE TYPE cancelled_by AS ENUM ('customer', 'system', 'admin');
CREATE TYPE notification_type AS ENUM (
  'order_received', 'payment_reminder', 'proof_rejected', 'confirmed', 'pickup_reminder',
  'pickup_changed', 'ready_for_pickup', 'cancelled', 'order_reinstated', 'owner_payment_to_verify'
);
CREATE TYPE notification_status AS ENUM ('queued', 'sent', 'failed');
CREATE TYPE proof_verdict AS ENUM ('pending', 'accepted', 'rejected');
CREATE TYPE refund_status AS ENUM ('owed', 'refunded');
CREATE TYPE refund_reason AS ENUM ('order_cancelled', 'overpayment');

-- settings: single row of scalar knobs
CREATE TABLE settings (
  id                     boolean PRIMARY KEY DEFAULT true CHECK (id),
  auto_cancel_hours      int  NOT NULL DEFAULT 24 CHECK (auto_cancel_hours > 0),
  reject_regrace_hours   int  NOT NULL DEFAULT 12 CHECK (reject_regrace_hours > 0),
  reupload_buffer_hours  int  NOT NULL DEFAULT 3 CHECK (reupload_buffer_hours >= 0),
  upload_grace_minutes   int  NOT NULL DEFAULT 15 CHECK (upload_grace_minutes >= 0),
  customer_cancel_hours  int  NOT NULL DEFAULT 24 CHECK (customer_cancel_hours >= 0),
  max_tarts_per_order    int  NOT NULL DEFAULT 24 CHECK (max_tarts_per_order > 0),
  default_capacity_tarts int  NOT NULL DEFAULT 96 CHECK (default_capacity_tarts > 0),
  verification_sla_text  text NOT NULL DEFAULT 'by the evening of the next day',
  owner_alert_email      text NOT NULL DEFAULT 'owner@example.com',
  updated_at             timestamptz NOT NULL DEFAULT now()
);
INSERT INTO settings DEFAULT VALUES;

CREATE TABLE pickup_locations (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  label          text NOT NULL,
  public_blurb   text NOT NULL,
  full_address   text NOT NULL,
  map_url        text,
  instructions   text,
  contact_number text NOT NULL,
  is_active      boolean NOT NULL DEFAULT true
);

CREATE TABLE bake_days (
  id                 uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  bake_date          date NOT NULL UNIQUE,
  status             bake_day_status NOT NULL DEFAULT 'draft',
  capacity_tarts     int NOT NULL CHECK (capacity_tarts > 0),
  order_opens_at     timestamptz NOT NULL,
  order_cutoff_at    timestamptz NOT NULL,
  pickup_starts_at   timestamptz NOT NULL,
  pickup_ends_at     timestamptz NOT NULL,
  pickup_location_id uuid REFERENCES pickup_locations(id),
  public_note        text,
  created_at         timestamptz NOT NULL DEFAULT now(),
  updated_at         timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT bake_day_times_ordered CHECK (
    order_opens_at < order_cutoff_at
    AND order_cutoff_at <= pickup_starts_at
    AND pickup_starts_at < pickup_ends_at
  )
);

CREATE TABLE products (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name           text NOT NULL,
  subtitle       text NOT NULL,
  tart_count     int  NOT NULL CHECK (tart_count > 0),
  price_centavos int  NOT NULL CHECK (price_centavos >= 0),
  is_active      boolean NOT NULL DEFAULT true,
  sort_order     int NOT NULL DEFAULT 0
);

CREATE TABLE orders (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number        text NOT NULL UNIQUE,
  access_token_hash   text NOT NULL UNIQUE,
  bake_day_id         uuid NOT NULL REFERENCES bake_days(id),
  customer_name       text NOT NULL,
  customer_email      citext NOT NULL,
  customer_phone      text NOT NULL,
  status              order_status NOT NULL DEFAULT 'AWAITING_PAYMENT',
  total_tarts         int NOT NULL CHECK (total_tarts > 0),
  total_centavos      int NOT NULL CHECK (total_centavos >= 0),
  customer_note       text,
  admin_note          text,
  payment_deadline_at timestamptz NOT NULL,
  confirmed_at        timestamptz,
  baking_at           timestamptz,
  ready_at            timestamptz,
  completed_at        timestamptz,
  cancelled_at        timestamptz,
  cancellation_reason cancellation_reason,
  cancellation_note   text,
  cancelled_by        cancelled_by,
  created_at          timestamptz NOT NULL DEFAULT now(),
  updated_at          timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX orders_bake_day_status_idx ON orders (bake_day_id, status);
CREATE INDEX orders_status_deadline_idx ON orders (status, payment_deadline_at);
CREATE INDEX orders_customer_email_idx ON orders (customer_email);

CREATE TABLE order_items (
  id                           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id                     uuid NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id                   uuid NOT NULL REFERENCES products(id),
  product_name_snapshot        text NOT NULL,
  tart_count_snapshot          int  NOT NULL,
  unit_price_centavos_snapshot int  NOT NULL,
  quantity                     int  NOT NULL CHECK (quantity > 0),
  line_total_centavos          int  NOT NULL
);
CREATE INDEX order_items_order_idx ON order_items (order_id);

CREATE TABLE payment_proofs (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id         uuid NOT NULL REFERENCES orders(id),
  storage_path     text NOT NULL,
  mime_type        text NOT NULL CHECK (mime_type IN ('image/jpeg', 'image/png', 'application/pdf')),
  size_bytes       int  NOT NULL CHECK (size_bytes > 0 AND size_bytes <= 8388608),
  reference_number text NOT NULL CHECK (reference_number ~ '^[A-Za-z0-9]{6,30}$'),
  amount_centavos  int,
  verdict          proof_verdict NOT NULL DEFAULT 'pending',
  reject_reason    text,
  submitted_at     timestamptz NOT NULL DEFAULT now(),
  reviewed_at      timestamptz
);
CREATE INDEX payment_proofs_order_idx ON payment_proofs (order_id);
CREATE INDEX payment_proofs_reference_idx ON payment_proofs (reference_number);

CREATE TABLE refunds (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id        uuid NOT NULL REFERENCES orders(id),
  amount_centavos int  NOT NULL CHECK (amount_centavos > 0),
  reason          refund_reason NOT NULL,
  status          refund_status NOT NULL DEFAULT 'owed',
  refunded_at     timestamptz,
  note            text,
  created_at      timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX refunds_status_idx ON refunds (status);

CREATE TABLE payment_qr_codes (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  provider     text NOT NULL,
  storage_path text,
  account_name text NOT NULL,
  account_hint text,
  is_active    boolean NOT NULL DEFAULT true,
  sort_order   int NOT NULL DEFAULT 0
);

CREATE TABLE notifications (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id            uuid NOT NULL REFERENCES orders(id),
  type                notification_type NOT NULL,
  dedupe_key          text NOT NULL UNIQUE,
  recipient_email     text NOT NULL,
  provider_message_id text,
  status              notification_status NOT NULL DEFAULT 'queued',
  error               text,
  attempts            int NOT NULL DEFAULT 0,
  next_attempt_at     timestamptz NOT NULL DEFAULT now(),
  payload             jsonb NOT NULL DEFAULT '{}'::jsonb,
  sent_at             timestamptz,
  created_at          timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX notifications_dispatch_idx ON notifications (status, next_attempt_at);

CREATE TABLE audit_log (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  actor       text NOT NULL,
  action      text NOT NULL,
  entity_type text NOT NULL,
  entity_id   uuid NOT NULL,
  before      jsonb,
  after       jsonb,
  ip          text,
  created_at  timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX audit_log_entity_idx ON audit_log (entity_type, entity_id);

-- §6.3 The state machine, enforced in the database.
-- One row per allowed move in §4.2.
CREATE TABLE order_transitions (
  from_status order_status NOT NULL,
  to_status   order_status NOT NULL,
  actor       text NOT NULL CHECK (actor IN ('customer', 'admin', 'system')),
  PRIMARY KEY (from_status, to_status, actor)
);
INSERT INTO order_transitions (from_status, to_status, actor) VALUES
  ('AWAITING_PAYMENT',     'PAYMENT_UNDER_REVIEW', 'customer'),
  ('AWAITING_PAYMENT',     'CANCELLED',            'customer'),  -- v1.1 self-cancel; window checked below
  ('AWAITING_PAYMENT',     'CANCELLED',            'system'),    -- unpaid timeout
  ('AWAITING_PAYMENT',     'CANCELLED',            'admin'),     -- §5.3 manual cancel of a pending order
  ('PAYMENT_UNDER_REVIEW', 'CONFIRMED',            'admin'),
  ('PAYMENT_UNDER_REVIEW', 'AWAITING_PAYMENT',     'admin'),     -- proof rejected
  ('PAYMENT_UNDER_REVIEW', 'CANCELLED',            'admin'),
  ('CANCELLED',            'AWAITING_PAYMENT',     'admin'),     -- v1.1 reinstate
  ('CONFIRMED',            'BAKING',               'admin'),
  ('BAKING',               'READY_FOR_PICKUP',     'admin'),
  ('READY_FOR_PICKUP',     'COMPLETED',            'admin'),
  ('CONFIRMED',            'CANCELLED',            'admin'),
  ('BAKING',               'CANCELLED',            'admin'),
  ('READY_FOR_PICKUP',     'CANCELLED',            'admin');

CREATE FUNCTION enforce_order_transition() RETURNS trigger AS $$
DECLARE
  v_actor text := current_setting('app.actor', true);   -- set per transaction
BEGIN
  IF NEW.status = OLD.status THEN RETURN NEW; END IF;

  IF NOT EXISTS (SELECT 1 FROM order_transitions t
                 WHERE t.from_status = OLD.status
                   AND t.to_status   = NEW.status
                   AND t.actor       = v_actor) THEN
    RAISE EXCEPTION 'illegal transition % -> % by %', OLD.status, NEW.status, coalesce(v_actor, '(no actor)')
      USING ERRCODE = 'P0001';
  END IF;

  -- Customer cancel: only unpaid, only inside the window
  IF v_actor = 'customer' AND NEW.status = 'CANCELLED'
     AND now() >= OLD.created_at
                  + make_interval(hours => (SELECT customer_cancel_hours FROM settings)) THEN
    RAISE EXCEPTION 'customer cancel window has closed';
  END IF;

  -- Reinstate: only an order cancelled for non-payment
  IF OLD.status = 'CANCELLED' AND OLD.cancellation_reason IS DISTINCT FROM 'unpaid_timeout' THEN
    RAISE EXCEPTION 'only unpaid-timeout cancellations can be reinstated';
  END IF;

  IF NEW.status = 'CANCELLED' THEN NEW.cancelled_by := v_actor::cancelled_by; END IF;
  NEW.updated_at := now();
  RETURN NEW;
END $$ LANGUAGE plpgsql;

CREATE TRIGGER orders_transition
  BEFORE UPDATE OF status ON orders
  FOR EACH ROW EXECUTE FUNCTION enforce_order_transition();

-- §7.7 Lock down the public API: RLS on every table, no policies.
-- All data access happens on the server with the service-role connection.
ALTER TABLE settings          ENABLE ROW LEVEL SECURITY;
ALTER TABLE pickup_locations  ENABLE ROW LEVEL SECURITY;
ALTER TABLE bake_days         ENABLE ROW LEVEL SECURITY;
ALTER TABLE products          ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders            ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items       ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_proofs    ENABLE ROW LEVEL SECURITY;
ALTER TABLE refunds           ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_qr_codes  ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications     ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_log         ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_transitions ENABLE ROW LEVEL SECURITY;
