-- Demo data for Trellix. Statements are idempotent so the seed is safe to run against an
-- already-seeded database.
-- Password hashes are pbkdf2_sha256 (see app/utils/password-hash.ts):
--   danielle@trellix.dev   trellix123
--   marcus@trellix.dev     trellix123

insert or ignore into accounts (id, email, created_at) values
  ('6a1f7c4e-2b91-4f0a-9f2c-8a0e3d5b7c10', 'danielle@trellix.dev', 1726358400000),
  ('b83d9e52-7c14-4a6d-9e31-2f5c6a8d0b44', 'marcus@trellix.dev', 1727740800000);

insert or ignore into passwords (account_id, hash) values
  ('6a1f7c4e-2b91-4f0a-9f2c-8a0e3d5b7c10', 'pbkdf2_sha256$100000$Q23CmfvQNCFdpin2oCU2TQ$XbuCILQ3cF9IPXCEiKf_2lY5sQ1wtbZK2B8xojme6eM'),
  ('b83d9e52-7c14-4a6d-9e31-2f5c6a8d0b44', 'pbkdf2_sha256$100000$_DwnGMUTzrgHSZEN-eA7qA$MJJqpv5aCdOM7PpBvF-x1OvyQI_hTHAb2sDgbqphC9A');

insert or ignore into boards (id, name, color, created_at, account_id) values
  (1, 'Launch Checklist', '#cbd5e1', 1726358400000, '6a1f7c4e-2b91-4f0a-9f2c-8a0e3d5b7c10'),
  (2, 'Reading Queue', '#fbcfe8', 1726444800000, '6a1f7c4e-2b91-4f0a-9f2c-8a0e3d5b7c10'),
  (3, 'Marcus Only', '#bbf7d0', 1727740800000, 'b83d9e52-7c14-4a6d-9e31-2f5c6a8d0b44');

insert or ignore into columns (id, name, sort_order, board_id) values
  ('c1000000-0000-4000-8000-000000000001', 'Backlog', 1, 1),
  ('c1000000-0000-4000-8000-000000000002', 'In Progress', 2, 1),
  ('c1000000-0000-4000-8000-000000000003', 'Done', 3, 1),
  ('c2000000-0000-4000-8000-000000000001', 'Want to read', 1, 2),
  ('c2000000-0000-4000-8000-000000000002', 'Finished', 2, 2),
  ('c3000000-0000-4000-8000-000000000001', 'Private', 1, 3);

insert or ignore into items (id, title, content, sort_order, column_id, board_id) values
  ('i1000000-0000-4000-8000-000000000001', 'Write the launch post', null, 1, 'c1000000-0000-4000-8000-000000000001', 1),
  ('i1000000-0000-4000-8000-000000000002', 'Record the demo video', null, 2, 'c1000000-0000-4000-8000-000000000001', 1),
  ('i1000000-0000-4000-8000-000000000003', 'Audit the keyboard flows', null, 3, 'c1000000-0000-4000-8000-000000000001', 1),
  ('i1000000-0000-4000-8000-000000000004', 'Ship drag and drop', null, 1, 'c1000000-0000-4000-8000-000000000002', 1),
  ('i1000000-0000-4000-8000-000000000005', 'Pick the board colors', null, 1, 'c1000000-0000-4000-8000-000000000003', 1),
  ('i2000000-0000-4000-8000-000000000001', 'A Pattern Language', null, 1, 'c2000000-0000-4000-8000-000000000001', 2),
  ('i2000000-0000-4000-8000-000000000002', 'The Design of Everyday Things', null, 2, 'c2000000-0000-4000-8000-000000000001', 2),
  ('i3000000-0000-4000-8000-000000000001', 'Marcus private card', null, 1, 'c3000000-0000-4000-8000-000000000001', 3);
