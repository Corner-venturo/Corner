const { createClient } = require('@supabase/supabase-js')
const supabase = createClient(
  'https://pfqvdacxowpgfamuvnsn.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBmcXZkYWN4b3dwZ2ZhbXV2bnNuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkxMDgzMjAsImV4cCI6MjA3NDY4NDMyMH0.LIMG0qmHixTPcbdzJrh4h0yTp8mh3FlggeZ6Bi_NwtI'
)

async function check() {
  const { data, count } = await supabase
    .from('attractions')
    .select('id, name, latitude, longitude, city_id, country_id', { count: 'exact' })
    .limit(2500)

  const total = count
  const withCoords = data.filter(a => a.latitude && a.longitude).length
  const withoutCoords = total - withCoords

  console.log('📊 景點經緯度統計\n')
  console.log('總景點數:', total)
  console.log('有經緯度:', withCoords, '(' + ((withCoords / total) * 100).toFixed(1) + '%)')
  console.log('缺經緯度:', withoutCoords, '(' + ((withoutCoords / total) * 100).toFixed(1) + '%)')

  // 按國家統計缺少經緯度的
  const missing = data.filter(a => a.latitude === null || a.longitude === null)
  const missingByCountry = {}
  missing.forEach(a => {
    missingByCountry[a.country_id] = (missingByCountry[a.country_id] || 0) + 1
  })

  if (Object.keys(missingByCountry).length > 0) {
    console.log('\n缺少經緯度的分佈:')
    Object.entries(missingByCountry)
      .sort((a, b) => b[1] - a[1])
      .forEach(([country, cnt]) => {
        console.log('  ' + country + ': ' + cnt + ' 筆')
      })

    console.log('\n缺少經緯度範例 (前15筆):')
    missing.slice(0, 15).forEach(a => {
      console.log('  - ' + a.name + ' (' + a.country_id + ' > ' + a.city_id + ')')
    })
  } else {
    console.log('\n✅ 所有景點都有經緯度！')
  }

  // 顯示有經緯度的範例
  console.log('\n有經緯度範例:')
  data
    .filter(a => a.latitude && a.longitude)
    .slice(0, 5)
    .forEach(a => {
      console.log('  - ' + a.name + ': ' + a.latitude + ', ' + a.longitude)
    })
}
check()
