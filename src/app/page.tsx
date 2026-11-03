// Placeholder until the landing page (TDD §9.1) is built.
export default function Home() {
  return (
    <main style={{ maxWidth: 480, margin: '0 auto', padding: '40px 16px', textAlign: 'center' }}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/brand/lockup.png" alt="Sunday Sieve" width={220} style={{ height: 'auto' }} />
      <h1 className="heading-1" style={{ color: 'var(--ink-brand)' }}>Pre-orders opening soon</h1>
      <p>Homemade egg tarts, baked in small batches on weekends.</p>
    </main>
  );
}
