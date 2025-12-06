const { createClient } = require('@supabase/supabase-js')

const supabase = createClient(
  'https://pfqvdacxowpgfamuvnsn.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBmcXZkYWN4b3dwZ2ZhbXV2bnNuIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1OTEwODMyMCwiZXhwIjoyMDc0Njg0MzIwfQ.kbJbdYHtOWudBGzV3Jv5OWzWQQZT4aBFFgfUczaVdIE'
)

async function addSaudiCities() {
  const cities = [
    { id: 'riyadh', name: '利雅德', name_en: 'Riyadh', country_id: 'saudi_arabia' },
    { id: 'jeddah', name: '吉達', name_en: 'Jeddah', country_id: 'saudi_arabia' },
    { id: 'mecca', name: '麥加', name_en: 'Mecca', country_id: 'saudi_arabia' },
    { id: 'medina', name: '麥地那', name_en: 'Medina', country_id: 'saudi_arabia' },
    { id: 'dammam', name: '達曼', name_en: 'Dammam', country_id: 'saudi_arabia' },
    { id: 'alula', name: '艾爾奧拉', name_en: 'AlUla', country_id: 'saudi_arabia' },
    { id: 'neom', name: 'NEOM未來城', name_en: 'NEOM', country_id: 'saudi_arabia' },
    { id: 'abha', name: '艾卜哈', name_en: 'Abha', country_id: 'saudi_arabia' },
    { id: 'taif', name: '塔伊夫', name_en: 'Taif', country_id: 'saudi_arabia' },
    { id: 'tabuk', name: '塔布克', name_en: 'Tabuk', country_id: 'saudi_arabia' }
  ]

  console.log('========================================')
  console.log('  新增沙烏地阿拉伯城市')
  console.log('========================================')
  console.log('')

  for (const city of cities) {
    const { error } = await supabase
      .from('cities')
      .upsert(city, { onConflict: 'id' })

    if (error) {
      console.log('❌ ' + city.name + ': ' + error.message)
    } else {
      console.log('✅ ' + city.name + ' (' + city.name_en + ')')
    }
  }

  // 查看結果
  const { data: saudiCities } = await supabase
    .from('cities')
    .select('*')
    .eq('country_id', 'saudi_arabia')
    .order('name')

  console.log('')
  console.log('========================================')
  console.log('  沙烏地阿拉伯城市列表 (' + saudiCities.length + ' 個)')
  console.log('========================================')
  saudiCities.forEach(c => {
    console.log('  ' + c.id.padEnd(12) + ' | ' + c.name + ' | ' + c.name_en)
  })
}

addSaudiCities()
