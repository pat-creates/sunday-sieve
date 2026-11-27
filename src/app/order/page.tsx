// Order form (TDD §9.2), following the canvas's "Order form" artboards. Placing an order isn't wired
// to the database yet; on previews it opens the sample order page instead.
import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { CapacityIndicator } from '@/components/ss';
import { getOrderFormData, SAMPLE_ORDER_NUMBER } from '@/lib/data';
import { site } from '@/lib/site';
import { OrderForm } from './OrderForm';

export const metadata: Metadata = { title: 'Order egg tarts — Sunday Sieve' };

export default async function OrderPage({ searchParams }: { searchParams: Promise<{ state?: string; add?: string }> }) {
  const { state, add } = await searchParams;
  const data = await getOrderFormData(state);
  // Closed, sold out or nothing scheduled: the landing page explains why.
  if (!data?.bakeDay) redirect(state ? `/?state=${encodeURIComponent(state)}` : '/');
  const { bakeDay, products, pickupArea, settings } = data;
  const back = state ? `/?state=${encodeURIComponent(state)}` : '/';

  return (
    <div className="pg">
      <header className="wrap topbar">
        <Link className="topbar__link" href={back}>← Back</Link>
        <Link href={back}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/brand/lockup.png" alt="Sunday Sieve home" width={112} height={56} />
        </Link>
      </header>
      <main className="wrap stack">
        <header className="sec sec--tight">
          <h1 className="h1">Your order</h1>
          <p className="lead">
            For <strong>{bakeDay.bakeDateLabel}</strong>, pickup {bakeDay.pickupWindowLabel} in {pickupArea}.
          </p>
          <div className="narrow"><CapacityIndicator remaining={bakeDay.remainingTarts} capacity={bakeDay.capacityTarts} /></div>
          <p className="muted">Orders close {bakeDay.cutoffLabel}.</p>
        </header>
        <OrderForm
          products={products}
          initialProductId={products.some((p) => p.id === add) ? add : undefined}
          faqHref={state ? `/?state=${encodeURIComponent(state)}#questions` : '/#questions'}
          remainingTarts={bakeDay.remainingTarts}
          maxTartsPerOrder={settings.maxTartsPerOrder}
          autoCancelHours={settings.autoCancelHours}
          cutoffAt={bakeDay.cutoffAt}
          messengerUrl={site.messengerUrl}
          sampleOrderHref={`/orders/${SAMPLE_ORDER_NUMBER}?state=awaiting`}
        />
      </main>
    </div>
  );
}
