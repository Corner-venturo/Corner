const { createClient } = require('@supabase/supabase-js')

const supabase = createClient(
  'https://pfqvdacxowpgfamuvnsn.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBmcXZkYWN4b3dwZ2ZhbXV2bnNuIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1OTEwODMyMCwiZXhwIjoyMDc0Njg0MzIwfQ.kbJbdYHtOWudBGzV3Jv5OWzWQQZT4aBFFgfUczaVdIE'
)

async function updateCountries() {
  // 1. 新增沙烏地阿拉伯
  const { error: insertError } = await supabase
    .from('countries')
    .upsert({
      id: 'saudi_arabia',
      name: '沙烏地阿拉伯',
      name_en: 'Saudi Arabia',
      region: '中東'
    }, { onConflict: 'id' })

  if (insertError) {
    console.log('新增沙烏地阿拉伯錯誤:', insertError.message)
  } else {
    console.log('✅ 已新增沙烏地阿拉伯')
  }

  // 2. 更新所有現有國家的 region 和 name_en
  const updates = [
    { id: 'china', name: '中國', name_en: 'China', region: '東亞' },
    { id: 'japan', name: '日本', name_en: 'Japan', region: '東亞' },
    { id: 'korea', name: '韓國', name_en: 'South Korea', region: '東亞' },
    { id: 'thailand', name: '泰國', name_en: 'Thailand', region: '東南亞' },
    { id: 'vietnam', name: '越南', name_en: 'Vietnam', region: '東南亞' },
    { id: 'philippines', name: '菲律賓', name_en: 'Philippines', region: '東南亞' },
    { id: 'france', name: '法國', name_en: 'France', region: '歐洲' },
    { id: 'egypt', name: '埃及', name_en: 'Egypt', region: '中東' },
    { id: 'turkey', name: '土耳其', name_en: 'Turkey', region: '中東' }
  ]

  for (const country of updates) {
    const { error } = await supabase
      .from('countries')
      .update({ name_en: country.name_en, region: country.region })
      .eq('id', country.id)

    if (error) {
      console.log('更新 ' + country.name + ' 錯誤:', error.message)
    } else {
      console.log('✅ 已更新 ' + country.name + ' -> region: ' + country.region)
    }
  }

  // 3. 查看最終結果
  const { data: countries } = await supabase
    .from('countries')
    .select('*')
    .order('region, name')

  console.log('')
  console.log('========================================')
  console.log('  國家資料表最終狀態')
  console.log('========================================')

  let currentRegion = ''
  countries.forEach(c => {
    if (c.region !== currentRegion) {
      currentRegion = c.region
      console.log('')
      console.log('【' + currentRegion + '】')
    }
    console.log('  ' + c.id.padEnd(15) + ' | ' + c.name.padEnd(8) + ' | ' + (c.name_en || ''))
  })
}

updateCountries()
