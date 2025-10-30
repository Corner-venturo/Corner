import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'

config()

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

async function checkColumns() {
  console.log('\n=== Tours 表實際欄位 ===')
  const { data: tours, error: tourError } = await supabase.from('tours').select('*').limit(1)
  if (tourError) {
    console.log('錯誤:', tourError.message)
  } else if (tours && tours[0]) {
    console.log(Object.keys(tours[0]).sort().join('\n'))
  }

  console.log('\n=== Quotes 表實際欄位 ===')
  const { data: quotes, error: quoteError } = await supabase.from('quotes').select('*').limit(1)
  if (quoteError) {
    console.log('錯誤:', quoteError.message)
  } else if (quotes && quotes.length > 0) {
    console.log(Object.keys(quotes[0]).sort().join('\n'))
  } else {
    console.log('表為空，無法取得欄位')
  }
}

checkColumns()
