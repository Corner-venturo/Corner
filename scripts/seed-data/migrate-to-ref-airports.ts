/**
 * 整合 tour_destinations 到 ref_airports
 * 
 * 1. 在 ref_airports 加入 is_favorite 欄位
 * 2. 把 tour_destinations 的資料標記為 favorite
 * 3. 確保所有資料對齊
 */

import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

async function migrate() {
  console.log('🔄 開始整合 tour_destinations → ref_airports\n')

  // 1. 檢查 is_favorite 欄位是否存在
  console.log('1️⃣ 檢查 is_favorite 欄位...')
  const { data: columns } = await supabase.rpc('get_table_columns', { 
    table_name: 'ref_airports' 
  }).single()
  
  // 直接嘗試新增欄位（如果已存在會失敗，沒關係）
  const { error: alterError } = await supabase.rpc('exec_sql', {
    sql: `ALTER TABLE ref_airports ADD COLUMN IF NOT EXISTS is_favorite BOOLEAN DEFAULT false`
  })
  
  if (alterError) {
    console.log('   ⚠️ 無法透過 RPC 新增欄位，需要手動在 Supabase 執行：')
    console.log('   ALTER TABLE ref_airports ADD COLUMN IF NOT EXISTS is_favorite BOOLEAN DEFAULT false;')
    console.log('   ALTER TABLE ref_airports ADD COLUMN IF NOT EXISTS usage_count INTEGER DEFAULT 0;')
    console.log('')
  } else {
    console.log('   ✅ is_favorite 欄位已新增')
  }

  // 2. 讀取現有 tour_destinations
  console.log('\n2️⃣ 讀取現有 tour_destinations...')
  const { data: destinations, error: destError } = await supabase
    .from('tour_destinations')
    .select('*')

  if (destError) {
    console.error('   ❌ 讀取失敗:', destError.message)
    return
  }

  console.log(`   找到 ${destinations?.length || 0} 筆目的地資料`)
  
  if (destinations && destinations.length > 0) {
    console.log('\n   現有目的地:')
    destinations.forEach(d => {
      console.log(`   - ${d.country} / ${d.city} (${d.airport_code})`)
    })
  }

  // 3. 比對並標記 ref_airports
  console.log('\n3️⃣ 比對 ref_airports 資料...')
  
  const airportCodes = destinations?.map(d => d.airport_code) || []
  
  if (airportCodes.length > 0) {
    // 檢查哪些存在於 ref_airports
    const { data: matchedAirports } = await supabase
      .from('ref_airports')
      .select('iata_code, name_zh, city_name_zh')
      .in('iata_code', airportCodes)
    
    console.log(`\n   匹配結果:`)
    const matched = matchedAirports?.map(a => a.iata_code) || []
    const notMatched = airportCodes.filter(code => !matched.includes(code))
    
    matchedAirports?.forEach(a => {
      console.log(`   ✅ ${a.iata_code} → ${a.name_zh || a.city_name_zh || '(無中文)'}`)
    })
    
    if (notMatched.length > 0) {
      console.log(`\n   ⚠️ 以下代碼不在 ref_airports 中:`)
      notMatched.forEach(code => console.log(`   - ${code}`))
    }
  }

  // 4. 產生整合 SQL
  console.log('\n4️⃣ 產生整合 SQL...')
  
  let sql = `-- 整合 tour_destinations 到 ref_airports
-- 執行於 Supabase SQL Editor

-- Step 1: 新增欄位（如果不存在）
ALTER TABLE ref_airports ADD COLUMN IF NOT EXISTS is_favorite BOOLEAN DEFAULT false;
ALTER TABLE ref_airports ADD COLUMN IF NOT EXISTS usage_count INTEGER DEFAULT 0;

-- Step 2: 標記常用機場
UPDATE ref_airports SET is_favorite = true WHERE iata_code IN (
${airportCodes.map(c => `  '${c}'`).join(',\n')}
);

-- Step 3: 驗證結果
SELECT iata_code, name_zh, city_name_zh, country_code, is_favorite 
FROM ref_airports 
WHERE is_favorite = true;
`

  console.log(sql)

  // 寫入檔案
  const fs = await import('fs')
  fs.writeFileSync('scripts/seed-data/integrate-airports.sql', sql)
  console.log('\n✅ SQL 已儲存到 scripts/seed-data/integrate-airports.sql')
  console.log('   請在 Supabase SQL Editor 執行')
}

migrate().catch(console.error)
