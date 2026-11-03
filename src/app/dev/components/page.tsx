// Component preview: every Sunday Sieve component in each of its states, rendered with the
// app's real styles and fonts. Shown locally and on Vercel preview deployments, never in production.
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import type { ReactNode } from 'react';
import {
  BakeDayPanel, BoxSizeCard, Button, CapacityIndicator, FaqItem, HowItWorks, Notice, OrderNumber, OrderProgress,
  OrderSummary, PaymentCountdown, PaymentMethodPicker, PaymentQRCard, PickupDetails, StatusBadge, TextField, formatPeso,
} from '@/components/ss';
import type { OrderStatus } from '@/lib/db/schema';
import { OrderBuilderDemo, ProofUploadDemo, TextFieldDemo } from './demos';
import { sampleItems, sampleMethods, sampleProducts } from './samples';
import './preview.css';

export const metadata: Metadata = { title: 'Components · Sunday Sieve', robots: { index: false, follow: false } };

const STATUSES: OrderStatus[] = [
  'AWAITING_PAYMENT', 'PAYMENT_UNDER_REVIEW', 'CONFIRMED', 'BAKING', 'READY_FOR_PICKUP', 'COMPLETED', 'CANCELLED',
];

const SECTIONS = [
  'BakeDayPanel', 'CapacityIndicator', 'BoxSizeCard', 'OrderBuilder', 'OrderSummary', 'TextField', 'Button', 'Notice',
  'StatusBadge', 'OrderNumber', 'OrderProgress', 'PaymentCountdown', 'PaymentMethodPicker', 'PaymentQRCard',
  'ProofUpload', 'PickupDetails', 'HowItWorks', 'FaqItem',
];

function Section({ name, note, children }: { name: string; note?: string; children: ReactNode }) {
  return (
    <section id={name} className="preview-section" aria-labelledby={`${name}-title`}>
      <h2 id={`${name}-title`} className="preview-section__title">{name}</h2>
      {note ? <p className="preview-section__note">{note}</p> : null}
      {children}
    </section>
  );
}

function State({ label, inverse, children }: { label: string; inverse?: boolean; children: ReactNode }) {
  return (
    <figure className="preview-state">
      <figcaption className="preview-state__label">{label}</figcaption>
      <div className={inverse ? 'preview-state__frame preview-state__frame--inverse' : 'preview-state__frame'}>{children}</div>
    </figure>
  );
}

export default function ComponentsPreview() {
  if (process.env.VERCEL_ENV === 'production') notFound();

  const panel = { bakeDate: 'Saturday, 15 August', pickupWindow: '3:00–7:00 PM', cutoff: 'Friday, 14 August at 6:00 PM', capacity: 96 };
  const inADay = new Date(Date.now() + 23 * 3_600_000 + 14 * 60_000).toISOString();

  return (
    <div className="preview">
      <header className="preview-header">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/brand/lockup.png" alt="Sunday Sieve" width={120} height={60} style={{ height: 'auto' }} />
        <h1 className="heading-1" style={{ color: 'var(--ink-brand)', margin: 0 }}>Components</h1>
        <p className="preview-section__note">
          The design system&apos;s 18 components, ported to React, in each state. Sample data only. Not shown on the live site.
        </p>
        <nav aria-label="Components">
          <ul className="preview-nav">
            {SECTIONS.map((s) => <li key={s}><a href={`#${s}`}>{s}</a></li>)}
          </ul>
        </nav>
      </header>

      <main className="preview-main">
        <Section name="BakeDayPanel" note="The landing page's next-batch panel: open, sold out, closed and no batch, plus open but almost sold out.">
          <div className="preview-grid">
            <State label="open"><BakeDayPanel state="open" {...panel} remaining={36} note="Adding ube tarts this week!" orderHref="#" /></State>
            <State label="open, almost sold out"><BakeDayPanel state="open" {...panel} remaining={12} orderHref="#" /></State>
            <State label="soldout"><BakeDayPanel state="soldout" {...panel} remaining={0} followHref="#" followLabel="Follow us on Facebook" /></State>
            <State label="closed"><BakeDayPanel state="closed" {...panel} remaining={14} followHref="#" followLabel="Follow us on Facebook" /></State>
            <State label="none"><BakeDayPanel state="none" followHref="#" followLabel="Follow us on Facebook" /></State>
          </div>
        </Section>

        <Section name="CapacityIndicator" note="Counted in tarts, never boxes.">
          <div className="preview-grid">
            <State label="open (60 left)"><CapacityIndicator remaining={60} capacity={96} /></State>
            <State label="almost sold out (12 left)"><CapacityIndicator remaining={12} capacity={96} /></State>
            <State label="sold out"><CapacityIndicator remaining={0} capacity={96} /></State>
            <State label="inverse, on leaf-green" inverse><CapacityIndicator remaining={36} capacity={96} inverse /></State>
          </div>
        </Section>

        <Section name="BoxSizeCard" note="Card layout for the landing page menu; row layout for phones and the order form. Placeholders until the box photos are added.">
          <State label="card">
            <div className="preview-row">
              {sampleProducts.map((p) => (
                <BoxSizeCard key={p.key} name={p.name} subtitle={p.subtitle} tartCount={p.tartCount} price={formatPeso(p.priceCentavos)} />
              ))}
            </div>
          </State>
          <State label="row">
            <div className="demo-stack">
              {sampleProducts.map((p) => (
                <BoxSizeCard key={p.key} layout="row" name={p.name} subtitle={p.subtitle} tartCount={p.tartCount} price={formatPeso(p.priceCentavos)} />
              ))}
            </div>
          </State>
        </Section>

        <Section name="OrderBuilder" note="Interactive: BoxSizeCard with QuantityStepper feeding OrderSummary. 36 tarts left, 24 per order; steppers stop at whichever is lower.">
          <State label="try it"><OrderBuilderDemo /></State>
        </Section>

        <Section name="OrderSummary">
          <div className="preview-grid">
            <State label="empty"><OrderSummary items={[]} totalTarts={0} total="₱0.00" /></State>
            <State label="with deadline"><OrderSummary items={sampleItems} totalTarts={12} total="₱630.00" deadline="Tuesday, 11 August, 8:15 PM" /></State>
            <State label="over the 24-tart cap">
              <OrderSummary items={[{ name: 'The Family Brunch (Box of 12)', quantity: 3, lineTotal: '₱1,800.00' }]} totalTarts={36} total="₱1,800.00"
                overLimitAction={<Button variant="secondary" href="#">Message us on Messenger</Button>} />
            </State>
          </div>
        </Section>

        <Section name="TextField">
          <div className="preview-grid">
            <State label="with hint"><TextField label="Email" type="email" defaultValue="maria@example.com" hint="Your order link and receipt go here. There's no account, so use an email you check." /></State>
            <State label="optional, multiline"><TextField label="Note for us" optional multiline hint="Picking up for someone else? Tell us their name." /></State>
            <State label="error (interactive)"><TextFieldDemo /></State>
            <State label="disabled"><TextField label="Name" defaultValue="Maria Santos" disabled /></State>
          </div>
        </Section>

        <Section name="Button">
          <State label="variants, md">
            <div className="preview-row preview-row--wrap">
              <Button variant="primary">Place order</Button>
              <Button variant="secondary">Secondary</Button>
              <Button variant="quiet">Quiet</Button>
              <Button variant="danger">Cancel order</Button>
              <Button variant="primary" disabled>Disabled</Button>
            </div>
          </State>
          <State label="sun, on leaf-green" inverse>
            <div className="preview-row preview-row--wrap">
              <Button variant="sun" size="lg">Order now</Button>
              <Button variant="sun" size="lg" disabled>Sold out</Button>
            </div>
          </State>
          <State label="lg, block">
            <Button variant="primary" size="lg" block>Place order · ₱630.00</Button>
          </State>
        </Section>

        <Section name="Notice">
          <div className="preview-grid">
            <State label="info"><Notice tone="info" title="Before you place your order"><p>Unpaid orders are released at the payment deadline.</p></Notice></State>
            <State label="success"><Notice tone="success" title="Payment confirmed"><p>See you on Saturday.</p></Notice></State>
            <State label="warning"><Notice tone="warning" title="Show your order number at the gate"><p>ET-7K3M-9QP2 · 2 × The Picnic Pack.</p></Notice></State>
            <State label="danger, with action">
              <Notice tone="danger" title="We couldn't verify your last receipt" action={<Button variant="secondary">Upload a new receipt</Button>}>
                <p>Received ₱530 of ₱630 — please send the remaining ₱100 and upload that receipt.</p>
              </Notice>
            </State>
          </div>
        </Section>

        <Section name="StatusBadge" note="Customer-facing labels for every order status.">
          <State label="all statuses">
            <div className="preview-row preview-row--wrap">{STATUSES.map((s) => <StatusBadge key={s} status={s} />)}</div>
          </State>
        </Section>

        <Section name="OrderNumber">
          <div className="preview-grid">
            <State label="copyable"><OrderNumber value="ET-7K3M-9QP2" /></State>
            <State label="no copy button"><OrderNumber value="ET-7K3M-9QP2" copyable={false} /></State>
          </div>
        </Section>

        <Section name="OrderProgress">
          <div className="preview-grid">
            {STATUSES.map((s) => (
              <State key={s} label={s}>
                <OrderProgress status={s} reason={s === 'CANCELLED' ? 'Payment didn’t arrive by Tuesday, 11 August, 8:15 PM.' : undefined} />
              </State>
            ))}
          </div>
        </Section>

        <Section name="PaymentCountdown" note="The running state counts down live from a deadline 23 hours away.">
          <div className="preview-grid">
            <State label="running"><PaymentCountdown state="running" deadline="Tuesday, 11 August, 8:15 PM" deadlineAt={inADay} /></State>
            <State label="paused (receipt uploaded)"><PaymentCountdown state="paused" slaText="by the evening of the next day" /></State>
            <State label="expired"><PaymentCountdown state="expired" deadline="Tuesday, 11 August, 8:15 PM" /></State>
          </div>
        </Section>

        <Section name="PaymentMethodPicker" note="One QR code at a time. QR images arrive with admin uploads.">
          <State label="interactive"><PaymentMethodPicker methods={sampleMethods} amount="₱630.00" /></State>
        </Section>

        <Section name="PaymentQRCard">
          <div className="preview-grid">
            <State label="with amount"><PaymentQRCard provider="GCash" accountName="PA*****A N." accountHint="099• ••••507" amount="₱630.00" /></State>
            <State label="without amount"><PaymentQRCard provider="SeaBank" accountName="Patricia Navarro" accountHint="•••• 2038" /></State>
          </div>
        </Section>

        <Section name="ProofUpload" note="Interactive: choose a file and type a reference number to enable Send receipt. Nothing is uploaded.">
          <div className="preview-grid">
            <State label="try it"><ProofUploadDemo /></State>
          </div>
        </Section>

        <Section name="PickupDetails">
          <div className="preview-grid">
            <State label="before ready (area only)">
              <PickupDetails publicBlurb="Antipolo City, near [landmark]" pickupWindow="Saturday, 15 August · 3:00–7:00 PM" />
            </State>
            <State label="revealed (ready for pickup)">
              <PickupDetails revealed fullAddress="[House no.] [Street], [Barangay], Antipolo City" mapUrl="#"
                instructions="Ring the bell at the green gate." contactNumber="0917 123 4567" pickupWindow="Today, Saturday, 15 August · 3:00–7:00 PM" />
            </State>
          </div>
        </Section>

        <Section name="HowItWorks">
          <State label="default steps"><HowItWorks /></State>
        </Section>

        <Section name="FaqItem">
          <State label="closed and open">
            <FaqItem question="How do I pay?"><p>GCash, BDO, BPI or SeaBank. Your order page shows the QR codes and the exact amount.</p></FaqItem>
            <FaqItem question="What if I'm late for pickup?" defaultOpen>
              <p>Orders not collected by the end of the pickup window are forfeited and not refunded. If you can&apos;t make it, message us before the window closes.</p>
            </FaqItem>
          </State>
        </Section>
      </main>
    </div>
  );
}
