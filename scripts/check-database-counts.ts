#!/usr/bin/env tsx
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  'https://pfqvdacxowpgfamuvnsn.supabase.co',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

async function checkCounts() {
  const { count: attractionsCount } = await supabase
    .from('attractions')
    .select('*', { count: 'exact', head: true })

  const { count: michelinCount } = await supabase
    .from('michelin_restaurants')
    .select('*', { count: 'exact', head: true })

  const { count: experiencesCount } = await supabase
    .from('premium_experiences')
    .select('*', { count: 'exact', head: true })

  console.log('📊 資料庫實際數量：')
  console.log(`  📍 景點：${attractionsCount} 筆`)
  console.log(`  ⭐ 米其林餐廳：${michelinCount} 筆`)
  console.log(`  ✨ 頂級體驗：${experiencesCount} 筆`)
  console.log(
    `  📊 總計：${(attractionsCount || 0) + (michelinCount || 0) + (experiencesCount || 0)} 筆`
  )
}

checkCounts()
