-- ============================================================
-- tour_itinerary_items: 核心表 — 一 row 走到底
-- Created: 2026-02-22
-- ============================================================

CREATE TABLE IF NOT EXISTS tour_itinerary_items (
  -- === 主鍵 & 關聯 ===
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tour_id         text REFERENCES tours(id),
  itinerary_id    text REFERENCES itineraries(id),
  workspace_id    uuid NOT NULL,

  -- === 行程欄位 ===
  day_number      integer,
  sort_order      integer DEFAULT 0,
  category        text,                -- transport / accommodation / meals / activities / others / guide / group-transport
  sub_category    text,                -- lunch / dinner / breakfast, etc.
  title           text,
  description     text,
  service_date    date,
  service_date_end date,
  resource_type   text,                -- attraction / restaurant / hotel
  resource_id     uuid,
  resource_name   text,
  latitude        numeric,
  longitude       numeric,
  google_maps_url text,

  -- === 報價欄位 ===
  unit_price      numeric,
  quantity        numeric,
  total_cost      numeric,
  currency        text DEFAULT 'TWD',
  pricing_type    text,                -- per_person / by_identity / fixed
  adult_price     numeric,
  child_price     numeric,
  infant_price    numeric,
  quote_note      text,
  quote_item_id   text,                -- 原 quote categories item id (for traceability)

  -- === 需求欄位 ===
  supplier_id     uuid,
  supplier_name   text,
  request_id      uuid REFERENCES tour_requests(id),
  request_status  text DEFAULT 'none', -- none / sent / replied / confirmed / cancelled
  request_sent_at timestamptz,
  request_reply_at timestamptz,
  reply_content   jsonb,
  reply_cost      numeric,
  estimated_cost  numeric,
  quoted_cost     numeric,

  -- === 確認欄位 ===
  confirmation_item_id uuid,           -- FK to tour_confirmation_items.id
  confirmed_cost  numeric,
  booking_reference text,
  booking_status  text,                -- pending / confirmed / cancelled
  confirmation_date timestamptz,
  confirmation_note text,

  -- === 領隊回填欄位 ===
  actual_expense  numeric,
  expense_note    text,
  expense_at      timestamptz,
  receipt_images  text[],

  -- === 狀態追蹤 ===
  quote_status        text DEFAULT 'none',        -- none / drafted / confirmed
  confirmation_status text DEFAULT 'none',        -- none / pending / confirmed
  leader_status       text DEFAULT 'none',        -- none / filled / reviewed

  -- === 元資料 ===
  created_at      timestamptz DEFAULT now(),
  updated_at      timestamptz DEFAULT now(),
  created_by      uuid
);

-- === Indexes ===
CREATE INDEX idx_tii_tour_id ON tour_itinerary_items(tour_id);
CREATE INDEX idx_tii_itinerary_id ON tour_itinerary_items(itinerary_id);
CREATE INDEX idx_tii_workspace_id ON tour_itinerary_items(workspace_id);
CREATE INDEX idx_tii_category ON tour_itinerary_items(category);
CREATE INDEX idx_tii_day_sort ON tour_itinerary_items(day_number, sort_order);
CREATE INDEX idx_tii_request_id ON tour_itinerary_items(request_id);
CREATE INDEX idx_tii_service_date ON tour_itinerary_items(service_date);

-- === RLS ===
ALTER TABLE tour_itinerary_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "tii_select" ON tour_itinerary_items
  FOR SELECT USING (is_super_admin() OR workspace_id::text = get_current_user_workspace()::text);

CREATE POLICY "tii_insert" ON tour_itinerary_items
  FOR INSERT WITH CHECK (is_super_admin() OR workspace_id::text = get_current_user_workspace()::text);

CREATE POLICY "tii_update" ON tour_itinerary_items
  FOR UPDATE USING (is_super_admin() OR workspace_id::text = get_current_user_workspace()::text);

CREATE POLICY "tii_delete" ON tour_itinerary_items
  FOR DELETE USING (is_super_admin() OR workspace_id::text = get_current_user_workspace()::text);

-- Updated_at trigger
CREATE OR REPLACE FUNCTION update_tii_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tii_updated_at
  BEFORE UPDATE ON tour_itinerary_items
  FOR EACH ROW EXECUTE FUNCTION update_tii_updated_at();
