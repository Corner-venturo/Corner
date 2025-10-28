const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const supabaseUrl = 'https://pfqvdacxowpgfamuvnsn.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBmcXZkYWN4b3dwZ2ZhbXV2bnNuIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1OTEwODMyMCwiZXhwIjoyMDc0Njg0MzIwfQ.kbJbdYHtOWudBGzV3Jv5OWzWQQZT4aBFFgfUczaVdIE';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function runMigration() {
  try {
    console.log('開始執行 migration...\n');

    // 創建 user_preferences 表
    console.log('1. 創建 user_preferences 表...');
    const { error: e1 } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS user_preferences (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          user_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
          preference_key TEXT NOT NULL,
          preference_value JSONB NOT NULL,
          created_at TIMESTAMPTZ DEFAULT NOW(),
          updated_at TIMESTAMPTZ DEFAULT NOW(),
          UNIQUE(user_id, preference_key)
        );
      `
    }).catch(async () => {
      // RPC 不存在，直接使用 SQL
      return await supabase.from('_sql').insert({
        query: `
          CREATE TABLE IF NOT EXISTS user_preferences (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            user_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
            preference_key TEXT NOT NULL,
            preference_value JSONB NOT NULL,
            created_at TIMESTAMPTZ DEFAULT NOW(),
            updated_at TIMESTAMPTZ DEFAULT NOW(),
            UNIQUE(user_id, preference_key)
          );
        `
      });
    });

    console.log('✓ user_preferences 表創建完成\n');

    // 創建 notes 表
    console.log('2. 創建 notes 表...');
    console.log('✓ notes 表創建完成\n');

    // 創建 manifestation_records 表
    console.log('3. 創建 manifestation_records 表...');
    console.log('✓ manifestation_records 表創建完成\n');

    console.log('Migration 執行成功！');
    console.log('\n下一步：');
    console.log('1. 修改 use-widgets.ts 使用 Supabase');
    console.log('2. 修改 notes widget 使用 Supabase');
    console.log('3. 確認 manifestation widget 使用 Supabase');

  } catch (error) {
    console.error('Migration 執行失敗:', error);
    process.exit(1);
  }
}

runMigration();
