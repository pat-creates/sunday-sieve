import type { Metadata } from 'next';
import { Suspense } from 'react';
import { PreviewBar } from '@/components/PreviewBar';
import { previewsEnabled, SAMPLE_ORDER_NUMBER } from '@/lib/data';
import '@/styles/tokens.css';
import '@/styles/components.css';
import '@/styles/pages.css';

export const metadata: Metadata = {
  title: 'Sunday Sieve — homemade egg tarts',
  description: 'Homemade egg tarts, baked in small batches on weekends. Pre-order for pickup.',
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>
        {previewsEnabled ? (
          <Suspense fallback={null}>
            <PreviewBar sampleOrderNumber={SAMPLE_ORDER_NUMBER} />
          </Suspense>
        ) : null}
        {children}
      </body>
    </html>
  );
}
