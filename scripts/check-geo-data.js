const { createClient } = require('@supabase/supabase-js')

const supabase = createClient(
  'https://pfqvdacxowpgfamuvnsn.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBmcXZkYWN4b3dwZ2ZhbXV2bnNuIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1OTEwODMyMCwiZXhwIjoyMDc0Njg0MzIwfQ.kbJbdYHtOWudBGzV3Jv5OWzWQQZT4aBFFgfUczaVdIE'
)

async function check() {
  // 查看 countries 表
  const { data: countries, error: e1 } = await supabase
    .from('countries')
    .select('*')
    .order('name')

  console.log('=== 國家資料表 (countries) ===')
  if (e1) {
    console.log('錯誤:', e1.message)
  } else {
    console.log('總數:', countries.length)
    countries.forEach(c => {
      console.log(`  ${c.id} | ${c.name} | ${c.name_en || '-'} | 區域: ${c.region || '-'}`)
    })
  }

  // 查看 cities 表
  const { data: cities, error: e2 } = await supabase
    .from('cities')
    .select('id, name, name_en, country_id')
    .order('country_id, name')

  console.log('')
  console.log('=== 城市資料表 (cities) ===')
  if (e2) {
    console.log('錯誤:', e2.message)
  } else {
    console.log('總數:', cities.length)

    // 按國家分組
    const byCountry = {}
    cities.forEach(c => {
      if (!byCountry[c.country_id]) byCountry[c.country_id] = []
      byCountry[c.country_id].push(c)
    })

    Object.keys(byCountry).sort().forEach(countryId => {
      console.log(`\n【${countryId}】${byCountry[countryId].length} 個城市`)
      byCountry[countryId].forEach(c => {
        console.log(`  ${c.id} | ${c.name} | ${c.name_en || '-'}`)
      })
    })
  }

  // 檢查 attractions 用到的 country_id 和 city_id
  const { data: attractions } = await supabase
    .from('attractions')
    .select('country_id, city_id')

  const usedCountries = new Set()
  const usedCities = new Set()
  attractions.forEach(a => {
    usedCountries.add(a.country_id)
    usedCities.add(a.city_id)
  })

  console.log('')
  console.log('=== 景點實際使用的 country_id ===')
  console.log([...usedCountries].sort().join(', '))

  console.log('')
  console.log('=== 景點實際使用的 city_id ===')
  console.log([...usedCities].sort().join(', '))

  // 檢查有沒有缺失的對應
  const countryIds = new Set(countries ? countries.map(c => c.id) : [])
  const cityIds = new Set(cities ? cities.map(c => c.id) : [])

  const missingCountries = [...usedCountries].filter(id => !countryIds.has(id))
  const missingCities = [...usedCities].filter(id => !cityIds.has(id))

  if (missingCountries.length > 0) {
    console.log('')
    console.log('⚠️ 景點使用但 countries 表缺少的 country_id:')
    console.log(missingCountries.join(', '))
  }

  if (missingCities.length > 0) {
    console.log('')
    console.log('⚠️ 景點使用但 cities 表缺少的 city_id:')
    console.log(missingCities.join(', '))
  }
}

check()
