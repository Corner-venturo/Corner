import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

async function run() {
  console.log('🔍 檢查 is_favorite 欄位...')

  // 嘗試讀取 is_favorite
  const { data, error } = await supabase
    .from('ref_airports')
    .select('iata_code, is_favorite')
    .eq('iata_code', 'NRT')
    .single()

  if (error) {
    console.log('❌ 欄位不存在或查詢失敗:', error.message)
    console.log('\n請到 Supabase Dashboard → SQL Editor 執行：')
    console.log(`
ALTER TABLE ref_airports ADD COLUMN is_favorite BOOLEAN DEFAULT false;
ALTER TABLE ref_airports ADD COLUMN usage_count INTEGER DEFAULT 0;
    `)
    return
  }

  console.log('✅ 欄位已存在！NRT.is_favorite =', data.is_favorite)

  // 標記常用機場
  console.log('\n📌 標記常用機場...')
  const favCodes = ['KMQ', 'KIX', 'HKG', 'NRT', 'FUK', 'SFO', 'DAD', 'PUS', 'HRB', 'HND', 'XMN']

  const { error: updateError } = await supabase
    .from('ref_airports')
    .update({ is_favorite: true })
    .in('iata_code', favCodes)

  if (updateError) {
    console.log('❌ 更新失敗:', updateError.message)
    return
  }

  console.log('✅ 標記完成！')

  // 驗證
  const { data: favs } = await supabase
    .from('ref_airports')
    .select('iata_code, name_zh')
    .eq('is_favorite', true)

  console.log(`\n★ 常用機場 (${favs?.length} 個):`)
  favs?.forEach(f => console.log(`  ${f.iata_code} - ${f.name_zh}`))
}

run()
