const { createClient } = require('@supabase/supabase-js')

const supabase = createClient(
  'https://pfqvdacxowpgfamuvnsn.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBmcXZkYWN4b3dwZ2ZhbXV2bnNuIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1OTEwODMyMCwiZXhwIjoyMDc0Njg0MzIwfQ.kbJbdYHtOWudBGzV3Jv5OWzWQQZT4aBFFgfUczaVdIE'
)

async function checkAttractions() {
  const { data, error } = await supabase
    .from('attractions')
    .select('city_id, name')

  if (error) {
    console.error('Error:', error.message)
    return
  }

  const cityCount = {}
  const cityAttractions = {}
  data.forEach(a => {
    cityCount[a.city_id] = (cityCount[a.city_id] || 0) + 1
    if (!cityAttractions[a.city_id]) cityAttractions[a.city_id] = []
    cityAttractions[a.city_id].push(a.name)
  })

  // 只顯示中國城市
  const chinaCities = ['chengdu', 'chongqing', 'xian', 'dunhuang', 'changsha', 'shenzhen', 'guangzhou', 'shanghai', 'xiamen']

  const cityNames = {
    chengdu: '成都',
    chongqing: '重慶',
    xian: '西安',
    dunhuang: '敦煌/絲路',
    changsha: '長沙',
    shenzhen: '深圳',
    guangzhou: '廣州',
    shanghai: '上海',
    xiamen: '廈門'
  }

  console.log('==========================================')
  console.log('  中國城市景點資料庫統計')
  console.log('==========================================')
  console.log('')

  chinaCities.forEach(city => {
    if (cityCount[city]) {
      console.log(`【${cityNames[city]}】${cityCount[city]} 個景點`)
      cityAttractions[city].forEach(name => {
        console.log(`  · ${name}`)
      })
      console.log('')
    }
  })

  const chinaTotal = chinaCities.reduce((sum, c) => sum + (cityCount[c] || 0), 0)

  console.log('==========================================')
  console.log(`中國城市景點總計：${chinaTotal} 個`)
  console.log(`全部景點總計：${data.length} 個`)
  console.log('==========================================')
}

checkAttractions()
