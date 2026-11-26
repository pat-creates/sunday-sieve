// Public site facts that aren't in the database. Set them in .env.local and in Vercel.
// Anything left unset is simply not shown, so no placeholder text reaches customers.
export const site = {
  url: process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000',
  facebookUrl: process.env.NEXT_PUBLIC_FACEBOOK_URL ?? 'https://www.facebook.com/',
  messengerUrl: process.env.NEXT_PUBLIC_MESSENGER_URL ?? 'https://m.me/',
  contactNumber: process.env.NEXT_PUBLIC_CONTACT_NUMBER || null,
  /** FAQ answer for "What's in the tarts?"; the question is hidden until this is set. */
  allergens: process.env.NEXT_PUBLIC_ALLERGENS || null,
};
