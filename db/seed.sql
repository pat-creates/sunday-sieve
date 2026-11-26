-- Launch menu, payment channels and pickup point (TDD §6 seed data).
-- Safe to run once on a fresh database. Bake days are created in admin;
-- `npm run db:seed-dev` adds a sample open bake day for local work.

INSERT INTO products (sort_order, name, subtitle, tart_count, price_centavos) VALUES
  (1, 'The Sunday Snack',  'Box of 4',  4,  22000),
  (2, 'The Picnic Pack',   'Box of 6',  6,  31500),
  (3, 'The Family Brunch', 'Box of 12', 12, 60000);

-- QR images are uploaded in admin (storage_path); until then the order page shows a placeholder.
INSERT INTO payment_qr_codes (sort_order, provider, account_name, account_hint) VALUES
  (1, 'GCash',   'PA*****A N.',      '099• ••••507'),
  (2, 'BDO',     'Pat',              '•••• 2714'),
  (3, 'BPI',     'Pat',              '•••• 839'),
  (4, 'SeaBank', 'Patricia Navarro', '•••• 2038');

INSERT INTO pickup_locations (label, public_blurb, full_address, map_url, instructions, contact_number) VALUES
  ('Main pickup point',
   'Cainta, Rizal',
   '[House no.] [Street], [Barangay], Cainta, Rizal',
   NULL,
   'Ring the bell at the green gate.',
   '[contact number]');
