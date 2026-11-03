// Public site facts that aren't in the database. Set them in .env.local.
export const site = {
  url: process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000',
  facebookUrl: process.env.NEXT_PUBLIC_FACEBOOK_URL ?? 'https://www.facebook.com/',
  messengerUrl: process.env.NEXT_PUBLIC_MESSENGER_URL ?? 'https://m.me/',
  contactNumber: process.env.NEXT_PUBLIC_CONTACT_NUMBER ?? '[contact number]',
};
