/**
 * 從舊的 Supabase 資料庫匯出供應商資料
 */

const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
const path = require('path')

// Supabase 連接資訊（當前 Venturo 資料庫）
const supabaseUrl = 'https://pfqvdacxowpgfamuvnsn.supabase.co'
const supabaseKey =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBmcXZkYWN4b3dwZ2ZhbXV2bnNuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkxMDgzMjAsImV4cCI6MjA3NDY4NDMyMH0.LIMG0qmHixTPcbdzJrh4h0yTp8mh3FlggeZ6Bi_NwtI'

const supabase = createClient(supabaseUrl, supabaseKey)

async function exportSuppliers() {
  console.log('🔄 正在連接 Supabase...')
  console.log(`📍 URL: ${supabaseUrl}`)

  try {
    const { data, error, count } = await supabase.from('suppliers').select('*', { count: 'exact' })

    if (error) {
      console.error('❌ 錯誤:', error.message)
      console.error('詳細:', error)
      return
    }

    console.log(`✅ 成功取得供應商資料！`)
    console.log(`📊 供應商數量: ${data?.length || 0}`)

    if (data && data.length > 0) {
      // 儲存為 JSON
      const outputPath = path.join(__dirname, 'suppliers_export.json')
      fs.writeFileSync(outputPath, JSON.stringify(data, null, 2), 'utf-8')
      console.log(`💾 資料已儲存至: ${outputPath}`)

      // 顯示前3筆資料預覽
      console.log('\n📋 資料預覽（前3筆）:')
      data.slice(0, 3).forEach((supplier, index) => {
        console.log(`\n[${index + 1}] ${supplier.supplier_name || supplier.supplierName || 'N/A'}`)
        console.log(`    編號: ${supplier.supplier_code || supplier.supplierCode || 'N/A'}`)
        console.log(`    類型: ${supplier.supplier_type || supplier.supplierType || 'N/A'}`)
      })

      return data
    } else {
      console.log('⚠️  沒有找到供應商資料')
    }
  } catch (err) {
    console.error('❌ 發生錯誤:', err.message)
    console.error(err)
  }
}

// 執行匯出
exportSuppliers()
  .then(() => {
    console.log('\n✨ 匯出完成！')
    process.exit(0)
  })
  .catch(err => {
    console.error('❌ 匯出失敗:', err)
    process.exit(1)
  })
