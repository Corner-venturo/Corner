-- ================================================================
-- 旅遊團檔案管理系統 - 建立表（簡化版）
-- ================================================================

-- 1. tour_requests 表
CREATE TABLE tour_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  tour_id TEXT NOT NULL REFERENCES tours(id) ON DELETE CASCADE,
  source_type VARCHAR(50),
  source_id UUID,
  code VARCHAR(50),
  request_type VARCHAR(50) NOT NULL,
  supplier_id UUID,
  supplier_name VARCHAR(255),
  supplier_contact TEXT,
  items JSONB NOT NULL DEFAULT '[]'::jsonb,
  status VARCHAR(50) NOT NULL DEFAULT '草稿',
  sent_at TIMESTAMPTZ,
  sent_via VARCHAR(50),
  sent_to TEXT,
  replied_at TIMESTAMPTZ,
  replied_by VARCHAR(255),
  confirmed_at TIMESTAMPTZ,
  confirmed_by UUID,
  closed_at TIMESTAMPTZ,
  closed_by UUID,
  close_note TEXT,
  note TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  created_by UUID,
  updated_at TIMESTAMPTZ DEFAULT now(),
  updated_by UUID
);

CREATE INDEX tour_requests_workspace_id_idx ON tour_requests(workspace_id);
CREATE INDEX tour_requests_tour_id_idx ON tour_requests(tour_id);
CREATE INDEX tour_requests_status_idx ON tour_requests(status);

-- 2. request_documents 表
CREATE TABLE request_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  request_id UUID NOT NULL REFERENCES tour_requests(id) ON DELETE CASCADE,
  document_type VARCHAR(50) NOT NULL,
  version VARCHAR(20) NOT NULL,
  file_name VARCHAR(255) NOT NULL,
  file_url TEXT NOT NULL,
  file_size INTEGER,
  mime_type VARCHAR(100),
  status VARCHAR(50) NOT NULL DEFAULT '草稿',
  sent_at TIMESTAMPTZ,
  sent_via VARCHAR(50),
  sent_to TEXT,
  received_at TIMESTAMPTZ,
  received_from VARCHAR(255),
  title VARCHAR(255),
  description TEXT,
  note TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  created_by UUID,
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE (request_id, version)
);

CREATE INDEX request_documents_workspace_id_idx ON request_documents(workspace_id);
CREATE INDEX request_documents_request_id_idx ON request_documents(request_id);

-- 3. tour_files 表
CREATE TABLE tour_files (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  tour_id TEXT NOT NULL REFERENCES tours(id) ON DELETE CASCADE,
  category VARCHAR(50) NOT NULL,
  related_request_id UUID REFERENCES tour_requests(id) ON DELETE SET NULL,
  related_item_id UUID,
  file_name VARCHAR(255) NOT NULL,
  file_url TEXT NOT NULL,
  file_size INTEGER,
  mime_type VARCHAR(100),
  title VARCHAR(255),
  description TEXT,
  tags TEXT[],
  note TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  created_by UUID,
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX tour_files_workspace_id_idx ON tour_files(workspace_id);
CREATE INDEX tour_files_tour_id_idx ON tour_files(tour_id);
CREATE INDEX tour_files_category_idx ON tour_files(category);
