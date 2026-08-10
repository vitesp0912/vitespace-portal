-- Optional: seed a sample invoice for test-client (no file yet).
-- After Vitespace uploads a PDF to R2, set file_url / file_name / file_size.

insert into invoices (
  id,
  client_id,
  number,
  title,
  amount,
  status,
  issued_at,
  due_at
) values (
  'inv_test_001',
  'test-client',
  'INV-TEST-001',
  'Portal test invoice',
  10000,
  'pending',
  current_date,
  current_date + 15
)
on conflict (id) do nothing;
