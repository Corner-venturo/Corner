-- This script standardizes database column naming conventions across the board.
-- 1. Renames columns that use camelCase or concatenated lowercase (e.g., 'createdat') to snake_case.
-- 2. Renames columns with semantically similar but different names (e.g., 'author_id', 'creator') to a single standard ('created_by').
-- 3. This is a foundational step for the full codebase refactoring.

BEGIN;

-- == Section 1: Standardize creator/author columns to 'created_by' and 'updated_by' ==

-- Table: todos -> Has 'creator', 'created_by', 'updated_by'. 'creator' is redundant.
-- We rename it to a legacy field. Data will be migrated in a subsequent step if needed.
ALTER TABLE "public"."todos" RENAME COLUMN "creator" TO "created_by_legacy";
COMMENT ON COLUMN "public"."todos"."created_by_legacy" IS 'Legacy column for creator. Data to be migrated to created_by.';

-- Table: messages -> Has 'author_id' and 'created_by'. 'author_id' should be 'created_by'.
ALTER TABLE "public"."messages" RENAME COLUMN "author_id" TO "created_by_legacy_author";
COMMENT ON COLUMN "public"."messages"."created_by_legacy_author" IS 'Legacy author_id. Data to be migrated to created_by.';

-- Table: advance_lists -> Has 'author_id' and 'created_by'. 'author_id' should be 'created_by'.
ALTER TABLE "public"."advance_lists" RENAME COLUMN "author_id" TO "created_by_legacy_author";
COMMENT ON COLUMN "public"."advance_lists"."created_by_legacy_author" IS 'Legacy author_id. Data to be migrated to created_by.';

-- Table: bulletins -> Has 'author_id'. Should be 'created_by'.
ALTER TABLE "public"."bulletins" RENAME COLUMN "author_id" TO "created_by";

-- Table: itineraries -> Has 'creator_user_id' and 'created_by'. 'creator_user_id' is redundant.
ALTER TABLE "public"."itineraries" RENAME COLUMN "creator_user_id" TO "created_by_legacy_user_id";
COMMENT ON COLUMN "public"."itineraries"."created_by_legacy_user_id" IS 'Legacy creator_user_id. Data to be migrated to created_by.';

-- Table: quote_versions -> has 'createdby'
ALTER TABLE "public"."quote_versions" RENAME COLUMN "createdby" TO "created_by";


-- == Section 2: Fix tables with lowercase/camelCase-like names ==

-- Table: payments
ALTER TABLE "public"."payments" RENAME COLUMN "createdat" TO "created_at";
ALTER TABLE "public"."payments" RENAME COLUMN "updatedat" TO "updated_at";
ALTER TABLE "public"."payments" RENAME COLUMN "orderid" TO "order_id";
ALTER TABLE "public"."payments" RENAME COLUMN "tourid" TO "tour_id";
ALTER TABLE "public"."payments" RENAME COLUMN "paymentdate" TO "payment_date";
ALTER TABLE "public"."payments" RENAME COLUMN "paymentnumber" TO "payment_number";
ALTER TABLE "public"."payments" RENAME COLUMN "paymenttype" TO "payment_type";
ALTER TABLE "public"."payments" RENAME COLUMN "receivedby" TO "received_by";

-- Table: price_list_items
ALTER TABLE "public"."price_list_items" RENAME COLUMN "createdat" TO "created_at";
ALTER TABLE "public"."price_list_items" RENAME COLUMN "updatedat" TO "updated_at";
ALTER TABLE "public"."price_list_items" RENAME COLUMN "itemcode" TO "item_code";
ALTER TABLE "public"."price_list_items" RENAME COLUMN "itemname" TO "item_name";
ALTER TABLE "public"."price_list_items" RENAME COLUMN "minimumorder" TO "minimum_order";
ALTER TABLE "public"."price_list_items" RENAME COLUMN "supplierid" TO "supplier_id";
ALTER TABLE "public"."price_list_items" RENAME COLUMN "unitprice" TO "unit_price";
ALTER TABLE "public"."price_list_items" RENAME COLUMN "validfrom" TO "valid_from";
ALTER TABLE "public"."price_list_items" RENAME COLUMN "validuntil" TO "valid_until";

-- Table: quote_categories
ALTER TABLE "public"."quote_categories" RENAME COLUMN "createdat" TO "created_at";
ALTER TABLE "public"."quote_categories" RENAME COLUMN "updatedat" TO "updated_at";
ALTER TABLE "public"."quote_categories" RENAME COLUMN "quoteid" TO "quote_id";

-- Table: quote_versions (createdby was already handled)
ALTER TABLE "public"."quote_versions" RENAME COLUMN "createdat" TO "created_at";
ALTER TABLE "public"."quote_versions" RENAME COLUMN "quoteid" TO "quote_id";
ALTER TABLE "public"."quote_versions" RENAME COLUMN "changenote" TO "change_note";

-- Table: receipt_payment_items
ALTER TABLE "public"."receipt_payment_items" RENAME COLUMN "createdat" TO "created_at";
ALTER TABLE "public"."receipt_payment_items" RENAME COLUMN "itemname" TO "item_name";
ALTER TABLE "public"."receipt_payment_items" RENAME COLUMN "receiptid" TO "receipt_id";

-- Table: tour_refunds
ALTER TABLE "public"."tour_refunds" RENAME COLUMN "createdat" TO "created_at";
ALTER TABLE "public"."tour_refunds" RENAME COLUMN "updatedat" TO "updated_at";
ALTER TABLE "public"."tour_refunds" RENAME COLUMN "memberid" TO "member_id";
ALTER TABLE "public"."tour_refunds" RENAME COLUMN "orderid" TO "order_id";
ALTER TABLE "public"."tour_refunds" RENAME COLUMN "processedby" TO "processed_by";
ALTER TABLE "public"."tour_refunds" RENAME COLUMN "processingstatus" TO "processing_status";
ALTER TABLE "public"."tour_refunds" RENAME COLUMN "refundamount" TO "refund_amount";
ALTER TABLE "public"."tour_refunds" RENAME COLUMN "refunddate" TO "refund_date";
ALTER TABLE "public"."tour_refunds" RENAME COLUMN "refundreason" TO "refund_reason";
ALTER TABLE "public"."tour_refunds" RENAME COLUMN "tourid" TO "tour_id";


-- == Section 3: Add missing standard audit columns ==
-- This section can be expanded after discussion to include adding created_by/updated_by to tables that lack them.
-- For now, we focus on renaming existing inconsistencies.
-- Example of what could be added:
-- ALTER TABLE "public"."some_table" ADD COLUMN "created_by" uuid REFERENCES "public"."employees"(id);
-- ALTER TABLE "public"."some_table" ADD COLUMN "updated_by" uuid REFERENCES "public"."employees"(id);


COMMIT;
