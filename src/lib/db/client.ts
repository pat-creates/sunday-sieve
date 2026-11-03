// One database handle for the whole app.
//
// Production: Supabase Postgres through the transaction-mode pooler (TDD §12.1), so
// prepared statements are off. Local dev and tests: PGlite (real Postgres compiled to WASM)
// when DATABASE_URL is unset, so the trigger, row locks and RLS run for real without Docker.
import { drizzle as drizzlePg } from 'drizzle-orm/postgres-js';
import { drizzle as drizzlePglite } from 'drizzle-orm/pglite';
import { sql, type SQL } from 'drizzle-orm';
import postgres from 'postgres';
import * as schema from './schema';
import { runMigrations } from './migrate';

export type Db = ReturnType<typeof drizzlePg<typeof schema>> | ReturnType<typeof drizzlePglite<typeof schema>>;
/** A transaction handle; same query API as Db. */
export type Tx = Parameters<Parameters<Db['transaction']>[0]>[0];
type Executor = Pick<Db, 'execute'>;

const globalForDb = globalThis as unknown as { __ssDb?: Promise<Db> };

async function connect(): Promise<Db> {
  const url = process.env.DATABASE_URL;
  if (url) {
    const client = postgres(url, { prepare: false, max: Number(process.env.DATABASE_POOL_MAX ?? 5) });
    return drizzlePg(client, { schema });
  }
  const { PGlite } = await import('@electric-sql/pglite');
  const { citext } = await import('@electric-sql/pglite/contrib/citext');
  const dataDir = process.env.PGLITE_DIR ?? './.pglite';
  const pg = await PGlite.create(dataDir === 'memory' ? undefined : dataDir, { extensions: { citext } });
  await runMigrations({ exec: (text) => pg.exec(text).then(() => undefined), query: (text) => pg.query(text).then((r) => r.rows) });
  return drizzlePglite(pg, { schema });
}

export function getDb(): Promise<Db> {
  if (!globalForDb.__ssDb) globalForDb.__ssDb = connect();
  return globalForDb.__ssDb;
}

/** Rows from db.execute(), which postgres-js returns as an array and PGlite as { rows }. */
export async function query<T = Record<string, unknown>>(db: Executor, q: SQL): Promise<T[]> {
  const res = (await db.execute(q)) as unknown;
  if (Array.isArray(res)) return res as T[];
  return ((res as { rows: T[] }).rows) ?? [];
}

/**
 * Starts every order-changing transaction (TDD §6.3). `true` scopes the setting to this
 * transaction only, which matters through the pooler: a session-level setting would leak
 * into the next request on the same connection.
 */
export async function setActor(tx: Executor, actor: 'customer' | 'admin' | 'system') {
  await tx.execute(sql`select set_config('app.actor', ${actor}, true)`);
}
