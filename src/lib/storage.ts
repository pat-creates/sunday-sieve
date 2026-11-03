// Private file storage (TDD §7.3). Supabase Storage in production; a local folder in dev.
// Nothing here ever produces a public URL: files leave only through short-lived signed URLs.
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

export const PROOFS_BUCKET = 'payment-proofs';
export const QR_BUCKET = 'payment-qr-codes';

interface Storage {
  put(bucket: string, key: string, body: Buffer, contentType: string): Promise<void>;
  get(bucket: string, key: string): Promise<Buffer>;
}

const localRoot = path.join(process.cwd(), '.storage');

const local: Storage = {
  async put(bucket, key, body) {
    const file = safeJoin(localRoot, bucket, key);
    await mkdir(path.dirname(file), { recursive: true });
    await writeFile(file, body);
  },
  async get(bucket, key) {
    return readFile(safeJoin(localRoot, bucket, key));
  },
};

function supabase(url: string, serviceKey: string): Storage {
  const headers = { Authorization: `Bearer ${serviceKey}`, apikey: serviceKey };
  return {
    async put(bucket, key, body, contentType) {
      const res = await fetch(`${url}/storage/v1/object/${bucket}/${encodeKey(key)}`, {
        method: 'POST',
        headers: { ...headers, 'Content-Type': contentType, 'x-upsert': 'false' },
        body: new Uint8Array(body),
      });
      if (!res.ok) throw new Error(`storage upload failed: ${res.status} ${await res.text()}`);
    },
    async get(bucket, key) {
      const res = await fetch(`${url}/storage/v1/object/authenticated/${bucket}/${encodeKey(key)}`, { headers });
      if (!res.ok) throw new Error(`storage download failed: ${res.status}`);
      return Buffer.from(await res.arrayBuffer());
    },
  };
}

function encodeKey(key: string) {
  return key.split('/').map(encodeURIComponent).join('/');
}

function safeJoin(root: string, ...segments: string[]) {
  const p = path.resolve(root, ...segments);
  if (!p.startsWith(root + path.sep)) throw new Error('invalid storage key');
  return p;
}

export function storage(): Storage {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  return url && key ? supabase(url, key) : local;
}
