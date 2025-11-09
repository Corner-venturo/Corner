/**
 * 清理重複的旅遊團資料
 * 使用 Supabase Client 直接查詢和清理
 */

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://pfqvdacxowpgfamuvnsn.supabase.co'
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY || ''

const supabase = createClient(supabaseUrl, supabaseServiceKey)

interface Tour {
  id: string
  code: string
  created_at: string
  [key: string]: any
}

async function checkDuplicates() {
  console.log('🔍 檢查重複的旅遊團資料...\n')

  // 取得所有旅遊團
  const { data: tours, error } = await supabase
    .from('tours')
    .select('id, code, created_at, name, location')
    .order('code')
    .order('created_at')

  if (error) {
    console.error('❌ 查詢失敗:', error)
    return
  }

  if (!tours || tours.length === 0) {
    console.log('✅ 沒有旅遊團資料')
    return
  }

  // 按 code 分組
  const grouped = new Map<string, Tour[]>()
  for (const tour of tours) {
    if (!grouped.has(tour.code)) {
      grouped.set(tour.code, [])
    }
    grouped.get(tour.code)!.push(tour)
  }

  // 找出重複的
  const duplicates = Array.from(grouped.entries())
    .filter(([_, tours]) => tours.length > 1)
    .map(([code, tours]) => ({ code, tours }))

  if (duplicates.length === 0) {
    console.log('✅ 沒有重複的旅遊團')
    return
  }

  console.log(`⚠️ 發現 ${duplicates.length} 組重複的旅遊團:\n`)

  for (const { code, tours } of duplicates) {
    console.log(`📋 ${code} (${tours.length} 筆):`)
    tours.forEach((tour, index) => {
      const marker = index === 0 ? '✅ [保留]' : '❌ [待刪除]'
      console.log(
        `   ${marker} ${tour.id} - ${tour.created_at} - ${(tour as any).name || (tour as any).location || ''}`
      )
    })
    console.log()
  }

  return duplicates
}

async function cleanupDuplicates(duplicates: { code: string; tours: Tour[] }[]) {
  console.log('🧹 開始清理重複資料...\n')

  for (const { code, tours } of duplicates) {
    // 保留最早創建的，刪除其他的
    const toKeep = tours[0]
    const toDelete = tours.slice(1)

    console.log(`處理 ${code}:`)
    console.log(`  保留: ${toKeep.id}`)

    for (const tour of toDelete) {
      const { error } = await supabase.from('tours').delete().eq('id', tour.id)

      if (error) {
        console.error(`  ❌ 刪除失敗 ${tour.id}:`, error)
      } else {
        console.log(`  ✅ 已刪除 ${tour.id}`)
      }
    }
  }

  console.log('\n✅ 清理完成')
}

async function main() {
  const duplicates = await checkDuplicates()

  if (!duplicates || duplicates.length === 0) {
    process.exit(0)
  }

  // 詢問是否執行清理
  console.log('要執行清理嗎? (輸入 yes 確認)')
  const readline = require('readline').createInterface({
    input: process.stdin,
    output: process.stdout,
  })

  readline.question('> ', async (answer: string) => {
    if (answer.toLowerCase() === 'yes') {
      await cleanupDuplicates(duplicates)
    } else {
      console.log('❌ 已取消')
    }
    readline.close()
    process.exit(0)
  })
}

main()
