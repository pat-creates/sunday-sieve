// Order page (TDD §9.3, §10), following the canvas's "Order page" artboards: status, payment QR codes,
// countdown, receipt upload, and the pickup address once the order is ready. Reached through the
// emailed link (/orders/ET-…?t=…). Two columns from 900px wide, with the order details on the right.
import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { ReactNode } from 'react';
import {
  Button, Notice, OrderNumber, OrderProgress, OrderSummary, PaymentCountdown, PaymentMethodPicker, PickupDetails,
  StatusBadge, formatPeso,
} from '@/components/ss';
import { SiteFooter } from '@/components/SiteFooter';
import { getOrderPageData, type OrderPageData } from '@/lib/data';
import { formatDeadline } from '@/lib/format';
import { site } from '@/lib/site';
import { ReceiptUpload } from './ReceiptUpload';

// Order pages hold names and, once ready, the pickup address: keep them out of search results.
export const metadata: Metadata = { title: 'Your order — Sunday Sieve', robots: { index: false, follow: false } };

type Params = { params: Promise<{ orderNumber: string }>; searchParams: Promise<{ t?: string; state?: string }> };
type CancelReason = NonNullable<OrderPageData['cancellation']>['reason'];

/** Headline, reason and follow-up line for a cancelled order, in the canvas's wording. */
function cancelCopy(reason: CancelReason, deadline: string, received: number) {
  const refund = received > 0 ? ` We’ll refund ${formatPeso(received)} to the account you paid from within 3 days.` : '';
  switch (reason) {
    case 'unpaid_timeout':
      return received > 0
        ? { headline: 'This order was released', reason: `The rest of your payment didn’t arrive by the deadline (${deadline}), so your tarts went back on sale.${refund}`,
            followUp: 'We’ll message you once the refund is sent.' }
        : { headline: 'This order was released', reason: `We didn’t receive a receipt by the payment deadline (${deadline}), so your tarts went back on sale.`,
            followUp: 'If you already paid, reply to your order email or message us and we’ll sort it out.' };
    case 'owner_cancelled':
      return { headline: 'We’re sorry, we had to cancel', reason: `We couldn’t bake your order this time.${refund}`,
        followUp: received > 0 ? 'We’ll message you once the refund is sent. We’d love to bake for you next time.' : 'We’d love to bake for you next time.' };
    case 'payment_not_received':
      return { headline: 'This order was cancelled', reason: 'We couldn’t find your payment in our GCash or bank history.',
        followUp: 'If you did pay, message us with your receipt and we’ll sort it out.' };
    case 'no_show':
      return { headline: 'This order was cancelled', reason: 'It wasn’t collected by the end of the pickup window, so it was forfeited.',
        followUp: 'We’d love to bake for you next time.' };
    case 'customer_request':
      return { headline: 'This order was cancelled', reason: 'You asked us to cancel it.', followUp: 'We’d love to bake for you next time.' };
  }
}

export default async function OrderStatusPage({ params, searchParams }: Params) {
  const { orderNumber } = await params;
  const { t, state } = await searchParams;
  const order = await getOrderPageData(orderNumber, t, state);
  if (!order) notFound();

  const self = `/orders/${order.orderNumber}`;
  const deadline = formatDeadline(new Date(order.paymentDeadlineAt));
  const received = order.totalCentavos - order.amountDueCentavos;
  const pickupWindow = `${order.bakeDateLabel} · ${order.pickupWindowLabel}`;
  const summary = (title = 'Your order') => (
    <OrderSummary title={title} headingLevel={2} totalTarts={order.totalTarts} total={formatPeso(order.totalCentavos)}
      items={order.items.map((i) => ({ name: i.name, quantity: i.quantity, lineTotal: formatPeso(i.lineTotalCentavos) }))} />
  );
  const progress = <OrderProgress status={order.status} title="Where your order is" headingLevel={2} />;
  const pickupArea = <PickupDetails publicBlurb={order.pickupArea} pickupWindow={pickupWindow} headingLevel={2} />;
  const bookmark = <span>Bookmark this page. The link is also in your Order Received email.</span>;

  let head: ReactNode = null;
  let main: ReactNode;
  let side: ReactNode;
  let footer = <SiteFooter>{bookmark}</SiteFooter>;

  switch (order.status) {
    case 'AWAITING_PAYMENT': {
      const due = formatPeso(order.amountDueCentavos);
      const short = received > 0;
      head = short ? 'Please send the rest and upload a new receipt' : order.rejectReason ? 'Please upload your receipt again' : 'Pay to lock in your tarts';
      main = (
        <div className="col col--loose">
          <div className="col col--snug">
            {order.rejectReason ? (
              <Notice tone="danger" title={short ? 'Your payment was short' : 'We couldn’t verify your last receipt'}>
                <p>{order.rejectReason}</p>
              </Notice>
            ) : null}
            {/* Phones: one compact line, so the payment buttons show in the first screen. */}
            <div className="phone">
              <PaymentCountdown state="running" compact amount={due} deadline={deadline} deadlineAt={order.paymentDeadlineAt} />
            </div>
            {/* A short payment is already counted (TDD §9.4); say what happens to it if the rest never arrives. */}
            <div className="desk">
              <PaymentCountdown state="running" deadline={deadline} deadlineAt={order.paymentDeadlineAt}
                hint={short ? `If the rest doesn’t arrive by then, the order is cancelled and we refund the ${formatPeso(received)} you sent.` : undefined} />
            </div>
            {short ? <p className="muted phone">If the rest doesn’t arrive by then, the order is cancelled and we refund the {formatPeso(received)} you sent.</p> : null}
          </div>
          <section className="sec" aria-labelledby="pay">
            <h2 id="pay" className="h3">1. Send {due}</h2>
            <p className="text">Pick how you’ll pay, then send the exact amount.</p>
            <PaymentMethodPicker methods={order.paymentMethods} amount={due} headingLevel={3} />
          </section>
          <section className="sec" aria-labelledby="upload">
            <h2 id="upload" className="h3">2. Upload your receipt</h2>
            <ReceiptUpload sampleNextHref={`${self}?state=verifying`} />
          </section>
        </div>
      );
      side = <>{summary()}{progress}{pickupArea}</>;
      break;
    }
    case 'PAYMENT_UNDER_REVIEW':
      head = `Got your receipt, ${order.customerFirstName}`;
      main = (
        <div className="col col--snug">
          <PaymentCountdown state="paused" slaText={order.verificationSlaText} />
          {order.latestProof ? (
            <dl className="facts">
              <div><dt>Reference no.</dt><dd>{order.latestProof.referenceNumber}</dd></div>
              <div><dt>Uploaded</dt><dd>{formatDeadline(new Date(order.latestProof.submittedAt))}</dd></div>
            </dl>
          ) : null}
          <p className="muted">Your tarts stay held while we check. Nothing else to do.</p>
        </div>
      );
      side = <>{progress}{summary()}{pickupArea}</>;
      break;
    case 'CONFIRMED':
    case 'BAKING':
      head = order.status === 'BAKING' ? 'Your tarts are in the oven' : `You’re all set, ${order.customerFirstName}`;
      main = (
        <div className="col col--snug">
          <p className="lead">
            {order.status === 'BAKING'
              ? <>We’ll email you the exact pickup address as soon as they’re ready.</>
              : <>Payment received. See you on <strong>{order.bakeDateLabel}</strong>, {order.pickupWindowLabel}.</>}
          </p>
          {order.status === 'CONFIRMED' ? <p className="muted">We’ll email you the exact pickup address when your tarts are ready.</p> : null}
          {pickupArea}
        </div>
      );
      side = <>{progress}{summary()}</>;
      break;
    case 'READY_FOR_PICKUP': {
      const a = order.pickupAddress;
      main = (
        <div className="col col--snug">
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
        </div>
      );
      side = <>{progress}{summary()}</>;
      footer = <SiteFooter contactPrefix="Running late or lost?" />;
      break;
    }
    case 'COMPLETED':
      head = `Thank you, ${order.customerFirstName}!`;
      main = (
        <div className="col col--mid">
          <p className="lead">Your tarts were picked up. We hope they made your weekend.</p>
          <div className="btns"><Button variant="primary" size="lg" href="/">See the next bake day</Button></div>
        </div>
      );
      side = <>{progress}{summary()}</>;
      footer = <SiteFooter />;
      break;
    case 'CANCELLED': {
      const copy = cancelCopy(order.cancellation?.reason ?? 'owner_cancelled', deadline, received);
      head = copy.headline;
      main = (
        <div className="col col--mid">
          <OrderProgress status="CANCELLED" reason={<p>{copy.reason}</p>} />
          <p className="text">{copy.followUp}</p>
          <div className="btns">
            <Button variant="primary" size="lg" href="/">See the next bake day</Button>
            <Button variant="secondary" size="lg" href={site.facebookUrl}>Message us on Facebook</Button>
          </div>
        </div>
      );
      side = summary('What you ordered');
      footer = <SiteFooter />;
      break;
    }
  }

  return (
    <div className="pg">
      <header className="wrap topbar">
        <Link href="/">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/brand/lockup.png" alt="Sunday Sieve home" width={120} height={60} />
        </Link>
        <a className="topbar__link" href={site.facebookUrl}>Need help?</a>
      </header>
      <main className="wrap stack">
        <header className="sec">
          <div className="order-head">
            <OrderNumber value={order.orderNumber} />
            <StatusBadge status={order.status} />
          </div>
          {order.status === 'READY_FOR_PICKUP' ? (
            <div className="ready-banner">
              <p className="ready-banner__accent">fresh out of the oven</p>
              <h1 className="h1">Your tarts are ready</h1>
              <p className="lead">Pick up <strong>{order.bakeDateLabel}, {order.pickupWindowLabel}</strong>.</p>
            </div>
          ) : (
            <h1 className="h1">{head}</h1>
          )}
        </header>
        <div className="cols">
          {main}
          <aside className="col">{side}</aside>
        </div>
        {footer}
      </main>
    </div>
  );
}
