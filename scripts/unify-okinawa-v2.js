/**
 * 統一沖繩地區城市 ID v2
 * 先刪除重複，再更新城市 ID
 */

const { createClient } = require('@supabase/supabase-js')
const supabase = createClient(
  'https://pfqvdacxowpgfamuvnsn.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBmcXZkYWN4b3dwZ2ZhbXV2bnNuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkxMDgzMjAsImV4cCI6MjA3NDY4NDMyMH0.LIMG0qmHixTPcbdzJrh4h0yTp8mh3FlggeZ6Bi_NwtI'
)

const OKINAWA_UUID_CITIES = [
  '93d7cea0-67ac-406a-a916-c8e0f278c122',
  '90a2fbf4-0702-4d6e-af28-cd6a924d1b7e',
  '613b1dcb-49d5-4933-ba9f-839d218a5031',
]

function getCompletenessScore(a) {
  let score = 0
  if (a.description && a.description.length > 10) score += 3
  if (a.notes && a.notes.length > 10) score += 2
  if (a.images && a.images.length > 0) score += 2
  if (a.thumbnail) score += 1
  if (a.duration_minutes) score += 1
  if (a.opening_hours) score += 1
  if (a.tags && a.tags.length > 0) score += 1
  if (a.category) score += 1
  return score
}

function normalizeNameForMatch(name) {
  return name
    .toLowerCase()
    .replace(/\s+/g, '')
    .replace(/（.*?）/g, '')
    .replace(/\(.*?\)/g, '')
}

async function main() {
  console.log('🗾 統一沖繩地區城市 ID (v2)\n')
  console.log('='.repeat(60) + '\n')

  // 取得所有沖繩相關景點
  const { data: allOkinawa } = await supabase
    .from('attractions')
    .select('*')
    .eq('country_id', 'japan')
    .or(`city_id.eq.naha,city_id.eq.okinawa,city_id.in.(${OKINAWA_UUID_CITIES.join(',')})`)

  console.log(`📊 沖繩相關景點: ${allOkinawa.length} 筆\n`)

  // ===== 步驟 1: 找出跨城市重複並決定保留/刪除 =====
  console.log('='.repeat(60))
  console.log('【步驟 1】找出跨城市重複景點')
  console.log('='.repeat(60) + '\n')

  // 按正規化名稱分組（跨城市）
  const nameGroups = {}
  allOkinawa.forEach(a => {
    const key = normalizeNameForMatch(a.name)
    if (!nameGroups[key]) nameGroups[key] = []
    nameGroups[key].push(a)
  })

  const duplicates = Object.entries(nameGroups).filter(([_, items]) => items.length > 1)
  console.log(`發現 ${duplicates.length} 組跨城市重複:\n`)

  const toDelete = []
  const toUpdate = [] // { id, newCityId }

  for (const [key, items] of duplicates) {
    // 按完整度排序
    const scored = items.map(item => ({
      ...item,
      score: getCompletenessScore(item),
    }))
    scored.sort((a, b) => b.score - a.score)

    const keep = scored[0]
    const remove = scored.slice(1)

    console.log(`📍 「${keep.name}」`)
    console.log(`   保留: ${keep.city_id} - ID ${keep.id.slice(0, 8)}... (完整度: ${keep.score})`)

    // 確保保留的項目城市是 okinawa
    if (keep.city_id !== 'okinawa') {
      toUpdate.push({ id: keep.id, newCityId: 'okinawa' })
    }

    remove.forEach(r => {
      console.log(`   刪除: ${r.city_id} - ID ${r.id.slice(0, 8)}... (完整度: ${r.score})`)
      toDelete.push(r.id)
    })
    console.log('')
  }

  // ===== 步驟 2: 刪除重複 =====
  console.log('='.repeat(60))
  console.log('【步驟 2】刪除重複景點')
  console.log('='.repeat(60) + '\n')

  if (toDelete.length > 0) {
    console.log(`正在刪除 ${toDelete.length} 筆重複資料...`)
    const { error } = await supabase.from('attractions').delete().in('id', toDelete)

    if (error) console.error('❌ 錯誤:', error.message)
    else console.log('✅ 刪除完成\n')
  } else {
    console.log('沒有需要刪除的重複\n')
  }

  // ===== 步驟 3: 更新城市 ID =====
  console.log('='.repeat(60))
  console.log('【步驟 3】更新城市 ID 為 okinawa')
  console.log('='.repeat(60) + '\n')

  // 更新保留項目的城市 ID
  for (const { id, newCityId } of toUpdate) {
    const { error } = await supabase.from('attractions').update({ city_id: newCityId }).eq('id', id)

    if (error) console.error(`❌ ID ${id.slice(0, 8)}: ${error.message}`)
  }
  if (toUpdate.length > 0) {
    console.log(`✅ 更新 ${toUpdate.length} 筆保留項目的城市 ID\n`)
  }

  // 更新剩餘的 naha 景點
  const { data: remainingNaha } = await supabase
    .from('attractions')
    .select('id, name')
    .eq('city_id', 'naha')
    .eq('country_id', 'japan')

  if (remainingNaha && remainingNaha.length > 0) {
    console.log(`更新剩餘 naha 景點 (${remainingNaha.length} 筆)...`)
    remainingNaha.forEach(a => console.log(`  - ${a.name}`))

    const { error } = await supabase
      .from('attractions')
      .update({ city_id: 'okinawa' })
      .eq('city_id', 'naha')
      .eq('country_id', 'japan')

    if (error) console.error('❌ 錯誤:', error.message)
    else console.log('✅ 完成\n')
  }

  // 更新剩餘的 UUID 城市景點
  for (const uuid of OKINAWA_UUID_CITIES) {
    const { data: remaining } = await supabase
      .from('attractions')
      .select('id, name')
      .eq('city_id', uuid)

    if (remaining && remaining.length > 0) {
      console.log(`更新 UUID ${uuid.slice(0, 8)}... (${remaining.length} 筆)...`)
      remaining.forEach(a => console.log(`  - ${a.name}`))

      const { error } = await supabase
        .from('attractions')
        .update({ city_id: 'okinawa' })
        .eq('city_id', uuid)

      if (error) console.error('❌ 錯誤:', error.message)
      else console.log('✅ 完成\n')
    }
  }

  // ===== 總結 =====
  console.log('='.repeat(60))
  console.log('【總結】')
  console.log('='.repeat(60) + '\n')

  const { count: finalCount } = await supabase
    .from('attractions')
    .select('*', { count: 'exact', head: true })
    .eq('city_id', 'okinawa')

  const { count: nahaCount } = await supabase
    .from('attractions')
    .select('*', { count: 'exact', head: true })
    .eq('city_id', 'naha')

  console.log(`✅ 沖繩地區統一完成`)
  console.log(`   okinawa 景點數: ${finalCount} 筆`)
  console.log(`   naha 景點數: ${nahaCount} 筆`)
  console.log(`   刪除重複: ${toDelete.length} 筆`)
}

main().catch(console.error)
