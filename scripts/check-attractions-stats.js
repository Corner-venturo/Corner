// 統計景點資料狀態
const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = 'https://pfqvdacxowpgfamuvnsn.supabase.co'
const supabaseKey =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBmcXZkYWN4b3dwZ2ZhbXV2bnNuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkxMDgzMjAsImV4cCI6MjA3NDY4NDMyMH0.LIMG0qmHixTPcbdzJrh4h0yTp8mh3FlggeZ6Bi_NwtI'
const supabase = createClient(supabaseUrl, supabaseKey)

async function checkStats() {
  console.log('景點資料庫統計\n================\n')

  // 總數
  const { count: total } = await supabase
    .from('attractions')
    .select('*', { count: 'exact', head: true })

  console.log(`📊 總景點數: ${total} 筆\n`)

  // 有深度資料的景點（有 notes 欄位）
  const { count: withNotes } = await supabase
    .from('attractions')
    .select('*', { count: 'exact', head: true })
    .not('notes', 'is', null)

  console.log(`✅ 已有深度資料 (有 notes): ${withNotes} 筆`)
  console.log(`📝 待優化 (無 notes): ${total - withNotes} 筆\n`)

  // 按國家統計
  console.log('按國家分佈:')
  const { data: countries } = await supabase.from('countries').select('id, name')

  for (const country of countries || []) {
    const { count } = await supabase
      .from('attractions')
      .select('*', { count: 'exact', head: true })
      .eq('country_id', country.id)

    if (count > 0) {
      // 計算有深度資料的數量
      const { count: withNotesCount } = await supabase
        .from('attractions')
        .select('*', { count: 'exact', head: true })
        .eq('country_id', country.id)
        .not('notes', 'is', null)

      console.log(`  ${country.name}: ${count} 筆 (深度資料: ${withNotesCount}筆)`)
    }
  }

  // 查看幾個有深度資料的範例
  console.log('\n\n深度資料範例:\n')
  const { data: samples } = await supabase
    .from('attractions')
    .select('name, description, duration_minutes, opening_hours, tags, notes')
    .not('notes', 'is', null)
    .limit(3)

  for (const s of samples || []) {
    console.log(`📍 ${s.name}`)
    console.log(`   描述: ${s.description?.substring(0, 80)}...`)
    console.log(`   遊玩時間: ${s.duration_minutes} 分鐘`)
    console.log(`   營業時間: ${s.opening_hours}`)
    console.log(`   標籤: ${s.tags?.slice(0, 5).join(', ')}...`)
    console.log(`   旅遊提示: ${s.notes?.substring(0, 60)}...`)
    console.log('')
  }
}

checkStats()
