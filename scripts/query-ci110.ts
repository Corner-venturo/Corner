import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  'https://pfqvdacxowpgfamuvnsn.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBmcXZkYWN4b3dwZ2ZhbXV2bnNuIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1OTEwODMyMCwiZXhwIjoyMDc0Njg0MzIwfQ.kbJbdYHtOWudBGzV3Jv5OWzWQQZT4aBFFgfUczaVdIE'
)

async function main() {
  const id2 = 'b4e7e835-494e-4576-aadd-b6877b17541c'
  
  const { data } = await supabase
    .from('itineraries')
    .select('*')
    .eq('id', id2)
    .single()
    
  if (!data) {
    console.log('No data')
    return
  }
  
  // 找出哪個欄位包含 CI110
  console.log('=== 第二筆行程 CI110 資訊 ===\n')
  for (const [key, value] of Object.entries(data)) {
    const str = JSON.stringify(value)
    if (str && str.toUpperCase().includes('CI110')) {
      console.log('欄位:', key)
      console.log('內容:')
      console.log(JSON.stringify(value, null, 2))
    }
  }
}

main()
