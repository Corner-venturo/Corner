const { createClient } = require('@supabase/supabase-js')

const supabase = createClient(
  'https://pfqvdacxowpgfamuvnsn.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBmcXZkYWN4b3dwZ2ZhbXV2bnNuIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1OTEwODMyMCwiZXhwIjoyMDc0Njg0MzIwfQ.kbJbdYHtOWudBGzV3Jv5OWzWQQZT4aBFFgfUczaVdIE'
)

async function analyze() {
  // 查看所有國家及其城市數量
  const { data: countries } = await supabase
    .from('countries')
    .select('id, name, emoji, has_regions')
    .order('display_order')

  const { data: cities } = await supabase
    .from('cities')
    .select('id, name, name_en, country_id, region_id, is_major')

  console.log('【各國城市統計】\n')

  for (const country of countries || []) {
    const countryCities = cities?.filter(c => c.country_id === country.id) || []
    const majorCount = countryCities.filter(c => c.is_major).length

    if (countryCities.length > 0) {
      const emoji = country.emoji || '🌍'
      console.log(emoji + ' ' + country.name + ' (' + country.id + ')')
      console.log('   城市數: ' + countryCities.length + ', 已標主要: ' + majorCount)
      console.log('   城市: ' + countryCities.map(c => c.name + (c.is_major ? '*' : '')).join(', '))
      console.log('')
    }
  }
}

analyze()
