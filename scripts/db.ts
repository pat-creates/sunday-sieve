// npm run db:migrate | db:seed
// Uses DATABASE_URL if set, else the local PGlite folder (stop `npm run dev` first: PGlite is single-process).
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import postgres from 'postgres';
import { runMigrations, type MigrationTarget } from '../src/lib/db/migrate';

async function target(): Promise<{ t: MigrationTarget; close: () => Promise<void> }> {
  const url = process.env.DATABASE_URL;
  if (url) {
    const sql = postgres(url, { prepare: false, max: 1 });
    return { t: { exec: async (q) => { await sql.unsafe(q); }, query: (q) => sql.unsafe(q) }, close: () => sql.end() };
  }
  const { PGlite } = await import('@electric-sql/pglite');
  const { citext } = await import('@electric-sql/pglite/contrib/citext');
  const pg = await PGlite.create(process.env.PGLITE_DIR ?? './.pglite', { extensions: { citext } });
  return { t: { exec: async (q) => { await pg.exec(q); }, query: async (q) => (await pg.query(q)).rows }, close: () => pg.close() };
}

async function main() {
  const cmd = process.argv[2];
  const { t, close } = await target();
  try {
    await runMigrations(t, console.log);
    if (cmd === 'seed') {
      const [{ n }] = (await t.query('SELECT count(*)::int AS n FROM products')) as { n: number }[];
      if (n > 0) console.log('already seeded');
      else {
        await t.exec(await readFile(path.join(process.cwd(), 'db', 'seed.sql'), 'utf8'));
        console.log('seeded products, payment channels and pickup point');
      }
    }
  } finally {
    await close();
  }
}

main().catch((e) => { console.error(e); process.exit(1); });
