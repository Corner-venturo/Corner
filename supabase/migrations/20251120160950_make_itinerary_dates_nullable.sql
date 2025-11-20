-- 讓行程表的日期欄位可以為 NULL
BEGIN;

ALTER TABLE itineraries 
  ALTER COLUMN departure_date DROP NOT NULL,
  ALTER COLUMN return_date DROP NOT NULL;

COMMIT;
