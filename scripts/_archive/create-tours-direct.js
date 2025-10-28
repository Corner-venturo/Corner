const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const supabaseUrl = 'https://pfqvdacxowpgfamuvnsn.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBmcXZkYWN4b3dwZ2ZhbXV2bnNuIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1OTEwODMyMCwiZXhwIjoyMDc0Njg0MzIwfQ.kbJbdYHtOWudBGzV3Jv5OWzWQQZT4aBFFgfUczaVdIE';

const supabase = createClient(supabaseUrl, supabaseKey, {
  db: { schema: 'public' },
  auth: { persistSession: false }
});

async function createToursTable() {
  console.log('🔄 建立 tours 表格...');

  // 直接使用 rpc 呼叫，如果有設定好的話
  const { data, error } = await supabase.rpc('exec_sql', {
    sql: `
      CREATE TABLE IF NOT EXISTS public.tours (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        code TEXT NOT NULL UNIQUE,
        name TEXT NOT NULL,
        location TEXT NOT NULL,
        departure_date TIMESTAMPTZ NOT NULL,
        return_date TIMESTAMPTZ NOT NULL,
        status TEXT NOT NULL DEFAULT 'draft',
        price NUMERIC NOT NULL DEFAULT 0,
        max_participants INTEGER NOT NULL DEFAULT 0,
        current_participants INTEGER DEFAULT 0,
        contract_status TEXT NOT NULL DEFAULT 'pending',
        total_revenue NUMERIC NOT NULL DEFAULT 0,
        total_cost NUMERIC NOT NULL DEFAULT 0,
        profit NUMERIC NOT NULL DEFAULT 0,
        description TEXT,
        archived BOOLEAN DEFAULT FALSE,
        features JSONB,
        quote_id UUID,
        quote_cost_structure JSONB,
        contract_template TEXT,
        contract_content TEXT,
        contract_created_at TIMESTAMPTZ,
        contract_notes TEXT,
        contract_completed BOOLEAN DEFAULT FALSE,
        contract_archived_date TIMESTAMPTZ,
        envelope_records TEXT,
        _needs_sync BOOLEAN DEFAULT FALSE,
        _synced_at TIMESTAMPTZ,
        _deleted BOOLEAN DEFAULT FALSE
      );
    `
  });

  if (error) {
    console.error('❌ 執行失敗:', error.message);
    console.log('\n📋 請手動在 Supabase Dashboard 執行 SQL:');
    console.log('👉 https://supabase.com/dashboard/project/pfqvdacxowpgfamuvnsn/sql/new');
    console.log('\nSQL 檔案位置:');
    console.log('/Users/william/Projects/venturo-new/supabase/migrations/20251025_create_tours_table.sql');
    return;
  }

  console.log('✅ tours 表格建立成功！');
}

createToursTable();
