INSERT INTO "User" ("email", "name") VALUES (
  'serviceaccount@0xmetalabs.com',
  'Service Account'
) ON CONFLICT DO NOTHING;
