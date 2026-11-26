// Landing page (TDD §9.1): the next bake day, the menu, how it works, pickup area and FAQ.
import Image from 'next/image';
import { BakeDayPanel, BoxSizeCard, Button, FaqItem, HowItWorks, PickupDetails, formatPeso } from '@/components/ss';
import { SiteFooter } from '@/components/SiteFooter';
import { getLandingData } from '@/lib/data';
import { site } from '@/lib/site';
import hero from '@/assets/hero-tarts-box.jpg';

export default async function Home({ searchParams }: { searchParams: Promise<{ state?: string }> }) {
  const { state } = await searchParams;
  const { bakeDay, products, pickupArea, settings } = await getLandingData(state);
  const taking = bakeDay?.state === 'open' && bakeDay.remainingTarts > 0;
  const orderHref = state ? `/order?state=${encodeURIComponent(state)}` : '/order';
  const weekday = bakeDay?.bakeDateLabel.split(',')[0];

  return (
    <div className="page">
      <header className="page-hero">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img className="page-hero__logo" src="/brand/lockup.png" alt="Sunday Sieve" width={220} height={109} />
        <h1 className="page-hero__title">Homemade egg tarts, baked in small batches on weekends.</h1>
        <Image className="page-hero__photo" src={hero} alt="Four golden egg tarts in a white box" priority
          sizes="(min-width: 560px) 528px, 100vw" placeholder="blur" />
      </header>

      {bakeDay ? (
        <BakeDayPanel
          state={bakeDay.remainingTarts <= 0 ? 'soldout' : bakeDay.state}
          bakeDate={bakeDay.bakeDateLabel}
          pickupWindow={bakeDay.pickupWindowLabel}
          cutoff={bakeDay.cutoffLabel}
          remaining={bakeDay.remainingTarts}
          capacity={bakeDay.capacityTarts}
          note={bakeDay.publicNote}
          orderHref={taking ? orderHref : undefined}
          followHref={taking ? undefined : site.facebookUrl}
          followLabel="Follow us on Facebook"
          headingLevel={2}
        />
      ) : (
        <BakeDayPanel state="none" followHref={site.facebookUrl} followLabel="Follow us on Facebook" headingLevel={2} />
      )}

      <section className="page-section" aria-labelledby="boxes">
        <h2 id="boxes" className="h-section">The boxes</h2>
        <p className="text">
          Every tart is baked the morning of pickup. Mix and match up to {settings.maxTartsPerOrder} tarts per order.
        </p>
        <div className="page-stack">
          {products.map((p) => (
            <BoxSizeCard key={p.id} layout="row" name={p.name} subtitle={p.subtitle} tartCount={p.tartCount}
              price={formatPeso(p.priceCentavos)} headingLevel={3} />
          ))}
        </div>
        {taking ? <Button variant="primary" size="lg" block href={orderHref}>Order for {weekday}</Button> : null}
      </section>

      <section className="page-section" aria-labelledby="how">
        <h2 id="how" className="h-section">How it works</h2>
        <HowItWorks />
      </section>

      <section className="page-section" aria-labelledby="pickup">
        <h2 id="pickup" className="h-section">Pickup</h2>
        <PickupDetails publicBlurb={pickupArea}
          pickupWindow={bakeDay ? `${bakeDay.bakeDateLabel} · ${bakeDay.pickupWindowLabel}` : undefined} headingLevel={3} />
      </section>

      <section className="page-section" style={{ gap: 8 }} aria-labelledby="faq">
        <h2 id="faq" className="h-section" style={{ marginBottom: 8 }}>Questions</h2>
        <FaqItem question="How do I pay?">
          <p>
            GCash, BDO, BPI or SeaBank. After you order, your order page shows the QR codes and the exact amount.
            Send the payment, then upload a screenshot of your receipt with its reference number.
          </p>
          <p>We’ll verify your payment {settings.verificationSlaText} — you’ll get an email.</p>
        </FaqItem>
        <FaqItem question="What if I’m late for pickup?">
          <p>Orders not collected by the end of the pickup window are forfeited and not refunded. If you can’t make it, message us before the window closes.</p>
        </FaqItem>
        <FaqItem question="Can I cancel my order?">
          <p>If you haven’t paid, there’s nothing to do: we hold your tarts until the payment deadline on your order page, then release them automatically.</p>
          <p>Paid orders can’t be cancelled, because we bake to order.</p>
        </FaqItem>
        <FaqItem question="What about refunds?">
          <p>If we have to cancel a paid order, we refund the full amount to the account you paid from within 3 days.</p>
        </FaqItem>
        {site.allergens ? (
          <FaqItem question="What’s in the tarts? (allergens)"><p>{site.allergens}</p></FaqItem>
        ) : null}
      </section>

      <SiteFooter center />
    </div>
  );
}
