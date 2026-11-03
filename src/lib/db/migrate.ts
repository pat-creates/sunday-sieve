// Applies db/migrations/*.sql in name order, once each. Works for PGlite and postgres-js.
import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';

export interface MigrationTarget {
  /** Runs a multi-statement script. */
  exec(text: string): Promise<void>;
  query(text: string): Promise<unknown[]>;
}

const MIGRATIONS_DIR = path.join(process.cwd(), 'db', 'migrations');

export async function runMigrations(target: MigrationTarget, log: (m: string) => void = () => {}) {
  await target.exec(`CREATE TABLE IF NOT EXISTS schema_migrations (
    name text PRIMARY KEY, applied_at timestamptz NOT NULL DEFAULT now())`);
  const done = new Set(
    ((await target.query('SELECT name FROM schema_migrations')) as { name: string }[]).map((r) => r.name),
  );
  const files = (await readdir(MIGRATIONS_DIR)).filter((f) => f.endsWith('.sql')).sort();
  for (const file of files) {
    if (done.has(file)) continue;
    const text = await readFile(path.join(MIGRATIONS_DIR, file), 'utf8');
    const name = file.replace(/'/g, "''");
    await target.exec(`BEGIN;\n${text}\nINSERT INTO schema_migrations (name) VALUES ('${name}');\nCOMMIT;`);
    log(`applied ${file}`);
  }
}
