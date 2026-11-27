'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { BoxSizeCard, Button, Notice, OrderSummary, TextField, formatPeso } from '@/components/ss';
import type { ProductView } from '@/lib/data/types';
import { formatDeadline } from '@/lib/format';
import { validateOrderDetails, type OrderDetails } from '@/lib/validation';

interface Props {
  products: ProductView[];
  /** The box picked on the landing page menu, added once to start with. */
  initialProductId?: string;
  /** Where "Full policies" goes: the landing page FAQ. */
  faqHref: string;
  remainingTarts: number;
  maxTartsPerOrder: number;
  autoCancelHours: number;
  /** ISO order_cutoff_at; the payment deadline is clamped to it (TDD §9.6). */
  cutoffAt: string;
  messengerUrl: string;
  /** Until ordering is wired up, a valid form opens this sample order page. */
  sampleOrderHref: string;
}

type Field = keyof OrderDetails;
const FIELD_ORDER: Field[] = ['email', 'name', 'phone', 'note']; // the order they appear on the form

export function OrderForm({ products, initialProductId, faqHref, remainingTarts, maxTartsPerOrder, autoCancelHours, cutoffAt, messengerUrl, sampleOrderHref }: Props) {
  const router = useRouter();
  const [qty, setQty] = useState<Record<string, number>>(() => (initialProductId ? { [initialProductId]: 1 } : {}));
  const [details, setDetails] = useState<OrderDetails>({ name: '', email: '', phone: '', note: '' });
  const [touched, setTouched] = useState<Partial<Record<Field, boolean>>>({});
  const [submitted, setSubmitted] = useState(false);
  const [deadline, setDeadline] = useState<string>();

  // The deadline shown before ordering: 24 hours from now, or the cutoff if sooner. Computed in
  // the browser so it matches the customer's clock, and refreshed each minute.
  useEffect(() => {
    const update = () => setDeadline(formatDeadline(new Date(Math.min(Date.now() + autoCancelHours * 3_600_000, new Date(cutoffAt).getTime()))));
    update();
    const t = setInterval(update, 60_000);
    return () => clearInterval(t);
  }, [autoCancelHours, cutoffAt]);

  const totalTarts = products.reduce((t, p) => t + (qty[p.id] ?? 0) * p.tartCount, 0);
  const totalCentavos = products.reduce((t, p) => t + (qty[p.id] ?? 0) * p.priceCentavos, 0);
  const cap = Math.min(maxTartsPerOrder, remainingTarts);
  const items = products
    .filter((p) => (qty[p.id] ?? 0) > 0)
    .map((p) => ({ name: `${p.name} (${p.subtitle})`, quantity: qty[p.id], lineTotal: formatPeso(qty[p.id] * p.priceCentavos) }));

  const errors = useMemo(() => validateOrderDetails(details), [details]);
  const shown = (f: Field) => (submitted || touched[f] ? errors[f] : undefined);
  const hasBoxes = totalTarts > 0;

  const set = (f: Field) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setDetails((d) => ({ ...d, [f]: e.target.value }));
  const blur = (f: Field) => () => setTouched((t) => ({ ...t, [f]: true }));

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitted(true);
    const first = FIELD_ORDER.find((f) => errors[f]);
    if (first) {
      document.getElementById(`order-${first}`)?.focus();
      return;
    }
    if (!hasBoxes || totalTarts > cap) return;
    router.push(sampleOrderHref);
  }

  return (
    <form onSubmit={submit} noValidate className="cols">
      <div className="col col--loose">
        <section className="sec sec--tight" aria-labelledby="step-boxes">
          <h2 id="step-boxes" className="h3 h3--step">1. Choose your boxes</h2>
          {products.map((p) => {
            const others = totalTarts - (qty[p.id] ?? 0) * p.tartCount;
            return (
              <BoxSizeCard key={p.id} layout="row" name={p.name} subtitle={p.subtitle} tartCount={p.tartCount}
                price={formatPeso(p.priceCentavos)} quantity={qty[p.id] ?? 0}
                max={Math.max(0, Math.floor((cap - others) / p.tartCount))}
                onQuantityChange={(v) => setQty((q) => ({ ...q, [p.id]: v }))} headingLevel={3} />
            );
          })}
          <p className="muted">
            Up to {maxTartsPerOrder} tarts per order. Need more? <a href={messengerUrl}>Message us</a>.
          </p>
        </section>

        <section className="sec" aria-labelledby="step-details">
          <h2 id="step-details" className="h3 h3--step">2. Your details</h2>
          <div className="fields">
            <TextField label="Email" name="email" type="email" autoComplete="email" inputMode="email" value={details.email}
              onChange={set('email')} onBlur={blur('email')} error={shown('email')} className="span-all"
              hint="Your order link and receipt go here. There's no account, so use an email you check." id="order-email" />
            <TextField label="Name" name="name" autoComplete="name" value={details.name} onChange={set('name')} onBlur={blur('name')}
              error={shown('name')} id="order-name" />
            <TextField label="Mobile number" name="phone" type="tel" autoComplete="tel" inputMode="tel" value={details.phone}
              onChange={set('phone')} onBlur={blur('phone')} error={shown('phone')}
              hint="Only if something goes wrong. 0917 123 4567" id="order-phone" />
            <TextField label="Note for us" name="note" optional multiline value={details.note} onChange={set('note')} onBlur={blur('note')}
              error={shown('note')} hint="Picking up for someone else? Tell us their name." maxLength={500} className="span-all" id="order-note" />
          </div>
        </section>
      </div>

      <aside className="col col--snug side" aria-label="Check and place your order">
        <OrderSummary title="Your order" items={items} totalTarts={totalTarts} total={formatPeso(totalCentavos)}
          maxTarts={maxTartsPerOrder} deadline={hasBoxes ? deadline : undefined} headingLevel={2}
          overLimitAction={<Button variant="secondary" href={messengerUrl}>Message us on Messenger</Button>} />
        {/* The short checkout version of the policies; the FAQ keeps the exact wording. */}
        <Notice tone="info" title="Before you pay">
          <ul className="policies">
            <li>Unpaid orders are released at the payment deadline.</li>
            <li>No-shows forfeit the order; message us if you can’t make it.</li>
            <li>If we cancel a paid order, you get a full refund within 3 days.</li>
          </ul>
          <p className="notice-gap"><a href={faqHref}>Full policies</a></p>
        </Notice>
        {submitted && Object.keys(errors).length > 0 ? (
          <Notice tone="danger" title="Please check your details">
            <p>Fix the highlighted fields, then place your order.</p>
          </Notice>
        ) : null}
        <Button type="submit" variant="primary" size="lg" block disabled={!hasBoxes || totalTarts > cap}>
          {hasBoxes ? `Place order · ${formatPeso(totalCentavos)}` : 'Choose at least one box'}
        </Button>
        <p className="muted muted--center">Next: pay and upload your receipt.</p>
      </aside>
    </form>
  );
}
