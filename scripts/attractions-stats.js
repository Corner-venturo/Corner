const { createClient } = require('@supabase/supabase-js')

const supabase = createClient(
  'https://pfqvdacxowpgfamuvnsn.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBmcXZkYWN4b3dwZ2ZhbXV2bnNuIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1OTEwODMyMCwiZXhwIjoyMDc0Njg0MzIwfQ.kbJbdYHtOWudBGzV3Jv5OWzWQQZT4aBFFgfUczaVdIE'
)

async function showStats() {
  // 取得所有景點 (超過1000筆需要分頁)
  let allAttractions = []
  let page = 0
  const pageSize = 1000

  while (true) {
    const { data: attractions } = await supabase
      .from('attractions')
      .select('country_id, city_id, type')
      .range(page * pageSize, (page + 1) * pageSize - 1)

    if (!attractions || attractions.length === 0) break
    allAttractions = allAttractions.concat(attractions)
    if (attractions.length < pageSize) break
    page++
  }

  const attractions = allAttractions

  // 取得國家資料
  const { data: countries } = await supabase.from('countries').select('id, name, name_en, region')

  // 取得城市資料
  const { data: cities } = await supabase.from('cities').select('id, name, country_id')

  const countryMap = {}
  countries.forEach(c => {
    countryMap[c.id] = c
  })

  const cityMap = {}
  cities.forEach(c => {
    cityMap[c.id] = c
  })

  // 統計
  const countryStats = {}
  const cityStats = {}
  const typeStats = {}

  attractions.forEach(a => {
    // 國家統計
    if (!countryStats[a.country_id]) countryStats[a.country_id] = 0
    countryStats[a.country_id]++

    // 城市統計
    if (!cityStats[a.city_id]) cityStats[a.city_id] = { count: 0, country_id: a.country_id }
    cityStats[a.city_id].count++

    // 類型統計
    const type = a.type || 'attraction'
    if (!typeStats[type]) typeStats[type] = 0
    typeStats[type]++
  })

  console.log('╔══════════════════════════════════════════════════════════════╗')
  console.log('║              🌍 超完整旅遊景點資料庫統計                      ║')
  console.log('╚══════════════════════════════════════════════════════════════╝')
  console.log('')
  console.log('總景點數: ' + attractions.length + ' 個')
  console.log('')

  // 按區域分組顯示國家
  const regionGroups = {}
  Object.keys(countryStats).forEach(countryId => {
    const country = countryMap[countryId]
    if (country) {
      const region = country.region || '其他'
      if (!regionGroups[region]) regionGroups[region] = []
      regionGroups[region].push({
        id: countryId,
        name: country.name,
        count: countryStats[countryId],
      })
    }
  })

  console.log('┌──────────────────────────────────────────────────────────────┐')
  console.log('│  📊 各國家景點數量                                            │')
  console.log('└──────────────────────────────────────────────────────────────┘')

  const regionOrder = ['東亞', '東南亞', '中東', '歐洲', '其他']
  regionOrder.forEach(region => {
    if (regionGroups[region]) {
      console.log('')
      console.log('  【' + region + '】')
      regionGroups[region]
        .sort((a, b) => b.count - a.count)
        .forEach(c => {
          const bar = '█'.repeat(Math.floor(c.count / 10))
          console.log('    ' + c.name.padEnd(10) + ' ' + String(c.count).padStart(4) + ' 個 ' + bar)
        })
    }
  })

  console.log('')
  console.log('┌──────────────────────────────────────────────────────────────┐')
  console.log('│  🏙️ 熱門城市 TOP 20                                          │')
  console.log('└──────────────────────────────────────────────────────────────┘')

  const topCities = Object.entries(cityStats)
    .map(([cityId, data]) => ({
      id: cityId,
      name: cityMap[cityId]?.name || cityId,
      country: countryMap[data.country_id]?.name || data.country_id,
      count: data.count,
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 20)

  topCities.forEach((city, i) => {
    const rank = String(i + 1).padStart(2)
    const bar = '▓'.repeat(Math.floor(city.count / 2))
    console.log(
      '  ' +
        rank +
        '. ' +
        city.name.padEnd(12) +
        '(' +
        city.country.padEnd(6) +
        ') ' +
        String(city.count).padStart(3) +
        ' 個 ' +
        bar
    )
  })

  console.log('')
  console.log('┌──────────────────────────────────────────────────────────────┐')
  console.log('│  🏷️ 景點類型分布                                              │')
  console.log('└──────────────────────────────────────────────────────────────┘')

  const typeNames = {
    attraction: '🎯 景點',
    temple: '⛩️ 寺廟神社',
    heritage: '🏛️ 古蹟遺產',
    museum: '🖼️ 博物館',
    shopping: '🛍️ 購物',
    market: '🏪 市場夜市',
    park: '🌳 公園',
    beach: '🏖️ 海灘',
    landmark: '🗼 地標',
    viewpoint: '👀 觀景台',
    food: '🍽️ 米其林/美食',
    theme_park: '🎢 主題樂園',
    garden: '🌸 花園',
    experience: '✨ 深度體驗',
  }

  Object.entries(typeStats)
    .sort((a, b) => b[1] - a[1])
    .forEach(([type, count]) => {
      const name = typeNames[type] || type
      const bar = '░'.repeat(Math.floor(count / 5))
      console.log('  ' + name.padEnd(14) + ' ' + String(count).padStart(4) + ' 個 ' + bar)
    })

  console.log('')
  console.log('═══════════════════════════════════════════════════════════════')
  console.log('  資料庫更新時間: ' + new Date().toLocaleString('zh-TW'))
  console.log('═══════════════════════════════════════════════════════════════')
}

showStats()
