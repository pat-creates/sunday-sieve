// Email templates. Follows the design system's email rules: one 600px column on cream-light,
// a leaf-green header band with "Sunday Sieve" as text, Georgia/Arial, inline hex colours,
// 44px buttons with the link also written out, order number and link near the top.
//
// v1 so far: Order Received and Payment to Verify. The other four customer emails
// (Proof Rejected, Confirmed, Ready for Pickup, Cancelled) arrive with the owner path (M2).
import { site } from '../site';

export interface RenderedEmail {
  subject: string;
  html: string;
  text: string;
}

const esc = (s: unknown) =>
  String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);

function layout(opts: { preheader: string; body: string; footer: string }) {
  return `<!doctype html><html><body style="margin:0;padding:0;background:#fffcf2">
<span style="display:none;max-height:0;overflow:hidden">${esc(opts.preheader)}</span>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#fffcf2"><tr><td align="center">
<table role="presentation" width="600" cellpadding="0" cellspacing="0" style="width:600px;max-width:100%">
<tr><td style="background:#2a6421;padding:20px 24px;font-family:Georgia,serif;font-size:24px;font-weight:bold;color:#fff9e5">Sunday Sieve</td></tr>
<tr><td style="padding:24px;font-family:Arial,Helvetica,sans-serif;font-size:16px;line-height:24px;color:#363533">${opts.body}</td></tr>
<tr><td style="padding:16px 24px 32px;font-family:Arial,Helvetica,sans-serif;font-size:13px;line-height:20px;color:#6b665c;border-top:1px solid #e8dcb8">${opts.footer}</td></tr>
</table></td></tr></table></body></html>`;
}

function button(href: string, label: string) {
  return `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:16px 0 4px"><tr><td style="background:#2a6421;border-radius:4px">
<a href="${esc(href)}" style="display:inline-block;padding:12px 24px;min-height:20px;font-family:Arial,Helvetica,sans-serif;font-size:16px;font-weight:bold;color:#fff9e5;text-decoration:none">${esc(label)}</a>
</td></tr></table><p style="margin:0 0 16px;font-size:13px;color:#6b665c;word-break:break-all">${esc(href)}</p>`;
}

const h1 = (t: string) => `<h1 style="margin:0 0 12px;font-family:Georgia,serif;font-size:26px;line-height:32px;color:#2a6421">${esc(t)}</h1>`;
const p = (t: string) => `<p style="margin:0 0 12px">${t}</p>`;

function contactFooter(bakeDate?: string) {
  const text = site.contactNumber ? ` or text ${esc(site.contactNumber)}` : '';
  return `${bakeDate ? `Bake day: ${esc(bakeDate)}.<br>` : ''}Questions? Message us on Facebook (${esc(site.facebookUrl)})${text}.`;
}

type Payload = Record<string, unknown>;

const templates: Record<string, (d: Payload) => RenderedEmail> = {
  order_received(d) {
    const items = (d.items as { name: string; quantity: number; lineTotal: string }[]) ?? [];
    const lines = items.map((i) => `${i.quantity} × ${esc(i.name)} — ${esc(i.lineTotal)}`).join('<br>');
    const body = [
      `<p style="margin:0 0 4px;font-size:13px;color:#6b665c">Order number</p>`,
      `<p style="margin:0 0 16px;font-size:20px;font-weight:bold;letter-spacing:1px">${esc(d.orderNumber)}</p>`,
      h1(`Thank you, ${d.firstName}! Now please pay to lock in your tarts`),
      `<table role="presentation" width="100%" style="background:#fdefc0;margin:0 0 16px"><tr><td style="padding:16px">
        <strong>Pay ${esc(d.total)} by ${esc(d.deadline)}.</strong><br>
        Unpaid orders are released at the deadline so others can take the slot.</td></tr></table>`,
      p('Your order page has the QR codes for GCash, BDO, BPI and SeaBank, and the place to upload your receipt with its reference number.'),
      button(String(d.link), 'Pay and upload your receipt'),
      p(`<strong>Keep this email.</strong> It's your receipt and your only link to your order, since there's no account.`),
      p(lines),
      p(`<strong>Total: ${esc(d.total)}</strong> · ${esc(d.totalTarts)} tarts`),
      p(`Pickup: ${esc(d.bakeDate)}, ${esc(d.pickupWindow)} · ${esc(d.pickupArea)}. We'll email the exact address when your order is ready.`),
      p(`After you upload your receipt, we'll verify your payment ${esc(d.slaText)} — you'll get an email.`),
      `<p style="margin:0;font-size:13px;color:#6b665c">Orders not collected by the end of the pickup window are forfeited and not refunded. If you can't make it, message us before the window closes. If we have to cancel a paid order, we refund the full amount to the account you paid from within 3 days.</p>`,
    ].join('');
    return {
      subject: `Order ${d.orderNumber}: please pay by ${d.deadline}`,
      html: layout({ preheader: `Pay ${d.total} by ${d.deadline} to lock in your tarts.`, body, footer: contactFooter(String(d.bakeDate)) }),
      text: [
        `Order number: ${d.orderNumber}`,
        `Thank you, ${d.firstName}! Pay ${d.total} by ${d.deadline} to lock in your tarts.`,
        `Pay and upload your receipt: ${d.link}`,
        `Keep this email: it's your receipt and your only link to your order.`,
        ...items.map((i) => `${i.quantity} × ${i.name} — ${i.lineTotal}`),
        `Total: ${d.total} · ${d.totalTarts} tarts`,
        `Pickup: ${d.bakeDate}, ${d.pickupWindow} · ${d.pickupArea}`,
      ].join('\n'),
    };
  },

  owner_payment_to_verify(d) {
    const body = [
      h1(`Payment to verify: ${d.orderNumber}`),
      p(`<strong>${esc(d.customerName)}</strong> uploaded a receipt.`),
      p(`Expected: <strong>${esc(d.amountDue)}</strong><br>Reference no.: <strong>${esc(d.referenceNumber)}</strong><br>Bake day: ${esc(d.bakeDate)}`),
      p('Search your GCash or bank history for the reference number and check the amount before confirming.'),
      button(String(d.adminUrl), 'Open the order'),
    ].join('');
    return {
      subject: `Verify ${d.amountDue} from ${d.customerName} (${d.orderNumber})`,
      html: layout({ preheader: `Reference ${d.referenceNumber}`, body, footer: 'Sent to the owner alert address in settings.' }),
      text: `Payment to verify: ${d.orderNumber}\n${d.customerName}, expected ${d.amountDue}, ref ${d.referenceNumber}\n${d.adminUrl}`,
    };
  },
};

export function renderEmail(type: string, payload: Payload): RenderedEmail {
  const t = templates[type];
  if (!t) throw new Error(`no email template for ${type} yet`);
  return t(payload);
}
