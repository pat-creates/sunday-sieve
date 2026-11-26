// Order form (TDD §9.2): box size → quantity → details. Placing an order isn't wired to the
// database yet; on previews it opens the sample order page instead.
import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { CapacityIndicator } from '@/components/ss';
import { getOrderFormData, SAMPLE_ORDER_NUMBER } from '@/lib/data';
import { site } from '@/lib/site';
import { OrderForm } from './OrderForm';

export const metadata: Metadata = { title: 'Order egg tarts — Sunday Sieve' };

export default async function OrderPage({ searchParams }: { searchParams: Promise<{ state?: string }> }) {
  const { state } = await searchParams;
  const data = await getOrderFormData(state);
  // Closed, sold out or nothing scheduled: the landing page explains why.
  if (!data?.bakeDay) redirect(state ? `/?state=${encodeURIComponent(state)}` : '/');
  const { bakeDay, products, pickupArea, settings } = data;
  const back = state ? `/?state=${encodeURIComponent(state)}` : '/';

  return (
    <div className="page page--compact">
      <nav className="page-nav" aria-label="Back">
        <Link className="page-nav__back" href={back}>← Back</Link>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img className="page-nav__logo" src="/brand/lockup.png" alt="Sunday Sieve" width={96} height={48} />
      </nav>

      <header className="page-header">
        <h1 className="h-page h-page--lg">Your order</h1>
        <p className="lead">
          For <strong>{bakeDay.bakeDateLabel}</strong>, pickup {bakeDay.pickupWindowLabel} in {pickupArea.split(',')[0]}.
        </p>
        <CapacityIndicator remaining={bakeDay.remainingTarts} capacity={bakeDay.capacityTarts} />
        <p className="fine">Orders close {bakeDay.cutoffLabel}.</p>
      </header>

      <OrderForm
        products={products}
        remainingTarts={bakeDay.remainingTarts}
        maxTartsPerOrder={settings.maxTartsPerOrder}
        autoCancelHours={settings.autoCancelHours}
        cutoffAt={bakeDay.cutoffAt}
        messengerUrl={site.messengerUrl}
        sampleOrderHref={`/orders/${SAMPLE_ORDER_NUMBER}?state=awaiting`}
      />
    </div>
  );
}
