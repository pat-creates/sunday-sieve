// Sends one email. Resend in production (TDD §8.2); in dev, prints it and saves a copy
// under .dev-mail/ so you can click the tracking link.
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { randomUUID } from 'node:crypto';

export interface OutgoingEmail {
  to: string;
  subject: string;
  html: string;
  text: string;
}

export async function sendEmail(email: OutgoingEmail): Promise<string> {
  const key = process.env.RESEND_API_KEY;
  if (!key) return devSend(email);
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from: process.env.EMAIL_FROM ?? 'Sunday Sieve <orders@example.com>',
      reply_to: process.env.EMAIL_REPLY_TO,
      to: [email.to],
      subject: email.subject,
      html: email.html,
      text: email.text,
    }),
  });
  if (!res.ok) throw new Error(`resend ${res.status}: ${await res.text()}`);
  const body = (await res.json()) as { id: string };
  return body.id;
}

async function devSend(email: OutgoingEmail): Promise<string> {
  const id = `dev-${randomUUID()}`;
  const dir = path.join(process.cwd(), '.dev-mail');
  await mkdir(dir, { recursive: true });
  const stamp = new Date().toISOString().replace(/[:.]/g, '-');
  await writeFile(path.join(dir, `${stamp}-${email.subject.replace(/[^\w-]+/g, '_').slice(0, 60)}.html`), email.html);
  console.log(`\n[dev email] to ${email.to} — ${email.subject}\n${email.text}\n`);
  return id;
}
