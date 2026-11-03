// Sample data for the component preview page, taken from the design system and canvas.
import type { PaymentMethod } from '@/components/ss';

export const sampleProducts = [
  { key: 'snack', name: 'The Sunday Snack', subtitle: 'Box of 4', tartCount: 4, priceCentavos: 22000 },
  { key: 'picnic', name: 'The Picnic Pack', subtitle: 'Box of 6', tartCount: 6, priceCentavos: 31500 },
  { key: 'brunch', name: 'The Family Brunch', subtitle: 'Box of 12', tartCount: 12, priceCentavos: 60000 },
];

// QR images are uploaded in admin; until then the cards show a placeholder.
export const sampleMethods: PaymentMethod[] = [
  { provider: 'GCash', accountName: 'PA*****A N.', accountHint: '099• ••••507' },
  { provider: 'BDO', accountName: 'Pat', accountHint: '•••• 2714' },
  { provider: 'BPI', accountName: 'Pat', accountHint: '•••• 839' },
  { provider: 'SeaBank', accountName: 'Patricia Navarro', accountHint: '•••• 2038' },
];

export const sampleItems = [{ name: 'The Picnic Pack (Box of 6)', quantity: 2, lineTotal: '₱630.00' }];
