// The email outbox (TDD §8.3). A notification row is written in the same transaction as the
// status change; sending is a separate step, retried by the dispatcher.
import { sql } from 'drizzle-orm';
import { getDb, query, type Db, type Tx } from '../db/client';
import { renderEmail } from './templates';
import { sendEmail } from './transport';

type NotificationType =
  | 'order_received' | 'proof_rejected' | 'confirmed' | 'ready_for_pickup' | 'cancelled'
  | 'owner_payment_to_verify' | 'payment_reminder' | 'pickup_reminder' | 'pickup_changed' | 'order_reinstated';

const BACKOFF_MINUTES = [1, 5, 15, 60];
const MAX_ATTEMPTS = 5;

/**
 * Queue an email. `event` names what caused it (TDD §6 notifications): 'once' for one-per-order
 * emails, a proof id for proof emails, an audit id for cancellations. A duplicate dedupe_key is a
 * no-op, which is what makes a retried request or double click harmless. Returns the id, or null
 * if this email was already queued.
 */
export async function enqueue(
  tx: Tx | Db,
  n: { orderId: string; type: NotificationType; event: string; to: string; payload: Record<string, unknown> },
): Promise<string | null> {
  const dedupeKey = `${n.orderId}:${n.type}:${n.event}`;
  const rows = await query<{ id: string }>(tx, sql`
    INSERT INTO notifications (order_id, type, dedupe_key, recipient_email, payload)
    VALUES (${n.orderId}, ${n.type}, ${dedupeKey}, ${n.to}, ${JSON.stringify(n.payload)}::jsonb)
    ON CONFLICT (dedupe_key) DO NOTHING
    RETURNING id`);
  return rows[0]?.id ?? null;
}

interface Claimed {
  id: string;
  type: NotificationType;
  recipient_email: string;
  payload: Record<string, unknown>;
  attempts: number;
}

async function deliver(db: Db, n: Claimed) {
  try {
    const email = renderEmail(n.type, n.payload);
    const messageId = await sendEmail({ to: n.recipient_email, ...email });
    // The tracking link leaves the database as soon as the email is out (TDD §6 notifications).
    await db.execute(sql`
      UPDATE notifications SET status = 'sent', sent_at = now(), attempts = attempts + 1,
        provider_message_id = ${messageId}, error = NULL, payload = payload - 'link'
      WHERE id = ${n.id}`);
  } catch (err) {
    const attempts = n.attempts + 1;
    const wait = BACKOFF_MINUTES[Math.min(attempts - 1, BACKOFF_MINUTES.length - 1)];
    await db.execute(sql`
      UPDATE notifications SET status = 'failed', attempts = ${attempts}, error = ${String(err).slice(0, 500)},
        next_attempt_at = now() + make_interval(mins => ${wait})
      WHERE id = ${n.id}`);
    if (attempts >= MAX_ATTEMPTS) console.error(`[email] notification ${n.id} failed for good`, err);
  }
}

/** Claim rows with SKIP LOCKED so two runs never send the same email. */
async function claim(db: Db, where: ReturnType<typeof sql>, limit: number): Promise<Claimed[]> {
  return db.transaction(async (tx) =>
    query<Claimed>(tx, sql`
      UPDATE notifications SET next_attempt_at = now() + interval '2 minutes'
      WHERE id IN (
        SELECT id FROM notifications WHERE ${where}
        ORDER BY created_at LIMIT ${limit} FOR UPDATE SKIP LOCKED)
      RETURNING id, type, recipient_email, payload, attempts`),
  );
}

/** Step 1 of §8.3: right after commit, try the just-queued emails straight away. Never throws. */
export async function sendNow(ids: (string | null)[]) {
  const wanted = ids.filter((x): x is string => !!x);
  if (!wanted.length) return;
  try {
    const db = await getDb();
    const list = sql.join(wanted.map((id) => sql`${id}::uuid`), sql`, `);
    for (const n of await claim(db, sql`status = 'queued' AND id IN (${list})`, wanted.length)) await deliver(db, n);
  } catch (err) {
    console.error('[email] immediate send failed; the dispatcher will retry', err);
  }
}

/** Step 2: the every-minute dispatcher. Sends queued rows and failed rows that are due. */
export async function dispatchDue(limit = 50): Promise<number> {
  const db = await getDb();
  const batch = await claim(db, sql`
    (status = 'queued' OR (status = 'failed' AND attempts < ${MAX_ATTEMPTS})) AND next_attempt_at <= now()`, limit);
  for (const n of batch) await deliver(db, n);
  return batch.length;
}
