// Landing page (TDD §9.1), following the canvas's "Landing page" artboards: the hero with the next
// bake day, the menu, how it works, pickup area and FAQ. Two columns from 900px wide.
import Image from 'next/image';
import Link from 'next/link';
import { BakeDayBar, BakeDayPanel, BoxSizeCard, Button, FaqItem, HowItWorks, PickupDetails, formatPeso, orderLabel } from '@/components/ss';
import { SiteFooter } from '@/components/SiteFooter';
import { getLandingData } from '@/lib/data';
import { site } from '@/lib/site';
import hero from '@/assets/hero-tarts-box.jpg';

export default async function Home({ searchParams }: { searchParams: Promise<{ state?: string }> }) {
  const { state } = await searchParams;
  const { bakeDay, products, pickupArea, settings } = await getLandingData(state);
  const taking = bakeDay?.state === 'open' && bakeDay.remainingTarts > 0;
  const orderHref = (add?: string) => {
    const q = new URLSearchParams();
    if (state) q.set('state', state);
    if (add) q.set('add', add);
    return q.size ? `/order?${q}` : '/order';
  };
  // One label for the main order action everywhere on the page: "Order for Saturday".
  const orderCta = orderLabel(bakeDay?.bakeDateLabel);
  const town = pickupArea.split(',')[0];
  const panelState = !bakeDay ? 'none' : bakeDay.remainingTarts <= 0 ? 'soldout' : bakeDay.state;

  // While taking orders, each box links to the order form with that box already added.
  const boxes = (layout: 'row' | 'card') =>
    products.map((p) => (
      <BoxSizeCard key={p.id} layout={layout} name={p.name} subtitle={p.subtitle} tartCount={p.tartCount}
        price={formatPeso(p.priceCentavos)} headingLevel={3} href={taking ? orderHref(p.id) : undefined} />
    ));

  return (
    <div className="pg">
      <header className="wrap topbar">
        <Link href="/">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/brand/lockup.png" alt="Sunday Sieve home" width={132} height={66} />
        </Link>
        <nav className="links" aria-label="Main">
          <a href="#boxes">The boxes</a>
          <a href="#how">How it works</a>
          <a href="#questions">Questions</a>
        </nav>
        {taking ? <div className="desk"><Button variant="primary" href={orderHref()}>{orderCta}</Button></div> : null}
      </header>
      {/* Phones: the bake day in one line, so it's in the first screen above the photo. */}
      <div className="phone bar">
        <BakeDayBar state={panelState} bakeDate={bakeDay?.bakeDateShort} cutoff={bakeDay?.cutoffShort}
          remaining={bakeDay?.remainingTarts} orderHref={taking ? orderHref() : undefined}
          followHref={taking ? undefined : site.facebookUrl} />
      </div>

      <main className="wrap stack">
        <section className="hero" aria-labelledby="hero-title">
          <div className="hero-photo">
            <Image src={hero} alt="Four golden egg tarts in a white box" priority placeholder="blur" fill
              sizes="(min-width: 900px) 840px, 100vw" />
            <span className="sticker" aria-hidden="true">baked fresh to order</span>
          </div>
          <div className="hero-copy">
            <h1 id="hero-title" className="h1">Homemade egg tarts, baked in small batches.</h1>
            <p className="lead">
              Flaky crust, silky custard, baked the morning you pick up.{' '}
              {taking
                ? `Pre-order by ${bakeDay.cutoffWeekday}, then collect them warm in ${town} on ${bakeDay.bakeDateLabel.split(',')[0]}.`
                : `Pre-order before the cut-off, then collect them warm in ${town} on bake day.`}
            </p>
            <ul className="chips">
              <li>Pre-order only</li>
              <li>Pickup in {town}</li>
              <li>GCash or bank</li>
            </ul>
            {bakeDay ? (
              <BakeDayPanel
                state={panelState}
                bakeDate={bakeDay.bakeDateLabel}
                pickupWindow={bakeDay.pickupWindowLabel}
                cutoff={bakeDay.cutoffLabel}
                remaining={bakeDay.remainingTarts}
                capacity={bakeDay.capacityTarts}
                note={bakeDay.publicNote}
                orderHref={taking ? orderHref() : undefined}
                followHref={taking ? undefined : site.facebookUrl}
                followLabel="Follow us on Facebook"
                headingLevel={2}
              />
            ) : (
              <BakeDayPanel state="none" followHref={site.facebookUrl} followLabel="Follow us on Facebook" headingLevel={2} />
            )}
          </div>
        </section>

        <section className="sec" id="boxes" aria-labelledby="boxes-title">
          {taking ? (
            <div className="sec-head">
              <div className="sec">
                <h2 id="boxes-title" className="h2">The boxes</h2>
                <p className="text">Every tart is baked the morning of pickup. Mix and match up to {settings.maxTartsPerOrder} tarts per order.</p>
              </div>
              <div className="desk"><Button variant="primary" size="lg" href={orderHref()}>{orderCta}</Button></div>
            </div>
          ) : (
            <>
              <h2 id="boxes-title" className="h2">The boxes</h2>
              <p className="muted">The menu stays up between batches so you know what to look forward to.</p>
            </>
          )}
          <div className="boxes-rows phone">{boxes('row')}</div>
          <div className="boxes-cards desk">{boxes('card').map((b) => <div key={b.key}>{b}</div>)}</div>
          {taking ? <div className="phone"><Button variant="primary" size="lg" block href={orderHref()}>{orderCta}</Button></div> : null}
        </section>

        <section className="sec" id="how" aria-labelledby="how-title">
          <h2 id="how-title" className="h2">How it works</h2>
          <HowItWorks />
        </section>

        <div className="two">
          <section className="sec" aria-labelledby="pickup-title">
            <h2 id="pickup-title" className="h2">Pickup</h2>
            {/* The section heading already says "Pickup", so the card has no title of its own. */}
            <PickupDetails title="" publicBlurb={pickupArea}
              pickupWindow={bakeDay ? `On bake days · ${bakeDay.pickupWindowLabel}` : undefined} headingLevel={3} />
          </section>
          <section className="sec sec--faq" id="questions" aria-labelledby="faq-title">
            <h2 id="faq-title" className="h2 h2--faq">Questions</h2>
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
        </div>

        <SiteFooter logo />
      </main>
    </div>
  );
}
