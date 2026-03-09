import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import postgres from 'postgres'
dotenv.config({ path: '.env.local' })

// 用 Supabase 的 postgres 連線執行 SQL
const databaseUrl = process.env.DATABASE_URL || process.env.SUPABASE_DB_URL

async function execute() {
  if (!databaseUrl) {
    console.log('⚠️ 沒有 DATABASE_URL，嘗試用 REST API...')

    // 用 REST API 嘗試直接操作
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // 先試著讀取看看欄位是否存在
    const { data, error } = await supabase
      .from('ref_airports')
      .select('iata_code, is_favorite')
      .limit(1)

    if (error && error.message.includes('is_favorite')) {
      console.log('❌ is_favorite 欄位不存在，需要手動在 Supabase Dashboard 執行 SQL')
      console.log('\n請到 Supabase Dashboard → SQL Editor 執行：')
      console.log('─'.repeat(50))
      console.log(`
ALTER TABLE ref_airports 
ADD COLUMN IF NOT EXISTS is_favorite BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS usage_count INTEGER DEFAULT 0;
`)
      console.log('─'.repeat(50))
      return
    }

    if (!error) {
      console.log('✅ is_favorite 欄位已存在！')

      // 標記常用機場
      const favCodes = ['KMQ', 'KIX', 'HKG', 'NRT', 'FUK', 'SFO', 'DAD', 'PUS', 'HRB', 'HND', 'XMN']

      const { error: updateError } = await supabase
        .from('ref_airports')
        .update({ is_favorite: true })
        .in('iata_code', favCodes)

      if (updateError) {
        console.log('❌ 標記失敗:', updateError.message)
      } else {
        console.log(`✅ 已標記 ${favCodes.length} 個常用機場`)

        // 驗證
        const { data: favs } = await supabase
          .from('ref_airports')
          .select('iata_code, name_zh, is_favorite')
          .eq('is_favorite', true)

        console.log('\n常用機場:')
        favs?.forEach(f => console.log(`  ★ ${f.iata_code} - ${f.name_zh}`))
      }
    }
    return
  }

  // 如果有 DATABASE_URL，直接用 postgres
  console.log('📡 使用 postgres 連線...')
  const sql = postgres(databaseUrl)

  try {
    await sql`
      ALTER TABLE ref_airports 
      ADD COLUMN IF NOT EXISTS is_favorite BOOLEAN DEFAULT false;
    `
    await sql`
      ALTER TABLE ref_airports 
      ADD COLUMN IF NOT EXISTS usage_count INTEGER DEFAULT 0;
    `
    console.log('✅ 欄位已新增')

    await sql`
      UPDATE ref_airports SET is_favorite = true 
      WHERE iata_code IN ('KMQ', 'KIX', 'HKG', 'NRT', 'FUK', 'SFO', 'DAD', 'PUS', 'HRB', 'HND', 'XMN');
    `
    console.log('✅ 常用機場已標記')

    await sql.end()
  } catch (e) {
    console.error('❌ 錯誤:', e)
    await sql.end()
  }
}

execute()
