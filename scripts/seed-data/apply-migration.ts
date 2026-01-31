import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

async function apply() {
  console.log('🔧 套用 migration...\n')

  // 嘗試直接 upsert 帶新欄位
  const testData = {
    iata_code: 'NRT',
    is_favorite: true,
    usage_count: 1
  }

  const { error } = await supabase
    .from('ref_airports')
    .update({ is_favorite: true, usage_count: 1 })
    .eq('iata_code', 'NRT')

  if (error) {
    if (error.message.includes('column') || error.message.includes('is_favorite')) {
      console.log('❌ is_favorite 欄位不存在')
      console.log('\n請在 Supabase SQL Editor 執行以下指令：')
      console.log('─'.repeat(50))
      console.log(`
ALTER TABLE ref_airports ADD COLUMN IF NOT EXISTS is_favorite BOOLEAN DEFAULT false;
ALTER TABLE ref_airports ADD COLUMN IF NOT EXISTS usage_count INTEGER DEFAULT 0;

UPDATE ref_airports SET is_favorite = true WHERE iata_code IN (
  'KMQ', 'KIX', 'HKG', 'NRT', 'FUK', 'SFO', 'DAD', 'PUS', 'HRB', 'HND', 'XMN'
);
`)
      console.log('─'.repeat(50))
    } else {
      console.log('❌ 其他錯誤:', error.message)
    }
    return
  }

  console.log('✅ is_favorite 欄位已存在，開始標記常用機場...')

  // 標記所有常用機場
  const favCodes = ['KMQ', 'KIX', 'HKG', 'NRT', 'FUK', 'SFO', 'DAD', 'PUS', 'HRB', 'HND', 'XMN']
  
  for (const code of favCodes) {
    await supabase
      .from('ref_airports')
      .update({ is_favorite: true })
      .eq('iata_code', code)
  }

  // 驗證
  const { data } = await supabase
    .from('ref_airports')
    .select('iata_code, name_zh, is_favorite')
    .eq('is_favorite', true)

  console.log(`\n✅ 已標記 ${data?.length || 0} 個常用機場`)
  data?.forEach(a => console.log(`   ${a.iata_code} - ${a.name_zh}`))
}

apply().catch(console.error)
