import type { Metadata } from 'next';
import '@/styles/tokens.css';
import '@/styles/components.css';

export const metadata: Metadata = {
  title: 'Sunday Sieve',
  description: 'Homemade egg tarts, baked in small batches on weekends. Pre-order for pickup.',
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
