import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

async function run() {
  console.log('🔧 執行整合...\n')

  // 1. 補充缺少的中文名稱
  console.log('1️⃣ 補充缺少的中文名稱...')
  const updates = [
    { iata_code: 'XMN', name_zh: '廈門高崎國際機場', city_name_zh: '廈門' },
    { iata_code: 'HRB', name_zh: '哈爾濱太平國際機場', city_name_zh: '哈爾濱' },
  ]

  for (const u of updates) {
    const { error } = await supabase
      .from('ref_airports')
      .update({ name_zh: u.name_zh, city_name_zh: u.city_name_zh })
      .eq('iata_code', u.iata_code)

    if (error) {
      console.log(`   ❌ ${u.iata_code}: ${error.message}`)
    } else {
      console.log(`   ✅ ${u.iata_code} → ${u.name_zh}`)
    }
  }

  // 2. 檢查結果
  console.log('\n2️⃣ 驗證常用機場資料...')
  const favCodes = ['KMQ', 'KIX', 'HKG', 'NRT', 'FUK', 'SFO', 'DAD', 'PUS', 'HRB', 'HND', 'XMN']

  const { data: airports } = await supabase
    .from('ref_airports')
    .select('iata_code, name_zh, city_name_zh, country_code')
    .in('iata_code', favCodes)

  console.log('\n   常用機場清單:')
  airports?.forEach(a => {
    const status = a.name_zh ? '✅' : '⚠️'
    console.log(
      `   ${status} ${a.iata_code} | ${a.country_code || '--'} | ${a.city_name_zh || '--'} | ${a.name_zh || '(無中文)'}`
    )
  })

  console.log('\n🎉 資料整合完成！')
  console.log('\n📋 下一步：')
  console.log('   1. 在 Supabase 執行 SQL 新增 is_favorite 欄位')
  console.log('   2. 修改 CountryAirportSelector 使用 ref_airports')
}

run().catch(console.error)
