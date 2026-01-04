import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  'https://pfqvdacxowpgfamuvnsn.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBmcXZkYWN4b3dwZ2ZhbXV2bnNuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkxMDgzMjAsImV4cCI6MjA3NDY4NDMyMH0.LIMG0qmHixTPcbdzJrh4h0yTp8mh3FlggeZ6Bi_NwtI'
)

async function main() {
  // 檢查 airport_images
  const { data: images, error: imgError } = await supabase
    .from('airport_images')
    .select('airport_code, image_url, label')

  console.log('=== airport_images 表 ===')
  if (imgError) {
    console.log('Error:', imgError.message)
  } else if (!images || images.length === 0) {
    console.log('⚠️ 沒有任何圖片！')
  } else {
    console.log('共 ' + images.length + ' 張圖片')
    const byCode: Record<string, number> = {}
    images.forEach((img: { airport_code: string }) => {
      byCode[img.airport_code] = (byCode[img.airport_code] || 0) + 1
    })
    Object.entries(byCode).forEach(([code, count]) => {
      console.log('  - ' + code + ': ' + count + ' 張')
    })
  }
  console.log('')

  const { data: cities, error } = await supabase
    .from('cities')
    .select('name, airport_code, is_major, is_active')
    .order('name')

  if (error) {
    console.error('Error:', error)
    return
  }

  console.log('=== 主要城市 (is_major=true) ===')
  const majorCities = cities.filter((c: { is_major: boolean }) => c.is_major)
  majorCities.forEach((c: { name: string; airport_code: string | null }) => {
    console.log('  - ' + c.name + ' (' + (c.airport_code || '無機場代碼') + ')')
  })

  console.log('\n=== 非主要城市 ===')
  const nonMajorCities = cities.filter((c: { is_major: boolean }) => !c.is_major)
  nonMajorCities.forEach((c: { name: string; airport_code: string | null }) => {
    console.log('  - ' + c.name + ' (' + (c.airport_code || '無') + ')')
  })

  console.log('\n總共: ' + cities.length + ' 個城市, ' + majorCities.length + ' 個主要城市')
}

main()
