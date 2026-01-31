import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

async function run() {
  console.log('📊 設定初始 usage_count...')
  
  // 常用機場設定較高的 usage_count
  const initialCounts: Record<string, number> = {
    'NRT': 100,  // 東京成田
    'HND': 90,   // 東京羽田
    'KIX': 80,   // 大阪關西
    'FUK': 70,   // 福岡
    'KMQ': 60,   // 金澤/小松
    'HKG': 50,   // 香港
    'DAD': 40,   // 峴港
    'PUS': 30,   // 釜山
    'XMN': 20,   // 廈門
    'HRB': 10,   // 哈爾濱
    'SFO': 5,    // 舊金山
  }
  
  for (const [code, count] of Object.entries(initialCounts)) {
    const { error } = await supabase
      .from('ref_airports')
      .update({ usage_count: count })
      .eq('iata_code', code)
    
    if (error) {
      console.log(`❌ ${code}: ${error.message}`)
    } else {
      console.log(`✅ ${code}: usage_count = ${count}`)
    }
  }
  
  console.log('\n🎉 完成！')
}

run()
