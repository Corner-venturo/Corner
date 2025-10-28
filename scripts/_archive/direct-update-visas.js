/**
 * 直接透過 Supabase service_role key 更新 visas 表
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ 缺少 Supabase 環境變數');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function updateVisasTable() {
  console.log('🔧 開始更新 Supabase visas 表結構...\n');

  const sql = `
-- 先刪除舊的 visas 表
DROP TABLE IF EXISTS visas CASCADE;

-- 重新建立 visas 表
CREATE TABLE visas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  applicant_name VARCHAR(100) NOT NULL,
  contact_person VARCHAR(100) NOT NULL,
  contact_phone VARCHAR(50) NOT NULL,

  visa_type VARCHAR(100) NOT NULL,
  country VARCHAR(100) NOT NULL,

  status VARCHAR(20) DEFAULT '待送件',

  submission_date DATE,
  received_date DATE,
  pickup_date DATE,

  order_id UUID NOT NULL,
  order_number VARCHAR(50) NOT NULL,
  tour_id UUID NOT NULL REFERENCES tours(id) ON DELETE CASCADE,
  code VARCHAR(50) NOT NULL,

  fee NUMERIC(10, 2) DEFAULT 0,
  cost NUMERIC(10, 2) DEFAULT 0,

  note TEXT,
  created_by UUID,

  _needs_sync BOOLEAN DEFAULT FALSE,
  _synced_at TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT TRUE
);

CREATE INDEX idx_visas_tour_id ON visas(tour_id);
CREATE INDEX idx_visas_order_id ON visas(order_id);
CREATE INDEX idx_visas_status ON visas(status);
CREATE INDEX idx_visas_submission_date ON visas(submission_date);
CREATE INDEX idx_visas_applicant_name ON visas(applicant_name);
CREATE INDEX idx_visas_is_active ON visas(is_active);
CREATE INDEX idx_visas_needs_sync ON visas(_needs_sync);

DROP TRIGGER IF EXISTS update_visas_updated_at ON visas;
CREATE TRIGGER update_visas_updated_at
  BEFORE UPDATE ON visas
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
`;

  try {
    console.log('📝 執行 SQL...');

    // 方法1: 嘗試直接執行
    const { data, error } = await supabase.rpc('exec', { sql });

    if (error) {
      console.log('⚠️  方法1失敗，嘗試方法2...');

      // 方法2: 分段執行
      const statements = sql.split(';').filter(s => s.trim());

      for (const stmt of statements) {
        if (!stmt.trim()) continue;
        console.log(`\n執行: ${stmt.substring(0, 50)}...`);

        const { error: err } = await supabase.rpc('query', { sql: stmt });
        if (err) {
          console.error('❌ 執行失敗:', err.message);
        } else {
          console.log('✅ 成功');
        }
      }
    } else {
      console.log('✅ 全部執行成功！', data);
    }

  } catch (err) {
    console.error('❌ 錯誤:', err.message);
    console.log('\n💡 看起來需要 service_role key 才能執行 DDL');
    console.log('📝 請到 Supabase Dashboard 手動執行上面的 SQL\n');
  }
}

updateVisasTable();
