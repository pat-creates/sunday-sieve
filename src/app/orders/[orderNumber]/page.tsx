// Order page (TDD §9.3, §10): status, payment QR codes, countdown, receipt upload, and the
// pickup address once the order is ready. Reached through the emailed link (/orders/ET-…?t=…).
import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { ReactNode } from 'react';
import {
  Button, Notice, OrderNumber, OrderProgress, OrderSummary, PaymentCountdown, PaymentMethodPicker, PickupDetails,
  StatusBadge, formatPeso,
} from '@/components/ss';
import { ContactLine } from '@/components/SiteFooter';
import { getOrderPageData, type OrderPageData } from '@/lib/data';
import { formatDeadline } from '@/lib/format';
import { ReceiptUpload } from './ReceiptUpload';

// Order pages hold names and, once ready, the pickup address: keep them out of search results.
export const metadata: Metadata = { title: 'Your order — Sunday Sieve', robots: { index: false, follow: false } };

type Params = { params: Promise<{ orderNumber: string }>; searchParams: Promise<{ t?: string; state?: string }> };

const CANCEL_REASONS: Record<NonNullable<OrderPageData['cancellation']>['reason'], string> = {
  unpaid_timeout: 'Payment didn’t arrive by the deadline.',
  customer_request: 'You asked us to cancel it.',
  owner_cancelled: 'We had to cancel it. If you paid, we’ll refund the full amount to the account you paid from within 3 days.',
  payment_not_received: 'We couldn’t find your payment in our records.',
  no_show: 'It wasn’t collected by the end of the pickup window, so it was forfeited.',
};

export default async function OrderStatusPage({ params, searchParams }: Params) {
  const { orderNumber } = await params;
  const { t, state } = await searchParams;
  const order = await getOrderPageData(orderNumber, t, state);
  if (!order) notFound();

  const self = `/orders/${order.orderNumber}`;
  const deadline = formatDeadline(new Date(order.paymentDeadlineAt));
  const pickupWindow = `${order.bakeDateLabel} · ${order.pickupWindowLabel}`;
  const summary = (
    <OrderSummary title="Your order" headingLevel={2} totalTarts={order.totalTarts} total={formatPeso(order.totalCentavos)}
      items={order.items.map((i) => ({ name: i.name, quantity: i.quantity, lineTotal: formatPeso(i.lineTotalCentavos) }))} />
  );
  const progress = (
    <section className="page-section page-section--tight" aria-labelledby="where">
      <h2 id="where" className="h-step h-step--sm">Where your order is</h2>
      <OrderProgress status={order.status} />
    </section>
  );
  const pickupArea = <PickupDetails publicBlurb={order.pickupArea} pickupWindow={pickupWindow} headingLevel={2} />;

  let body: ReactNode;
  switch (order.status) {
    case 'AWAITING_PAYMENT': {
      const due = formatPeso(order.amountDueCentavos);
      const short = order.amountDueCentavos < order.totalCentavos;
      body = (
        <>
          <header className="page-header page-header--loose">
            <Head order={order} />
            <h1 className="h-page">
              {short ? 'Please send the rest and upload a new receipt' : order.rejectReason ? 'Please upload your receipt again' : 'Pay to lock in your tarts'}
            </h1>
            {order.rejectReason ? (
              <Notice tone="danger" title="We couldn’t verify your last receipt"><p>{order.rejectReason}</p></Notice>
            ) : null}
            <PaymentCountdown state="running" deadline={deadline} deadlineAt={order.paymentDeadlineAt} />
          </header>
          <section className="page-section" aria-labelledby="pay">
            <h2 id="pay" className="h-step">1. Send {due}</h2>
            <p className="text">Pick how you’ll pay, then send the exact amount.</p>
            <PaymentMethodPicker methods={order.paymentMethods} amount={due} headingLevel={3} />
          </section>
          <section className="page-section" aria-labelledby="upload">
            <h2 id="upload" className="h-step">2. Upload your receipt</h2>
            <ReceiptUpload sampleNextHref={`${self}?state=verifying`} />
          </section>
          <section className="page-section">{summary}{pickupArea}</section>
          {progress}
        </>
      );
      break;
    }
    case 'PAYMENT_UNDER_REVIEW':
      body = (
        <>
          <header className="page-header page-header--loose">
            <Head order={order} />
            <h1 className="h-page">Got your receipt, {order.customerFirstName}</h1>
            <PaymentCountdown state="paused" slaText={order.verificationSlaText} />
            {order.latestProof ? (
              <dl className="facts">
                <div><dt>Reference no.</dt><dd>{order.latestProof.referenceNumber}</dd></div>
                <div><dt>Uploaded</dt><dd>{formatDeadline(new Date(order.latestProof.submittedAt))}</dd></div>
              </dl>
            ) : null}
            <p className="fine">Your tarts stay held while we check. Nothing else to do.</p>
          </header>
          {progress}
          <section className="page-section">{summary}{pickupArea}</section>
        </>
      );
      break;
    case 'CONFIRMED':
    case 'BAKING':
      body = (
        <>
          <header className="page-header page-header--loose">
            <Head order={order} />
            <h1 className="h-page">
              {order.status === 'BAKING' ? 'Your tarts are in the oven' : `You’re all set, ${order.customerFirstName}`}
            </h1>
            <p className="lead">
              {order.status === 'BAKING'
                ? <>We’ll email you the exact pickup address as soon as they’re ready.</>
                : <>Payment received. See you on <strong>{order.bakeDateLabel}</strong>, {order.pickupWindowLabel}.</>}
            </p>
            {order.status === 'CONFIRMED' ? (
              <p className="fine">We’ll email you the exact pickup address when your tarts are ready.</p>
            ) : null}
          </header>
          {progress}
          <section className="page-section">{pickupArea}{summary}</section>
        </>
      );
      break;
    case 'READY_FOR_PICKUP': {
      const a = order.pickupAddress;
      body = (
        <>
          <header className="page-header page-header--loose">
            <Head order={order} />
            <div className="ready-banner">
              <p className="ready-banner__accent">fresh out of the oven</p>
              <h1 className="ready-banner__title">Your tarts are ready</h1>
              <p className="ready-banner__text">Pick up <strong>{order.bakeDateLabel}, {order.pickupWindowLabel}</strong>.</p>
            </div>
          </header>
          {a ? (
            <PickupDetails revealed fullAddress={a.fullAddress} mapUrl={a.mapUrl} instructions={a.instructions}
              contactNumber={a.contactNumber} pickupWindow={pickupWindow} headingLevel={2} />
          ) : null}
          <Notice tone="warning" title="Show your order number at the gate">
            <p>
              {order.orderNumber} · {order.items.map((i) => `${i.quantity} × ${i.name.replace(/ \(.*\)$/, '')}`).join(', ')}.
              Picking up for someone? Send them this page.
            </p>
            <p className="notice-gap">Orders not collected by the end of the pickup window are forfeited and not refunded. If you can’t make it, message us before the window closes.</p>
          </Notice>
          {progress}
          {summary}
        </>
      );
      break;
    }
    case 'COMPLETED':
      body = (
        <>
          <header className="page-header page-header--loose">
            <Head order={order} />
            <h1 className="h-page">Thank you, {order.customerFirstName}!</h1>
            <p className="lead">Your tarts were picked up. We hope they made your weekend.</p>
          </header>
          {progress}
          {summary}
          <Button variant="primary" size="lg" block href="/">See the next batch</Button>
        </>
      );
      break;
    case 'CANCELLED': {
      const reason = order.cancellation?.reason ?? 'owner_cancelled';
      body = (
        <>
          <header className="page-header page-header--loose">
            <Head order={order} />
            <h1 className="h-page">This order was cancelled</h1>
            {reason === 'unpaid_timeout'
              ? <PaymentCountdown state="expired" deadline={deadline} />
              : <OrderProgress status="CANCELLED" reason={<p>{CANCEL_REASONS[reason]}{order.cancellation?.note ? ` ${order.cancellation.note}` : ''}</p>} />}
          </header>
          <Button variant="primary" size="lg" block href="/">Order from the next batch</Button>
          {summary}
        </>
      );
      break;
    }
  }

  return (
    <div className="page page--compact">
      <nav className="page-nav page-nav--center" aria-label="Sunday Sieve">
        <Link href="/">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img className="page-nav__logo page-nav__logo--lg" src="/brand/lockup.png" alt="Sunday Sieve home" width={120} height={60} />
        </Link>
      </nav>
      {body}
      <footer className="site-footer">
        {order.status !== 'CANCELLED' && order.status !== 'COMPLETED'
          ? <span>Bookmark this page. The link is also in your Order Received email.</span>
          : null}
        <ContactLine prefix={order.status === 'READY_FOR_PICKUP' ? 'Running late or lost?' : 'Questions?'} />
      </footer>
    </div>
  );
}

function Head({ order }: { order: OrderPageData }) {
  return (
    <div className="order-head">
      <OrderNumber value={order.orderNumber} />
      <StatusBadge status={order.status} />
    </div>
  );
}
