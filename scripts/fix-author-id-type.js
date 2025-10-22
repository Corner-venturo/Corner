// 修正 messages 表的 author_id 類型
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ 缺少 Supabase 環境變數');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function fixAuthorIdType() {
  console.log('🔧 開始修正 author_id 欄位類型...\n');

  try {
    // 注意：Supabase JS 客戶端無法直接執行 ALTER TABLE
    // 需要使用 Supabase Dashboard 的 SQL Editor 執行以下 SQL：

    const sql = `
-- 1. 移除外鍵約束
ALTER TABLE messages DROP CONSTRAINT IF EXISTS messages_author_id_fkey;
ALTER TABLE bulletins DROP CONSTRAINT IF EXISTS bulletins_author_id_fkey;

-- 2. 修改欄位類型為 TEXT
ALTER TABLE messages ALTER COLUMN author_id TYPE TEXT USING author_id::text;
ALTER TABLE bulletins ALTER COLUMN author_id TYPE TEXT USING author_id::text;

-- 3. 更新索引（如果需要）
-- 索引會自動適應新的類型

-- 完成！
SELECT 'author_id 類型已修改為 TEXT' as status;
    `;

    console.log('📝 請在 Supabase Dashboard 的 SQL Editor 執行以下 SQL：');
    console.log('='.repeat(60));
    console.log(sql);
    console.log('='.repeat(60));
    console.log('');
    console.log('或者使用以下連結：');
    console.log(`${supabaseUrl.replace('/rest/v1', '')}/project/_/sql`);
    console.log('');

    // 寫入 SQL 檔案
    const fs = require('fs');
    const path = require('path');
    const migrationPath = path.join(__dirname, '../supabase/migrations/fix_author_id_type.sql');

    fs.writeFileSync(migrationPath, sql);
    console.log(`✅ SQL 已儲存到: ${migrationPath}`);
    console.log('');
    console.log('⚠️  注意：由於 Supabase JS 客戶端限制，請手動執行此 SQL');

  } catch (error) {
    console.error('❌ 執行失敗:', error.message);
    process.exit(1);
  }
}

fixAuthorIdType();
