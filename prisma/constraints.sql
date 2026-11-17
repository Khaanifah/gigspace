-- Migrasi kedua: CHECK constraint yang tidak bisa ditulis di schema.prisma.
-- Ini lapis validasi ke-3 (database), independen dari Zod dan frontend.

ALTER TABLE "ticket_types"
  ADD CONSTRAINT "ticket_types_price_nonneg"    CHECK ("price" >= 0),
  ADD CONSTRAINT "ticket_types_quota_nonneg"    CHECK ("quota" >= 0),
  ADD CONSTRAINT "ticket_types_reserved_nonneg" CHECK ("reserved" >= 0),
  ADD CONSTRAINT "ticket_types_sold_nonneg"     CHECK ("sold" >= 0),
  -- inti anti-overselling: walau kode backend salah, DB menolak
  ADD CONSTRAINT "ticket_types_no_oversell"     CHECK ("reserved" + "sold" <= "quota"),
  ADD CONSTRAINT "ticket_types_sale_window"     CHECK ("sale_ends_at" > "sale_starts_at");

ALTER TABLE "events"
  ADD CONSTRAINT "events_date_order" CHECK ("ends_at" IS NULL OR "ends_at" >= "starts_at");

ALTER TABLE "orders"
  ADD CONSTRAINT "orders_amounts_nonneg" CHECK ("subtotal" >= 0 AND "service_fee" >= 0 AND "total" >= 0),
  ADD CONSTRAINT "orders_total_matches"  CHECK ("total" = "subtotal" + "service_fee");

ALTER TABLE "order_items"
  ADD CONSTRAINT "order_items_qty_positive"  CHECK ("quantity" > 0),
  ADD CONSTRAINT "order_items_price_nonneg"  CHECK ("unit_price_snapshot" >= 0);

ALTER TABLE "payments"
  ADD CONSTRAINT "payments_amount_positive" CHECK ("amount" > 0);

ALTER TABLE "payment_proofs"
  ADD CONSTRAINT "payment_proofs_size_limit" CHECK ("size_bytes" > 0 AND "size_bytes" <= 10485760),
  ADD CONSTRAINT "payment_proofs_mime"       CHECK ("mime_type" IN ('image/jpeg', 'image/png'));

ALTER TABLE "users"
  ADD CONSTRAINT "users_email_not_empty" CHECK (length(trim("email")) > 3);
