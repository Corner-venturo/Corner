import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

async function check() {
  const { data } = await supabase
    .from('tour_destinations')
    .select('country, city, airport_code')
    .eq('country', '日本')
    .order('city')
  
  console.log('日本的 tour_destinations:')
  if (data && data.length > 0) {
    data.forEach(d => console.log(`  ${d.city} (${d.airport_code})`))
  } else {
    console.log('  (無資料)')
  }
  
  const { count } = await supabase
    .from('tour_destinations')
    .select('*', { count: 'exact', head: true })
  
  console.log(`\n總目的地數: ${count} 筆`)
}

check()
