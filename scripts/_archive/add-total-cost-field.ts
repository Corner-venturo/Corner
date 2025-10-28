/**
 * 新增 quotes.total_cost 欄位到 Supabase
 *
 * 執行方式：npx ts-node scripts/add-total-cost-field.ts
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://pfqvdacxowpgfamuvnsn.supabase.co';
const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBmcXZkYWN4b3dwZ2ZhbXV2bnNuIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1OTEwODMyMCwiZXhwIjoyMDc0Njg0MzIwfQ.kbJbdYHtOWudBGzV3Jv5OWzWQQZT4aBFFgfUczaVdIE';

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

async function addTotalCostField() {
  console.log('🔧 開始新增 quotes.total_cost 欄位...\n');

  const sqls = [
    // 1. 新增 total_cost 欄位
    `ALTER TABLE public.quotes ADD COLUMN IF NOT EXISTS total_cost NUMERIC(12, 2) DEFAULT 0;`,

    // 2. 新增其他缺少的欄位
    `ALTER TABLE public.quotes ADD COLUMN IF NOT EXISTS categories JSONB DEFAULT '[]';`,
    `ALTER TABLE public.quotes ADD COLUMN IF NOT EXISTS participant_counts JSONB DEFAULT '{}';`,
    `ALTER TABLE public.quotes ADD COLUMN IF NOT EXISTS selling_prices JSONB DEFAULT '{}';`,
    `ALTER TABLE public.quotes ADD COLUMN IF NOT EXISTS versions JSONB DEFAULT '[]';`,

    // 3. 新增索引
    `CREATE INDEX IF NOT EXISTS idx_quotes_total_cost ON public.quotes(total_cost);`,

    // 4. 新增註解
    `COMMENT ON COLUMN public.quotes.total_cost IS '總成本（前端計算的成本金額）';`,
    `COMMENT ON COLUMN public.quotes.categories IS '報價分類詳細資料（JSON 格式）';`,
    `COMMENT ON COLUMN public.quotes.participant_counts IS '參與人數統計（JSON 格式）';`,
    `COMMENT ON COLUMN public.quotes.selling_prices IS '銷售價格設定（JSON 格式）';`,
    `COMMENT ON COLUMN public.quotes.versions IS '歷史版本記錄（JSON 格式）';`,
  ];

  for (const sql of sqls) {
    try {
      const { data, error } = await supabase.rpc('exec_sql', { sql_query: sql });

      if (error) {
        console.error(`❌ 執行失敗: ${sql}`);
        console.error(`   錯誤: ${error.message}\n`);
      } else {
        console.log(`✅ 成功: ${sql.substring(0, 50)}...`);
      }
    } catch (err) {
      console.error(`❌ 執行失敗: ${sql}`);
      console.error(`   錯誤: ${err}\n`);
    }
  }

  // 驗證欄位是否存在
  console.log('\n🔍 驗證欄位...');
  const { data: quotes, error } = await supabase
    .from('quotes')
    .select('id, total_cost, categories')
    .limit(1);

  if (error) {
    console.error('❌ 驗證失敗:', error.message);
  } else {
    console.log('✅ 驗證成功！欄位已新增');
    console.log('   範例資料:', quotes);
  }

  console.log('\n✨ 完成！');
}

addTotalCostField().catch(console.error);
